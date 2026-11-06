'use strict';
/**
 * موقع حجوزات فنادق مكة — أسس المسافر
 * Express + SQLite (مدمجة) — بدون خدمات خارجية عدا بوابات الدفع.
 */
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const D = require('./lib/db');
const { q, UPLOAD_DIR, setting, allSettings, setSetting, isDate, nightsBetween, todayRiyadh, quote, availableRooms, newRef, slugify } = D;
const V = require('./lib/views');
const { esc, pages, policyText, baseUrl } = V;
const AV = require('./lib/admin-views');
const pay = require('./lib/payments');
const notify = require('./lib/notify');
const I = require('./lib/i18n');

const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.SESSION_SECRET || (PROD ? '' : 'dev-secret-change-me');
if (PROD && (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10 || !SECRET)) { console.error('✗ في الإنتاج يجب ضبط ADMIN_PASSWORD (10 أحرف فأكثر) و SESSION_SECRET'); process.exit(1); }
if (!ADMIN_PASSWORD) console.warn('⚠️  ADMIN_PASSWORD غير مضبوط — لوحة الإدارة معطّلة');
const HTTPS = /^https:/.test(process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || '');

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY !== '0') app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", 'data:'], styleSrc: ["'self'"], scriptSrc: ["'self'"], fontSrc: ["'self'"], connectSrc: ["'self'"], formAction: ["'self'"], frameAncestors: ["'none'"], baseUri: ["'self'"], objectSrc: ["'none'"], upgradeInsecureRequests: HTTPS ? [] : null } },
  hsts: HTTPS ? { maxAge: 31536000, includeSubDomains: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
if (PROD && HTTPS) app.use((req, res, next) => (req.secure ? next() : res.redirect(301, baseUrl() + req.originalUrl)));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: PROD ? '7d' : 0 }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', setHeaders: (r) => r.setHeader('X-Content-Type-Options', 'nosniff') }));

// ---------- كوكيز، CSRF، جلسة الإدارة ----------
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
const parseCookies = (req) => Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean).map((c) => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const setCookie = (res, name, value, maxAge) => res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${HTTPS ? '; Secure' : ''}`);
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

// ---------- اللغة: العربية افتراضيًا، والإنجليزية تحت /en ----------
app.use((req, res, next) => {
  const isAdmin = /^\/admin(\/|$)/.test(req.path);
  let en = false;
  if (/^\/en(\/|\?|$)/.test(req.url)) { en = true; req.url = req.url.replace(/^\/en/, '') || '/'; if (req.url[0] === '?') req.url = '/' + req.url; }
  else if (/^\/pay(\/|$)/.test(req.path) && (req.headers.cookie || '').includes('lang=en')) en = true; // عودة بوابة الدفع
  if (isAdmin) en = false;
  const url = req.url;
  if (!isAdmin && req.method === 'GET' && !/^\/(pay|booking|healthz|robots|sitemap)/.test(req.path)) setCookie(res, 'lang', en ? 'en' : 'ar', 86400 * 180);
  if (en) {
    const redir = res.redirect.bind(res);
    res.redirect = (a, b) => { let st = 302, u = a; if (typeof a === 'number') { st = a; u = b; } if (typeof u === 'string' && u[0] === '/' && !/^\/(en|admin|uploads|brand|fonts)(\/|$|\?)/.test(u)) u = '/en' + (u === '/' ? '' : u); return redir(st, u); };
  }
  const send = res.send.bind(res);
  res.send = (b) => {
    if (typeof b === 'string' && !isAdmin && b.startsWith('<!doctype html')) {
      if (en) {
        b = I.translateHtml(b).replace('<html lang="ar" dir="rtl">', '<html lang="en" dir="ltr">').replace('content="ar_SA"', 'content="en_US"')
          .replace(/(href|action)="\/(?!\/|en(?:\/|")|admin|uploads|brand|fonts|style\.css|app\.js|robots|sitemap)([^"]*)"/g, '$1="/en/$2"').replace(/(href|action)="\/"/g, '$1="/en"');
      }
    }
    return send(b);
  };
  I.als.run({ lang: en ? 'en' : 'ar', url }, next);
});

app.use((req, res, next) => {
  const c = parseCookies(req);
  req.cookies = c;
  let cid = c._c;
  if (!cid || !/^[\w-]{20,}$/.test(cid)) { cid = crypto.randomBytes(24).toString('base64url'); setCookie(res, '_c', cid, 86400 * 30); }
  req.csrfToken = sign('csrf:' + cid);
  res.locals.csrf = `<input type="hidden" name="_csrf" value="${req.csrfToken}">`;
  const isUpload = req.method === 'POST' && /^\/admin\/hotels(\/\d+)?$/.test(req.path) && /^multipart\/form-data/.test(req.headers['content-type'] || '');
  if (req.method === 'POST' && !isUpload) { // رفع الصور يتحقق من الرمز داخل مساره بعد multer
    const origin = req.headers.origin;
    if (origin && baseUrl() && origin !== baseUrl() && origin !== `${req.protocol}://${req.headers.host}`) return res.status(403).send('طلب مرفوض');
    if (!safeEq(req.body && req.body._csrf || '', req.csrfToken)) return res.status(403).send('انتهت صلاحية الصفحة، حدّثها وأعد المحاولة');
  }
  // استبدال __CSRF__ في صفحات الإدارة
  const send = res.send.bind(res);
  res.send = (b) => send(typeof b === 'string' ? b.replace('__CSRF__', res.locals.csrf) : b);
  next();
});

