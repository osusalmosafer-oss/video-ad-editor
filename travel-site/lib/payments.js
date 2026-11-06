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
    label: 'بطاقة مدى / فيزا / ماستركارد / Apple Pay (ميسر)',
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
    label: 'بطاقة / مدى / Apple Pay (تاب)',
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
    label: 'بطاقة / مدى / Apple Pay (باي تابس)',
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

async function startPayment(booking, method, baseUrl) {
  const p = PROVIDERS[method];
  if (!p || !p.enabled()) throw new Error('بوابة غير مفعّلة');
  const u = { callback: `${baseUrl}/pay/return/${booking.ref}`, ret: `${baseUrl}/pay/return/${booking.ref}`, back: `${baseUrl}/booking/${booking.ref}/pay` };
  const { ref, url } = await p.create(booking, u);
  if (!ref || !url) throw new Error('رد غير متوقع من البوابة');
  q.run('INSERT INTO payments(booking_id,provider,provider_ref,amount) VALUES(?,?,?,?)', booking.id, method, ref, booking.total);
  return url;
}

// يتحقق من آخر عملية دفع للحجز من خادم البوابة، ويؤكد الحجز عند نجاحها وتطابق المبلغ
async function settle(booking) {
  if (booking.status === 'confirmed') return booking;
  const pay = q.get("SELECT * FROM payments WHERE booking_id=? AND status='created' ORDER BY id DESC LIMIT 1", booking.id);
  if (!pay) return booking;
  const p = PROVIDERS[pay.provider];
  if (!p) return booking;
  try {
    const r = await p.verify(pay.provider_ref, booking);
    if (r.paid && (r.amount == null || r.amount === halalas(booking.total))) {
      q.run("UPDATE payments SET status='paid' WHERE id=?", pay.id);
      q.run("UPDATE bookings SET status='confirmed', pay_method=?, paid_at=?, expires_at=NULL WHERE id=? AND status!='cancelled'", pay.provider, new Date().toISOString(), booking.id);
    }
  } catch (e) { console.error('verify failed', pay.provider, e.message); }
  return q.get('SELECT * FROM bookings WHERE id=?', booking.id);
}

module.exports = { gatewayList, startPayment, settle, PROVIDERS };
