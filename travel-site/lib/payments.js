'use strict';
/**
 * بوابات الدفع — واجهة موحّدة. لإضافة بوابة جديدة: أضف كائنًا في PROVIDERS بثلاث دوال:
 *   enabled()               هل مفاتيحها موجودة في متغيرات البيئة؟
 *   create(booking, urls)   تنشئ جلسة دفع وتعيد { ref, url }
 *   verify(ref, booking)    تتحقق من حالة الدفع من خادم البوابة وتعيد { paid, amount }
 * المفاتيح السرية تُقرأ من متغيرات البيئة فقط — لا تُخزَّن في قاعدة البيانات ولا تظهر في الواجهة.
 * القاعدة الأمنية: لا نثق بأي معلومة ترد من المتصفح أو الـ webhook؛ نتحقق دائمًا من خادم البوابة بالمعرّف المخزّن عندنا.
 */
const crypto = require('node:crypto');
const { q } = require('./db');
const notify = require('./notify');

const env = (k) => (process.env[k] || '').trim();
const halalas = (sar) => Math.round(sar * 100);
async function http(url, opts) {
  const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(20000) });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = {}; }
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 200)}`);
  return json;
}

const PROVIDERS = {
  moyasar: {
    label: 'مدى / فيزا (ميسر)',
    enabled: () => !!env('MOYASAR_SECRET_KEY'),
    async create(b, u) {
      const auth = 'Basic ' + Buffer.from(env('MOYASAR_SECRET_KEY') + ':').toString('base64');
      const j = await http('https://api.moyasar.com/v1/invoices', {
        method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: halalas(b.total), currency: 'SAR', description: `حجز ${b.ref} - ${b.hotel_name}`,
          callback_url: u.callback, success_url: u.ret, back_url: u.back, metadata: { booking_ref: b.ref } }),
      });
      return { ref: j.id, url: j.url };
    },
    async verify(ref) {
      const auth = 'Basic ' + Buffer.from(env('MOYASAR_SECRET_KEY') + ':').toString('base64');
      const j = await http('https://api.moyasar.com/v1/invoices/' + encodeURIComponent(ref), { headers: { Authorization: auth } });
      return { paid: j.status === 'paid', amount: j.amount };
    },
  },
  tap: {
    label: 'مدى / فيزا (تاب)',
    enabled: () => !!env('TAP_SECRET_KEY'),
    async create(b, u) {
      const j = await http('https://api.tap.company/v2/charges', {
        method: 'POST', headers: { Authorization: 'Bearer ' + env('TAP_SECRET_KEY'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: b.total, currency: 'SAR', description: `Booking ${b.ref}`, reference: { order: b.ref },
          customer: { first_name: b.guest_name, phone: { country_code: '966', number: String(b.phone).replace(/\D/g, '').replace(/^(966|00966|0)/, '') } },
          source: { id: 'src_all' }, redirect: { url: u.ret }, post: { url: u.callback } }),
      });
      return { ref: j.id, url: j.transaction && j.transaction.url };
    },
    async verify(ref) {
      const j = await http('https://api.tap.company/v2/charges/' + encodeURIComponent(ref), { headers: { Authorization: 'Bearer ' + env('TAP_SECRET_KEY') } });
      return { paid: j.status === 'CAPTURED', amount: halalas(Number(j.amount)) };
    },
  },
  paytabs: {
    label: 'مدى / فيزا (باي تابس)',
    enabled: () => !!(env('PAYTABS_SERVER_KEY') && env('PAYTABS_PROFILE_ID')),
    base: () => env('PAYTABS_BASE_URL') || 'https://secure.paytabs.sa',
    async create(b, u) {
      const j = await http(this.base() + '/payment/request', {
        method: 'POST', headers: { authorization: env('PAYTABS_SERVER_KEY'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: Number(env('PAYTABS_PROFILE_ID')), tran_type: 'sale', tran_class: 'ecom', cart_id: b.ref,
          cart_description: `Booking ${b.ref}`, cart_currency: 'SAR', cart_amount: b.total, callback: u.callback, return: u.ret,
          customer_details: { name: b.guest_name, email: b.email || 'noemail@example.com', phone: b.phone, country: 'SA' } }),
      });
      return { ref: j.tran_ref, url: j.redirect_url };
    },
    async verify(ref) {
      const j = await http(this.base() + '/payment/query', {
        method: 'POST', headers: { authorization: env('PAYTABS_SERVER_KEY'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: Number(env('PAYTABS_PROFILE_ID')), tran_ref: ref }),
      });
      return { paid: j.payment_result && j.payment_result.response_status === 'A', amount: halalas(Number(j.cart_amount)) };
    },
  },
  // بوابة وهمية للتجربة المحلية فقط — تُرفض تلقائيًا في الإنتاج
  mock: {
    label: 'دفع تجريبي (للاختبار فقط)',
    enabled: () => env('MOCK_PAYMENTS') === '1' && process.env.NODE_ENV !== 'production',
    async create(b, u) { const ref = 'mock_' + crypto.randomBytes(6).toString('hex'); return { ref, url: u.ret + '?mock=1' }; },
    async verify() { return { paid: true, amount: null }; },
  },
};

const gatewayList = () => Object.entries(PROVIDERS).filter(([, p]) => p.enabled()).map(([id, p]) => ({ id, label: p.label }));

// order: حجز أو رابط دفع بنفس الحقول (ref,total,hotel_name,guest_name,phone,email)
async function startPayment(order, method, baseUrl, opts) {
  const p = PROVIDERS[method];
  if (!p || !p.enabled()) throw new Error('بوابة غير مفعّلة');
  const { ref, url } = await p.create(order, { callback: opts.ret, ret: opts.ret, back: opts.back });
  if (!ref || !url) throw new Error('رد غير متوقع من البوابة');
  q.run('INSERT INTO payments(booking_id,link_id,provider,provider_ref,amount) VALUES(?,?,?,?,?)', opts.bookingId || null, opts.linkId || null, method, ref, order.total);
  return url;
}
const bookingOrder = (b) => b;
const startBooking = (b, method, baseUrl) => startPayment(b, method, baseUrl, { bookingId: b.id, ret: `${baseUrl}/pay/return/${b.ref}`, back: `${baseUrl}/booking/${b.ref}/pay` });
const startLink = (l, method, baseUrl) => startPayment({ ref: l.code, total: l.amount, hotel_name: l.description, guest_name: l.customer_name || 'عميل', phone: l.phone || '0500000000', email: '' }, method, baseUrl, { linkId: l.id, ret: `${baseUrl}/pay/lr/${l.token}`, back: `${baseUrl}/pay/l/${l.token}` });

async function verifyPayment(pay, total) {
  const p = PROVIDERS[pay.provider]; if (!p) return false;
  try { const r = await p.verify(pay.provider_ref); return r.paid && (r.amount == null || r.amount === halalas(total)); }
  catch (e) { console.error('verify failed', pay.provider, e.message); return false; }
}
// يتحقق من آخر عملية دفع للحجز من خادم البوابة، ويؤكد الحجز عند نجاحها وتطابق المبلغ
async function settle(booking) {
  if (booking.status === 'confirmed') return booking;
  const pay = q.get("SELECT * FROM payments WHERE booking_id=? AND status='created' ORDER BY id DESC LIMIT 1", booking.id);
  if (!pay || !(await verifyPayment(pay, booking.total))) return booking;
  q.run("UPDATE payments SET status='paid' WHERE id=?", pay.id);
  const r = q.run("UPDATE bookings SET status='confirmed', pay_method=?, paid_at=?, expires_at=NULL WHERE id=? AND status!='cancelled' AND status!='confirmed'", pay.provider, new Date().toISOString(), booking.id);
  const fresh = q.get('SELECT * FROM bookings WHERE id=?', booking.id);
  if (r.changes) notify.bookingEvent(fresh, 'paid');
  return fresh;
}
async function settleLink(link) {
  if (link.status === 'paid') return link;
  const pay = q.get("SELECT * FROM payments WHERE link_id=? AND status='created' ORDER BY id DESC LIMIT 1", link.id);
  if (!pay || !(await verifyPayment(pay, link.amount))) return link;
  q.run("UPDATE payments SET status='paid' WHERE id=?", pay.id);
  const r = q.run("UPDATE pay_links SET status='paid', paid_at=? WHERE id=? AND status!='paid'", new Date().toISOString(), link.id);
  const fresh = q.get('SELECT * FROM pay_links WHERE id=?', link.id);
  if (r.changes) {
    notify.linkPaid(fresh);
    if (fresh.booking_ref) { // رابط مرتبط بحجز بكامل مبلغه يؤكد الحجز
      const b = q.get('SELECT * FROM bookings WHERE ref=?', fresh.booking_ref);
      if (b && b.status !== 'confirmed' && b.status !== 'cancelled' && fresh.amount >= b.total) {
        q.run("UPDATE bookings SET status='confirmed', pay_method=?, paid_at=?, expires_at=NULL WHERE id=?", pay.provider, new Date().toISOString(), b.id);
        notify.bookingEvent(q.get('SELECT * FROM bookings WHERE id=?', b.id), 'paid');
      }
    }
  }
  return fresh;
}

module.exports = { gatewayList, startBooking, startLink, settle, settleLink, PROVIDERS };