const sessionOk = (req) => {
  const t = req.cookies._a; if (!t) return false;
  const [exp, sig] = t.split('.');
  return Number(exp) > Date.now() && safeEq(sig || '', sign('admin:' + exp));
};
const adminOnly = (req, res, next) => (ADMIN_PASSWORD && sessionOk(req) ? next() : res.redirect('/admin/login'));

const globalLimiter = rateLimit({ windowMs: 60000, limit: 240, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 600000, limit: 30, standardHeaders: true, legacyHeaders: false, message: 'محاولات كثيرة، حاول لاحقًا' });
const loginLimiter = rateLimit({ windowMs: 900000, limit: 8, standardHeaders: true, legacyHeaders: false, message: 'محاولات دخول كثيرة، حاول بعد 15 دقيقة' });
app.use(globalLimiter);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- أدوات ----------
const int = (v, d = 0) => { const n = parseInt(String(v ?? '').replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)), 10); return Number.isFinite(n) ? n : d; };
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, max);
const normPhone = (p) => { let d = String(p || '').replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^\d+]/g, ''); if (/^\+?966/.test(d)) d = d.replace(/^\+?966/, '0'); d = d.replace(/^00/, '+'); return d; };
const phoneOk = (p) => /^(05\d{8}|\+?\d{8,15})$/.test(p);
const cover = '(SELECT filename FROM hotel_images WHERE hotel_id=h.id ORDER BY is_cover DESC,id LIMIT 1)';

function parseSearch(qs) {
  const today = todayRiyadh();
  const v = { in: clean(qs.in, 10), out: clean(qs.out, 10), rooms: Math.min(9, Math.max(1, int(qs.rooms, 1))), guests: Math.min(40, Math.max(1, int(qs.guests, 2))) };
  let err = '';
  const searched = !!(v.in && v.out);
  if (searched) {
    if (!isDate(v.in) || !isDate(v.out)) err = 'تاريخ غير صحيح';
    else if (v.in < today) err = 'تاريخ الوصول يجب ألا يكون في الماضي';
    else if (nightsBetween(v.in, v.out) < 1) err = 'تاريخ المغادرة يجب أن يكون بعد الوصول';
    else if (nightsBetween(v.in, v.out) > 30) err = 'أقصى مدة للحجز عبر الموقع 30 ليلة، تواصل معنا للمدد الأطول';
  }
  return { v, today, searched: searched && !err, err };
}
function evalRoom(r, s) { // يحسب السعر والتوفر والملاءمة لغرفة
  if (Math.ceil(s.v.guests / s.v.rooms) > r.capacity) return { ...r, err: `سعة الغرفة ${r.capacity} نزلاء — زد عدد الغرف` };
  if (r.rates_only && quote(r, s.v.in, s.v.out, 1).uncovered) return { ...r, err: 'الأسعار غير متوفرة لهذه التواريخ — تواصل معنا' };
  const avail = availableRooms(r, s.v.in, s.v.out);
  if (avail < s.v.rooms) return { ...r, err: avail ? `متاح ${avail} غرفة فقط` : 'غير متاح في هذه التواريخ' };
  return { ...r, avail, quote: quote(r, s.v.in, s.v.out, s.v.rooms) };
}

// ---------- صفحات الزوار ----------
app.get('/healthz', (req, res) => res.type('text').send('ok'));
app.get('/', (req, res) => {
  const s = parseSearch(req.query);
  const hotels = q.all(`SELECT h.*, ${cover} AS cover, (SELECT MIN(base_price) FROM room_types WHERE hotel_id=h.id AND is_active=1) AS price_from FROM hotels h WHERE is_active=1 ORDER BY sort, distance_m LIMIT 6`);
  res.send(pages.home({ hotels, today: s.today, v: s.v }));
});
app.get('/hotels', (req, res) => {
  const s = parseSearch(req.query);
  let hotels = q.all(`SELECT h.*, ${cover} AS cover FROM hotels h WHERE is_active=1 ORDER BY sort, distance_m`);
  hotels = hotels.map((h) => {
    const rooms = q.all('SELECT * FROM room_types WHERE hotel_id=? AND is_active=1', h.id);
    if (!s.searched) return { ...h, price_from: rooms.length ? Math.min(...rooms.map((r) => r.base_price)) : null };
    const ok = rooms.map((r) => evalRoom(r, s)).filter((r) => r.quote);
    return ok.length ? { ...h, price_from: Math.min(...ok.map((r) => r.quote.avg)) } : { ...h, unavailable: true };
  });
  if (s.searched) hotels.sort((a, b) => (a.unavailable ? 1 : 0) - (b.unavailable ? 1 : 0));
  res.send(pages.hotels({ hotels, today: s.today, v: s.v, searched: s.searched }));
});
app.get('/hotels/:slug', (req, res) => {
  const h = q.get('SELECT * FROM hotels WHERE slug=? AND is_active=1', req.params.slug);
  if (!h) return res.status(404).send(pages.notFound());
  const s = parseSearch(req.query);
  const images = q.all('SELECT * FROM hotel_images WHERE hotel_id=? ORDER BY is_cover DESC,id', h.id);
  let rooms = q.all('SELECT * FROM room_types WHERE hotel_id=? AND is_active=1 ORDER BY base_price', h.id);
  if (s.searched) rooms = rooms.map((r) => evalRoom(r, s));
  res.send(pages.hotel({ h, images, rooms, v: s.v, today: s.today, searched: s.searched, err: s.err }));
});

function bookingContext(src) {
  const s = parseSearch(src);
  if (!s.searched) return { error: s.err || 'اختر التواريخ أولًا' };
  const r = q.get('SELECT * FROM room_types WHERE id=? AND is_active=1', int(src.room));
  const h = r && q.get('SELECT * FROM hotels WHERE id=? AND is_active=1', r.hotel_id);
  if (!h) return { error: 'الغرفة غير موجودة' };
  const e = evalRoom(r, s);
  if (e.err) return { error: e.err, h, r, s };
  return { h, r, s, qt: e.quote, avail: e.avail };
}
app.get('/book', (req, res) => {
  const c = bookingContext(req.query);
  if (c.error) return res.status(400).send(pages.notFound().replace('الصفحة غير موجودة', esc(c.error)));
  res.send(pages.book({ h: c.h, r: c.r, v: c.s.v, q: c.qt, avail: c.avail, csrf: res.locals.csrf }));
});
app.post('/book', writeLimiter, (req, res) => {
  const b = req.body;
  const c = bookingContext({ ...b, room: b.room });
  if (c.error) return res.status(400).send(pages.notFound().replace('الصفحة غير موجودة', esc(c.error)));
  const form = { name: clean(b.name, 80), phone: normPhone(b.phone), email: clean(b.email, 100), nationality: clean(b.nationality, 40), notes: clean(b.notes, 500) };
  let err = '';
  if (form.name.length < 3) err = 'اكتب الاسم الكامل';
  else if (!phoneOk(form.phone)) err = 'رقم الجوال غير صحيح';
  else if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err = 'البريد الإلكتروني غير صحيح';
  else if (b.agree !== '1') err = 'يجب الموافقة على الشروط والأحكام';
  if (err) return res.status(400).send(pages.book({ h: c.h, r: c.r, v: c.s.v, q: c.qt, avail: c.avail, csrf: res.locals.csrf, err, form }));
  // إدخال ذري: نتحقق من التوفر ونحجز في نفس العملية المتزامنة (Node أحادي الخيط)
  const fresh = availableRooms(c.r, c.s.v.in, c.s.v.out);
  if (fresh < c.s.v.rooms) return res.status(409).send(pages.notFound().replace('الصفحة غير موجودة', 'نفدت الغرف لهذه التواريخ للتو'));
  const ref = newRef();
  const exp = new Date(Date.now() + Number(setting('hold_minutes') || 30) * 60000).toISOString();
  q.run(`INSERT INTO bookings(ref,hotel_id,room_type_id,hotel_name,room_name,check_in,check_out,nights,rooms,guests,total,vat,guest_name,phone,email,nationality,notes,status,expires_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?)`, ref, c.h.id, c.r.id, c.h.name, c.r.name, c.s.v.in, c.s.v.out, c.qt.nights, c.s.v.rooms, c.s.v.guests, c.qt.total, c.qt.vat, form.name, form.phone, form.email, form.nationality, form.notes, exp);
  q.run('UPDATE bookings SET hotel_name_en=?, room_name_en=? WHERE ref=?', c.h.name_en || null, c.r.name_en || null, ref);
  if (c.r.on_request) q.run("UPDATE bookings SET status='request', expires_at=NULL WHERE ref=?", ref);
  notify.bookingEvent(q.get('SELECT * FROM bookings WHERE ref=?', ref), c.r.on_request ? 'request' : 'new');
  setCookie(res, 'b_' + ref, sign('b:' + ref), 86400 * 30); // يسمح لصاحب المتصفح بفتح حجزه
  res.redirect(303, c.r.on_request ? `/booking/${ref}` : `/booking/${ref}/pay`);
});

// الوصول للحجز: بكوكي الحجز (نفس المتصفح) أو بعد التحقق برقم الجوال
const bookingAccess = (req, ref) => safeEq(req.cookies['b_' + ref] || '', sign('b:' + ref));
const grantAccess = (res, ref) => setCookie(res, 'b_' + ref, sign('b:' + ref), 86400 * 30);
function loadBooking(req, res) {
  const ref = clean(req.params.ref, 20).toUpperCase();
  const b = q.get('SELECT * FROM bookings WHERE ref=?', ref);
  if (!b || !bookingAccess(req, ref)) { res.redirect('/booking-lookup'); return null; }
  return b;
}
app.get('/booking-lookup', (req, res) => res.send(pages.lookup({ csrf: res.locals.csrf })));
app.post('/booking-lookup', loginLimiter, (req, res) => {
  const ref = clean(req.body.ref, 20).toUpperCase();
  const b = q.get('SELECT * FROM bookings WHERE ref=?', ref);
  if (!b || normPhone(req.body.phone) !== normPhone(b.phone)) return res.status(404).send(pages.lookup({ err: 'لم نجد حجزًا بهذه البيانات', csrf: res.locals.csrf }));
  grantAccess(res, ref);
  res.redirect(303, '/booking/' + ref);
});
app.get('/booking/:ref', wrap(async (req, res) => {
  let b = loadBooking(req, res); if (!b) return;
  if (b.status === 'pending') b = await pay.settle(b);
  res.send(pages.voucher({ b, s: allSettings(), csrf: res.locals.csrf, notice: req.query.n === 'cancelled' ? 'تم إلغاء الحجز' : '' }));
}));
app.get('/booking/:ref/pay', (req, res) => {
  const b = loadBooking(req, res); if (!b) return;
  if (b.status !== 'pending') return res.redirect('/booking/' + b.ref);
  res.send(pages.pay({ b, methods: pay.gatewayList(), s: allSettings(), csrf: res.locals.csrf }));
});
app.post('/booking/:ref/pay', writeLimiter, wrap(async (req, res) => {
  const b = loadBooking(req, res); if (!b) return;
  if (b.status !== 'pending') return res.redirect(303, '/booking/' + b.ref);
  const s = allSettings(); const method = clean(req.body.method, 20);
  const again = (err) => res.status(400).send(pages.pay({ b, methods: pay.gatewayList(), s, csrf: res.locals.csrf, err }));
  if (method === 'bank_transfer' && s.enable_bank_transfer === '1') {
    q.run("UPDATE bookings SET status='awaiting_transfer', pay_method='bank_transfer', expires_at=? WHERE id=?", new Date(Date.now() + Number(s.transfer_hold_hours || 24) * 3600000).toISOString(), b.id);
    notify.bookingEvent(q.get('SELECT * FROM bookings WHERE id=?', b.id), 'transfer');
    return res.redirect(303, '/booking/' + b.ref);
  }
  if (method === 'pay_later' && s.enable_pay_later === '1') {
    q.run("UPDATE bookings SET status='pay_later', pay_method='pay_later', expires_at=? WHERE id=?", new Date(Date.now() + 24 * 3600000).toISOString(), b.id);
    notify.bookingEvent(q.get('SELECT * FROM bookings WHERE id=?', b.id), 'later');
    return res.redirect(303, '/booking/' + b.ref);
  }
  try {
    const base = baseUrl() || `${req.protocol}://${req.headers.host}`;
    const url = await pay.startBooking(b, method, base);
    // نمدّد الحجز أثناء إتمام الدفع
    q.run('UPDATE bookings SET expires_at=? WHERE id=?', new Date(Date.now() + 40 * 60000).toISOString(), b.id);
    res.send(pages.redirecting(url));
  } catch (e) { console.error('pay start', e.message); again('تعذّر بدء الدفع الآن، حاول مجددًا أو اختر طريقة أخرى'); }
}));
// عودة البوابة (GET من المتصفح أو POST/webhook): نتحقق من خادم البوابة ولا نثق بالمعطيات
app.all('/pay/return/:ref', wrap(async (req, res) => {
  const ref = clean(req.params.ref, 20).toUpperCase();
  let b = q.get('SELECT * FROM bookings WHERE ref=?', ref);
  if (!b) return res.status(404).end();
  b = await pay.settle(b);
  if (req.method === 'GET') { grantAccess(res, ref); return res.redirect(303, '/booking/' + ref); }
  res.json({ ok: true }); // webhook
}));
app.post('/booking/:ref/cancel', writeLimiter, (req, res) => {
  const b = loadBooking(req, res); if (!b) return;
  if (b.status === 'cancelled') return res.redirect(303, '/booking/' + b.ref);
  q.run("UPDATE bookings SET status='cancelled', expires_at=NULL, admin_note=COALESCE(admin_note,'')||? WHERE id=?", `\n[إلغاء من العميل ${new Date().toISOString().slice(0, 16)}${b.status === 'confirmed' ? ' — مدفوع: يتطلب مراجعة الاسترداد' : ''}]`, b.id);
  notify.bookingEvent(q.get('SELECT * FROM bookings WHERE id=?', b.id), 'cancelled');
  res.redirect(303, `/booking/${b.ref}?n=cancelled`);
});

// ---------- روابط الدفع (يرسلها الموظف للعميل) ----------
const loadLink = (req) => { const l = q.get('SELECT * FROM pay_links WHERE token=?', clean(req.params.token, 40)); return l && (l.status === 'paid' || !l.expires_at || l.expires_at > new Date().toISOString()) ? l : null; };
app.get('/pay/l/:token', wrap(async (req, res) => {
  let l = loadLink(req); if (!l) return res.status(404).send(pages.notFound().replace('الصفحة غير موجودة', 'الرابط غير صالح أو انتهت صلاحيته'));
  if (l.status !== 'paid') l = await pay.settleLink(l);
  res.send(pages.payLink({ l, methods: pay.gatewayList(), csrf: res.locals.csrf, s: allSettings() }));
}));
app.post('/pay/l/:token', writeLimiter, wrap(async (req, res) => {
  const l = loadLink(req); if (!l || l.status === 'paid') return res.redirect(303, '/pay/l/' + clean(req.params.token, 40));
  try {
    const url = await pay.startLink(l, clean(req.body.method, 20), baseUrl() || `${req.protocol}://${req.headers.host}`);
    res.send(pages.redirecting(url));
  } catch (e) { console.error('link pay', e.message); res.status(400).send(pages.payLink({ l, methods: pay.gatewayList(), csrf: res.locals.csrf, s: allSettings(), err: 'تعذّر بدء الدفع الآن، حاول مجددًا' })); }
}));
app.all('/pay/lr/:token', wrap(async (req, res) => {
  const l = q.get('SELECT * FROM pay_links WHERE token=?', clean(req.params.token, 40)); if (!l) return res.status(404).end();
  await pay.settleLink(l);
  if (req.method === 'GET') return res.redirect(303, '/pay/l/' + l.token);
  res.json({ ok: true });
}));

// صفحات نظامية
const S = () => allSettings();
app.get('/terms', (req, res) => res.send(pages.text('الشروط والأحكام', policyText('terms', S()), 'terms')));
app.get('/privacy', (req, res) => res.send(pages.text('سياسة الخصوصية', policyText('privacy', S()), 'privacy')));
app.get('/cancellation', (req, res) => res.send(pages.text('سياسة الإلغاء والاسترداد', policyText('cancel', S()), 'cancellation')));
app.get('/about', (req, res) => res.send(pages.text('من نحن', policyText('about', S()), 'about')));
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nDisallow: /admin\nDisallow: /booking\nDisallow: /pay\nDisallow: /en/booking\nDisallow: /en/pay\nDisallow: /en/booking-lookup\nSitemap: ${baseUrl() || `${req.protocol}://${req.headers.host}`}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const b = baseUrl() || `${req.protocol}://${req.headers.host}`;
  const ar = ['/', '/hotels', '/about', '/terms', '/privacy', '/cancellation', ...q.all('SELECT slug FROM hotels WHERE is_active=1').map((h) => '/hotels/' + encodeURIComponent(h.slug))];
  const urls = [...ar, ...ar.map((u) => '/en' + (u === '/' ? '' : u))];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(b + u)}</loc></url>`).join('')}</urlset>`);
});

// ---------- الإدارة ----------
const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
app.use('/admin', noStore);
app.get('/admin/login', (req, res) => res.send(AV.login(ADMIN_PASSWORD ? '' : 'لم يُضبط ADMIN_PASSWORD على الخادم', res.locals.csrf)));
app.post('/admin/login', loginLimiter, (req, res) => {
  const ok = ADMIN_PASSWORD && safeEq(crypto.createHash('sha256').update(String(req.body.password || '')).digest('hex'), crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex'));
  if (!ok) return res.status(401).send(AV.login('كلمة المرور غير صحيحة', res.locals.csrf));
  const exp = String(Date.now() + 12 * 3600000);
  setCookie(res, '_a', `${exp}.${sign('admin:' + exp)}`, 12 * 3600);
  res.redirect(303, '/admin');
});
app.post('/admin/logout', (req, res) => { setCookie(res, '_a', '', 0); res.redirect(303, '/admin/login'); });
app.use('/admin', adminOnly);

app.get('/admin', (req, res) => {
  const filter = clean(req.query.status, 20);
  const where = ['request', 'pending', 'confirmed', 'awaiting_transfer', 'pay_later', 'cancelled'].includes(filter) ? 'WHERE status=?' : '';
  const rows = q.all(`SELECT * FROM bookings ${where} ORDER BY id DESC LIMIT 300`, ...(where ? [filter] : []));
  const stats = {
    confirmed: q.get("SELECT COUNT(*) c FROM bookings WHERE status='confirmed'").c,
    revenue: q.get("SELECT COALESCE(SUM(total),0) t FROM bookings WHERE status='confirmed'").t,
    open: q.get("SELECT COUNT(*) c FROM bookings WHERE status IN ('request','awaiting_transfer','pay_later')").c,
  };
  res.send(AV.bookings({ rows, stats, filter: where ? filter : '' }));
});
app.get('/admin/bookings/:id', (req, res) => {
  const b = q.get('SELECT * FROM bookings WHERE id=?', int(req.params.id));
  if (!b) return res.status(404).send(pages.notFound());
  res.send(AV.booking({ b, payments: q.all('SELECT * FROM payments WHERE booking_id=? ORDER BY id DESC', b.id), csrf: res.locals.csrf }));
});
app.post('/admin/bookings/:id', (req, res) => {
  const st = clean(req.body.status, 20);
  if (!['request', 'pending', 'awaiting_transfer', 'pay_later', 'confirmed', 'cancelled'].includes(st)) return res.status(400).end();
  const b = q.get('SELECT * FROM bookings WHERE id=?', int(req.params.id)); if (!b) return res.status(404).end();
  const paidAt = st === 'confirmed' && !b.paid_at ? new Date().toISOString() : b.paid_at;
  q.run('UPDATE bookings SET status=?, admin_note=?, paid_at=?, expires_at=? WHERE id=?', st, clean(req.body.admin_note, 2000), paidAt, st === 'confirmed' || st === 'cancelled' ? null : (b.expires_at || new Date(Date.now() + 86400000).toISOString()), b.id);
  if (st === 'confirmed' && !b.pay_method) q.run("UPDATE bookings SET pay_method='manual' WHERE id=?", b.id);
  res.redirect(303, '/admin/bookings/' + b.id);
});

app.post('/admin/reprice', (req, res) => {
  const m = Math.max(0, Math.min(200, int(setting('markup_percent'), 12)));
  q.run('UPDATE rates SET price=CAST((cost*(100+?)+99)/100 AS INTEGER) WHERE cost>0', m);
  q.run('UPDATE room_types SET base_price=CAST((base_cost*(100+?)+99)/100 AS INTEGER) WHERE base_cost>0', m);
  res.redirect(303, '/admin/settings?ok=1');
});
app.post('/admin/hotels-activate', (req, res) => { q.run('UPDATE hotels SET is_active=1 WHERE id IN (SELECT DISTINCT hotel_id FROM room_types WHERE is_active=1)'); res.redirect(303, '/admin/hotels'); });
app.get('/admin/hotels', (req, res) => res.send(AV.hotels({ rows: q.all('SELECT h.*, (SELECT COUNT(*) FROM room_types WHERE hotel_id=h.id) rooms FROM hotels h ORDER BY sort, id'), csrf: res.locals.csrf })));
const hotelPage = (req, res, id, err) => {
  const h = id ? q.get('SELECT * FROM hotels WHERE id=?', id) : null;
  if (id && !h) return res.status(404).send(pages.notFound());
  const rooms = id ? q.all('SELECT * FROM room_types WHERE hotel_id=? ORDER BY base_price', id) : [];
  res.send(AV.hotelForm({ h, images: id ? q.all('SELECT * FROM hotel_images WHERE hotel_id=? ORDER BY is_cover DESC,id', id) : [], rooms, rates: rooms.length ? q.all(`SELECT * FROM rates WHERE room_type_id IN (${rooms.map(() => '?').join(',')}) ORDER BY from_date`, ...rooms.map((r) => r.id)) : [], csrf: res.locals.csrf, err }));
};
app.get('/admin/hotels/new', (req, res) => hotelPage(req, res, 0));
app.get('/admin/hotels/:id', (req, res) => hotelPage(req, res, int(req.params.id)));

const IMG_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({ storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (r, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + (IMG_TYPES[f.mimetype] || '.bin')) }),
  limits: { fileSize: 6 * 1024 * 1024, files: 12 }, fileFilter: (r, f, cb) => cb(null, !!IMG_TYPES[f.mimetype]) });
// multer يحلّل multipart بعد وسيط CSRF، لذلك نتحقق من الرمز هنا لهذه المسارات
const multipartCsrf = (req, res, next) => {
  if (safeEq(req.body && req.body._csrf || '', req.csrfToken)) return next();
  for (const f of req.files || []) fs.rmSync(f.path, { force: true });
  res.status(403).send('رمز الحماية غير صالح');
};
function saveHotel(req, res) {
  const b = req.body; const id = int(req.params.id);
  const name = clean(b.name, 120); if (!name) return hotelPage(req, res, id, 'اسم الفندق مطلوب');
  const f = { stars: Math.min(5, Math.max(1, int(b.stars, 4))), district: clean(b.district, 60), address: clean(b.address, 200), distance_m: b.distance_m === '' ? null : Math.max(0, int(b.distance_m)), description: clean(b.description, 2000), amenities: clean(b.amenities, 500), license_no: clean(b.license_no, 60), kaaba_view: b.kaaba_view ? 1 : 0, is_active: b.is_active ? 1 : 0 };
  const en = [clean(b.name_en, 120), clean(b.district_en, 60), clean(b.address_en, 200), clean(b.description_en, 2000), clean(b.amenities_en, 500)];
  let hid = id;
  if (id) q.run('UPDATE hotels SET name=?,stars=?,district=?,address=?,distance_m=?,description=?,amenities=?,license_no=?,kaaba_view=?,is_active=? WHERE id=?', name, f.stars, f.district, f.address, f.distance_m, f.description, f.amenities, f.license_no, f.kaaba_view, f.is_active, id);
  else {
    let slug = slugify(name); if (q.get('SELECT 1 FROM hotels WHERE slug=?', slug)) slug += '-' + crypto.randomBytes(2).toString('hex');
    hid = Number(q.run('INSERT INTO hotels(slug,name,stars,district,address,distance_m,description,amenities,license_no,kaaba_view,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?)', slug, name, f.stars, f.district, f.address, f.distance_m, f.description, f.amenities, f.license_no, f.kaaba_view, f.is_active).lastInsertRowid);
  }
  q.run('UPDATE hotels SET name_en=?,district_en=?,address_en=?,description_en=?,amenities_en=? WHERE id=?', ...en, hid);
  const hasCover = q.get('SELECT 1 FROM hotel_images WHERE hotel_id=?', hid);
  const sniff = (file) => { try { const h = fs.readFileSync(file.path).subarray(0, 12); return (h[0] === 0xff && h[1] === 0xd8) || h.subarray(0, 4).toString('latin1') === '\x89PNG' || (h.subarray(0, 4).toString('latin1') === 'RIFF' && h.subarray(8, 12).toString('latin1') === 'WEBP'); } catch { return false; } };
  const goodFiles = (req.files || []).filter((file) => sniff(file) || (fs.rmSync(file.path, { force: true }), false));
  goodFiles.forEach((file, i) => q.run('INSERT INTO hotel_images(hotel_id,filename,is_cover) VALUES(?,?,?)', hid, file.filename, !hasCover && i === 0 ? 1 : 0));
  res.redirect(303, '/admin/hotels/' + hid);
}
app.post('/admin/hotels/:id/delete', (req, res) => {
  const id = int(req.params.id);
  for (const i of q.all('SELECT filename FROM hotel_images WHERE hotel_id=?', id)) fs.rm(path.join(UPLOAD_DIR, i.filename), () => {});
  q.run('DELETE FROM hotels WHERE id=?', id); res.redirect(303, '/admin/hotels');
});
app.post('/admin/images/:id/delete', (req, res) => {
  const i = q.get('SELECT * FROM hotel_images WHERE id=?', int(req.params.id));
  if (i) { q.run('DELETE FROM hotel_images WHERE id=?', i.id); fs.rm(path.join(UPLOAD_DIR, i.filename), () => {}); }
  res.redirect(303, i ? '/admin/hotels/' + i.hotel_id : '/admin/hotels');
});
function saveRoom(req, res) {
  const b = req.body; const hid = int(req.params.hid); const id = int(req.params.id);
  if (!q.get('SELECT 1 FROM hotels WHERE id=?', hid)) return res.status(404).end();
  const f = [clean(b.name, 80), Math.min(20, Math.max(1, int(b.capacity, 2))), Math.max(1, int(b.base_price)), Math.max(0, int(b.total_rooms, 1)), b.breakfast ? 1 : 0, clean(b.description, 300), b.is_active ? 1 : 0];
  if (!f[0]) return res.redirect(303, '/admin/hotels/' + hid);
  const enr = [clean(b.name_en, 80), clean(b.description_en, 300)];
  if (id) q.run('UPDATE room_types SET name=?,capacity=?,base_price=?,total_rooms=?,breakfast=?,description=?,is_active=? WHERE id=? AND hotel_id=?', ...f, id, hid);
  else q.run('INSERT INTO room_types(name,capacity,base_price,total_rooms,breakfast,description,is_active,hotel_id) VALUES(?,?,?,?,?,?,?,?)', ...f, hid);
  const rid = id || Number(q.get('SELECT last_insert_rowid() r').r);
  q.run('UPDATE room_types SET name_en=?,description_en=? WHERE id=?', ...enr, rid);
  res.redirect(303, '/admin/hotels/' + hid);
}
app.post('/admin/hotels/:hid/rooms', saveRoom);
app.post('/admin/hotels/:hid/rooms/:id', saveRoom);
app.post('/admin/rooms/:id/rates', (req, res) => {
  const r = q.get('SELECT * FROM room_types WHERE id=?', int(req.params.id)); if (!r) return res.status(404).end();
  const { from_date: a, to_date: z } = req.body;
  if (isDate(a) && isDate(z) && a <= z && int(req.body.price) > 0) q.run('INSERT INTO rates(room_type_id,from_date,to_date,price,label) VALUES(?,?,?,?,?)', r.id, a, z, int(req.body.price), clean(req.body.label, 40));
  res.redirect(303, '/admin/hotels/' + r.hotel_id);
});
app.post('/admin/rates/:id/delete', (req, res) => {
  const x = q.get('SELECT r.hotel_id FROM rates x JOIN room_types r ON r.id=x.room_type_id WHERE x.id=?', int(req.params.id));
  q.run('DELETE FROM rates WHERE id=?', int(req.params.id)); res.redirect(303, x ? '/admin/hotels/' + x.hotel_id : '/admin/hotels');
});

app.get('/admin/links', (req, res) => {
  const pre = { ref: clean(req.query.ref, 20), amount: clean(req.query.amount, 10), name: clean(req.query.name, 80), phone: clean(req.query.phone, 20), desc: clean(req.query.desc, 150) };
  const base = baseUrl() || `${req.protocol}://${req.headers.host}`;
  res.send(AV.links({ rows: q.all('SELECT * FROM pay_links ORDER BY id DESC LIMIT 100'), pre, base, csrf: res.locals.csrf, gateways: pay.gatewayList() }));
});
app.post('/admin/links', (req, res) => {
  const amount = int(req.body.amount); const desc = clean(req.body.description, 150);
  if (amount < 1 || !desc) return res.redirect(303, '/admin/links');
  let ref = clean(req.body.booking_ref, 20).toUpperCase(); if (ref && !q.get('SELECT 1 FROM bookings WHERE ref=?', ref)) ref = '';
  const hours = Math.min(720, Math.max(1, int(req.body.hours, 72)));
  q.run('INSERT INTO pay_links(token,code,amount,description,customer_name,phone,booking_ref,expires_at) VALUES(?,?,?,?,?,?,?,?)', crypto.randomBytes(18).toString('base64url'), D.newCode(), amount, desc, clean(req.body.customer_name, 80), normPhone(req.body.phone), ref, new Date(Date.now() + hours * 3600000).toISOString());
  res.redirect(303, '/admin/links');
});
app.post('/admin/links/:id/delete', (req, res) => { q.run("DELETE FROM pay_links WHERE id=? AND status!='paid'", int(req.params.id)); res.redirect(303, '/admin/links'); });

app.get('/admin/settings', (req, res) => res.send(AV.settings({ s: allSettings(), csrf: res.locals.csrf, saved: req.query.ok === '1', methods: pay.gatewayList(), notif: notify.status() })));
app.post('/admin/settings', (req, res) => {
  const b = req.body; const checks = ['enable_bank_transfer', 'enable_pay_later'];
  for (const k of Object.keys(D.DEFAULTS)) {
    if (checks.includes(k)) { setSetting(k, b[k] ? '1' : '0'); continue; }
    if (b[k] === undefined) continue;
    let v = clean(b[k], /^(policy_|about_text)/.test(k) ? 8000 : 200);
    if (k === 'sbc_cert_url' && v && !/^https:\/\/[^\s]+$/.test(v)) v = '';
    if (k === 'whatsapp') v = v.replace(/\D/g, '');
    if (['vat_rate', 'hold_minutes', 'cancel_free_hours', 'transfer_hold_hours', 'markup_percent'].includes(k)) v = String(Math.max(0, int(v, Number(D.DEFAULTS[k]))));
    setSetting(k, v);
  }
  res.redirect(303, '/admin/settings?ok=1');
});
app.get('/admin/compliance', (req, res) => {
  const s = allSettings(); const cnt = (t) => q.get(`SELECT COUNT(*) c FROM ${t}`).c;
  const items = [
    { ok: !!s.tourism_license, label: 'رقم ترخيص وزارة السياحة ظاهر في الموقع', hint: 'الإعدادات ← رقم ترخيص وزارة السياحة' },
    { ok: !!s.cr_number, label: 'رقم السجل التجاري ظاهر', hint: 'من المركز السعودي للأعمال' },
    { ok: !!s.vat_number, label: 'الرقم الضريبي ظاهر (السعر شامل 15%)', hint: 'من هيئة الزكاة والضريبة والجمارك' },
    { ok: !!(s.sbc_cert_no && s.sbc_cert_url), label: 'توثيق المتجر في المركز السعودي للأعمال مربوط (رقم + رابط)', hint: 'أضف رقم التوثيق ورابطه ليظهر في التذييل' },
    { ok: !!(s.phone || s.whatsapp) && !!s.address, label: 'وسيلة تواصل وعنوان واضحان' },
    { ok: !!(s.policy_terms && s.policy_cancel && s.policy_privacy), label: 'الشروط والإلغاء والخصوصية مراجَعة ومعتمدة منك (النصوص الافتراضية نموذجية فقط)', hint: 'الإعدادات ← النصوص النظامية' },
    { ok: pay.gatewayList().filter((g) => g.id !== 'mock').length > 0, label: 'بوابة دفع إلكتروني مرخّصة مفعّلة', hint: 'مفاتيح البوابة في متغيرات البيئة' },
    { ok: notify.status().email || notify.status().whatsapp, label: 'إشعارات الحجز الجديد (بريد/واتساب) مفعّلة', hint: 'SMTP_* أو WHATSAPP_TOKEN في متغيرات البيئة' },
    { ok: fs.existsSync(path.join(__dirname, 'public/brand/mot-logo.png')) && fs.existsSync(path.join(__dirname, 'public/brand/moc-logo.png')), label: 'شعارا وزارة السياحة ووزارة التجارة مرفوعان', hint: 'ضع mot-logo.png و moc-logo.png في public/brand من المصادر الرسمية' },
    { ok: process.env.NODE_ENV === 'production' && HTTPS, label: 'الموقع يعمل على HTTPS ووضع الإنتاج' },
    { ok: cnt('hotels') > 0 && q.get("SELECT COUNT(*) c FROM hotels WHERE is_active=1 AND (license_no IS NULL OR license_no='')").c === 0, label: 'كل فندق معروض له رقم ترخيص منشأة فندقية', hint: 'اختياري لكن مستحسن' },
  ];
  res.send(AV.compliance({ items }));
});

// رفع الملفات: نمرّر multer ثم نتحقق من CSRF (لأن multipart لا يُحلَّل بواسطة urlencoded)
app.post(['/admin/hotels', '/admin/hotels/:id'], (req, res, next) => {
  upload.array('images', 12)(req, res, (e) => (e ? res.status(400).send('تعذّر رفع الصور: ' + esc(e.message)) : multipartCsrf(req, res, () => saveHotel(req, res))));
});

app.use((req, res) => res.status(404).send(pages.notFound()));
app.use((err, req, res, next) => { console.error(err); res.status(500).send('حدث خطأ غير متوقع'); });

module.exports = { app };
if (require.main === module) {
  if (process.env.SKIP_SEED !== '1') {
    require('./lib/seed-hotels').run();
    // قائمة أسعار الموردين: تُستورد مرة واحدة (الفنادق مخفية حتى تراجعها وتفعّلها)
    if (!setting('imported:price-list-2026-11-03')) { try { const r = require('./scripts/import-rates').run(); console.log(`✓ استُوردت قائمة الأسعار: ${r.hotels} فندقًا`); } catch (e) { console.error('import failed', e.message); } }
  }
  const srv = app.listen(PORT, () => console.log(`✓ أسس المسافر يعمل على المنفذ ${PORT}`));
  for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => srv.close(() => process.exit(0)));
}
