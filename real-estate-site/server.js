'use strict';
/**
 * موقع العروض العقارية
 * - عروض أراضٍ (الموقع، السعر، المساحة، التفاصيل) + صور + فيديو تسويقي
 * - رابط خاص لكل عرض يُرسل للعميل (واتساب) + صفحة عرض قابلة للطباعة/PDF
 * - نموذج استفسار يحفظ العملاء المحتملين + لوحة إدارة بكلمة مرور
 */
const express = require('express');
const multer = require('multer');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

// ---------- الإعدادات (تُضبط من متغيرات البيئة) ----------
const PORT = Number(process.env.PORT || 3000);
const BRAND = process.env.BRAND_NAME || 'أوج';
const TAGLINE = process.env.BRAND_TAGLINE || 'للتسويق العقاري';
const WHATSAPP = (process.env.WHATSAPP || '966500000000').replace(/\D/g, ''); // رقم المنشأة بصيغة دولية
const FAL_LICENSE = process.env.FAL_LICENSE || ''; // رقم ترخيص الهيئة العامة للعقار
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('s:' + ADMIN_PASSWORD).digest('hex');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (ADMIN_PASSWORD === 'admin123') console.warn('⚠️  غيّر كلمة المرور: ADMIN_PASSWORD');

// ---------- قاعدة البيانات ----------
const db = new DatabaseSync(path.join(DATA_DIR, 'offers.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS listings(
  id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL, type TEXT DEFAULT 'أرض سكنية', city TEXT, district TEXT,
  location_url TEXT, lat REAL, lng REAL,
  price REAL, area REAL, deed_type TEXT, street_width TEXT, facade TEXT,
  description TEXT, features TEXT, ad_license TEXT,
  status TEXT DEFAULT 'available', is_public INTEGER DEFAULT 1,
  views INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS media(
  id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL,
  kind TEXT NOT NULL, filename TEXT NOT NULL, is_cover INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS leads(
  id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER, name TEXT, phone TEXT,
  message TEXT, status TEXT DEFAULT 'new', note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
const q = {
  all: (sql, ...a) => db.prepare(sql).all(...a),
  get: (sql, ...a) => db.prepare(sql).get(...a),
  run: (sql, ...a) => db.prepare(sql).run(...a),
};

// ---------- أدوات ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => (n == null || n === '' ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }));
const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(/[,٬\s]/g, '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return Number.isFinite(n) ? n : null; };
const STATUS = { available: 'متاح', reserved: 'محجوز', sold: 'مباع' };
const LEAD_STATUS = { new: 'جديد', contacted: 'تم التواصل', visit: 'زيارة', negotiating: 'تفاوض', closed: 'تم البيع', lost: 'ملغي' };
const pricePerM = (l) => (l.price && l.area ? Math.round(l.price / l.area) : null);
const baseUrl = (req) => (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const mapEmbed = (l) => (l.lat != null && l.lng != null
  ? `https://www.openstreetmap.org/export/embed.html?bbox=${l.lng - 0.01}%2C${l.lat - 0.007}%2C${l.lng + 0.01}%2C${l.lat + 0.007}&layer=mapnik&marker=${l.lat}%2C${l.lng}` : null);
const mapLink = (l) => l.location_url || (l.lat != null && l.lng != null ? `https://www.google.com/maps?q=${l.lat},${l.lng}` : '');
const normPhone = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0')) d = '966' + d.slice(1); if (d.length === 9 && d.startsWith('5')) d = '966' + d; return d; };

function offerMessage(l, url, name) {
  return [
    `السلام عليكم ${name ? name + ' ' : ''}ورحمة الله،`,
    `يسعدنا تزويدك بعرض: *${l.title}*`,
    `📍 ${[l.city, l.district].filter(Boolean).join(' - ')}`,
    `📐 المساحة: ${num(l.area)} م²`,
    `💰 السعر: ${num(l.price)} ريال${pricePerM(l) ? ` (${num(pricePerM(l))} ريال/م²)` : ''}`,
    `🔗 تفاصيل العرض كاملة مع الصور والفيديو:`,
    url,
    l.ad_license ? `رقم ترخيص الإعلان: ${l.ad_license}` : '',
    `${BRAND} ${TAGLINE}`,
  ].filter(Boolean).join('\n');
}

// ---------- الجلسات (للوحة الإدارة) ----------
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
const makeSession = () => { const exp = Date.now() + 7 * 864e5; return `${exp}.${sign(String(exp))}`; };
const validSession = (c) => { if (!c) return false; const [exp, sig] = c.split('.'); return !!sig && Number(exp) > Date.now() && crypto.timingSafeEqual(Buffer.from(sig.padEnd(64, '0').slice(0, 64)), Buffer.from(sign(exp))); };
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((s) => s.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, v.join('=')]));
const requireAdmin = (req, res, next) => { try { if (validSession(cookies(req).sid)) return next(); } catch { /* */ } res.redirect('/admin/login'); };
const attempts = new Map();

// ---------- الرفع ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_r, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + path.extname(f.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')),
  }),
  limits: { fileSize: 700 * 1024 * 1024, files: 30 },
  fileFilter: (_r, f, cb) => cb(null, /^(image|video)\//.test(f.mimetype) || /\.(jpe?g|png|webp|gif|heic|mp4|mov|m4v|webm)$/i.test(f.originalname)),
});

// ---------- القوالب ----------
const layout = (title, body, { admin = false, desc = '' } = {}) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc || `${BRAND} ${TAGLINE}`)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="icon" href="/brand/favicon.png"><link rel="stylesheet" href="/style.css"></head><body class="${admin ? 'admin' : ''}">
<header class="top"><div class="wrap bar">
<a class="brand" href="${admin ? '/admin' : '/'}"><img class="mark" src="/brand/symbol.png" alt=""><b>${esc(BRAND)}</b><small>${esc(TAGLINE)}</small></a>
<nav>${admin
    ? `<a href="/admin">العروض</a><a href="/admin/leads">العملاء</a><a href="/admin/listing/new" class="btn sm">+ عرض جديد</a><a href="/" target="_blank">الموقع</a><form method="post" action="/admin/logout" class="inline"><button class="link">خروج</button></form>`
    : `<a href="/">العروض</a><a href="https://wa.me/${WHATSAPP}" class="btn sm">تواصل واتساب</a>`}</nav></div></header>
<main class="wrap">${body}</main>
<footer class="foot"><div class="wrap">${esc(BRAND)} ${esc(TAGLINE)}${FAL_LICENSE ? ` · ترخيص الهيئة العامة للعقار: ${esc(FAL_LICENSE)}` : ''}</div></footer>
</body></html>`;

const mediaOf = (id) => q.all('SELECT * FROM media WHERE listing_id=? ORDER BY is_cover DESC,id', id);
const coverOf = (id) => { const m = q.get("SELECT filename FROM media WHERE listing_id=? AND kind='image' ORDER BY is_cover DESC,id LIMIT 1", id); return m ? `/uploads/${m.filename}` : null; };

const card = (l, href) => `<a class="card" href="${href}">
<div class="thumb" ${coverOf(l.id) ? `style="background-image:url('${coverOf(l.id)}')"` : ''}>${coverOf(l.id) ? '' : '<span>لا توجد صورة</span>'}<em class="st ${l.status}">${STATUS[l.status]}</em></div>
<div class="info"><h3>${esc(l.title)}</h3><p class="muted">📍 ${esc([l.city, l.district].filter(Boolean).join(' - ') || '—')}</p>
<div class="facts"><span>${num(l.area)} م²</span><span>${esc(l.type || '')}</span></div>
<div class="price">${num(l.price)} <small>ريال</small>${pricePerM(l) ? `<i>${num(pricePerM(l))} ريال/م²</i>` : ''}</div></div></a>`;

// ---------- التطبيق ----------
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // خلف وكيل Render (للبروتوكول https وعنوان العميل)
app.get('/healthz', (_req, res) => res.type('text').send('ok'));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));
app.use(express.static(path.join(__dirname, 'public')));

// --- الصفحة العامة: قائمة العروض ---
app.get('/', (req, res) => {
  const { city = '', type = '', min = '', max = '', s = '' } = req.query;
  const cond = ['is_public=1']; const args = [];
  if (city) { cond.push('city=?'); args.push(city); }
  if (type) { cond.push('type=?'); args.push(type); }
  if (toNum(min) != null) { cond.push('price>=?'); args.push(toNum(min)); }
  if (toNum(max) != null) { cond.push('price<=?'); args.push(toNum(max)); }
  if (s) { cond.push('(title LIKE ? OR district LIKE ?)'); args.push(`%${s}%`, `%${s}%`); }
  const rows = q.all(`SELECT * FROM listings WHERE ${cond.join(' AND ')} ORDER BY (status='available') DESC, id DESC`, ...args);
  const cities = q.all("SELECT DISTINCT city FROM listings WHERE is_public=1 AND city<>'' ORDER BY city").map((r) => r.city);
  const types = q.all("SELECT DISTINCT type FROM listings WHERE is_public=1 AND type<>'' ORDER BY type").map((r) => r.type);
  const opt = (arr, cur) => arr.map((v) => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
  res.send(layout(`${BRAND} ${TAGLINE}`, `
<section class="hero"><img class="herologo" src="/brand/logo-vertical.png" alt="${esc(BRAND)} ${esc(TAGLINE)}"><p>عروض أراضٍ وعقارات مختارة بتفاصيلها الكاملة</p></section>
<form class="filters" method="get">
<input name="s" placeholder="ابحث بالاسم أو الحي" value="${esc(s)}">
<select name="city"><option value="">كل المدن</option>${opt(cities, city)}</select>
<select name="type"><option value="">كل الأنواع</option>${opt(types, type)}</select>
<input name="min" inputmode="numeric" placeholder="أدنى سعر" value="${esc(min)}"><input name="max" inputmode="numeric" placeholder="أعلى سعر" value="${esc(max)}">
<button class="btn">بحث</button></form>
<div class="grid">${rows.map((l) => card(l, `/o/${l.token}`)).join('') || '<p class="empty">لا توجد عروض مطابقة حاليًا.</p>'}</div>`));
});

// --- صفحة العرض (الرابط الذي يُرسل للعميل) ---
function offerData(token) {
  const l = q.get('SELECT * FROM listings WHERE token=?', token);
  if (!l) return null;
  const m = mediaOf(l.id);
  return { l, images: m.filter((x) => x.kind === 'image'), videos: m.filter((x) => x.kind === 'video') };
}
const factsRows = (l) => [
  ['نوع العقار', l.type], ['المدينة', l.city], ['الحي / الموقع', l.district],
  ['المساحة', l.area ? `${num(l.area)} م²` : ''], ['السعر الإجمالي', l.price ? `${num(l.price)} ريال` : ''],
  ['سعر المتر', pricePerM(l) ? `${num(pricePerM(l))} ريال` : ''], ['نوع الصك', l.deed_type],
  ['عرض الشارع', l.street_width], ['الواجهة', l.facade], ['الحالة', STATUS[l.status]],
].filter(([, v]) => v);

app.get('/o/:token', (req, res) => {
  const d = offerData(req.params.token);
  if (!d) return res.status(404).send(layout('غير موجود', '<p class="empty">العرض غير موجود.</p>'));
  const { l, images, videos } = d;
  if (!cookies(req).sid) q.run('UPDATE listings SET views=views+1 WHERE id=?', l.id);
  const url = `${baseUrl(req)}/o/${l.token}`;
  const emb = mapEmbed(l); const ml = mapLink(l);
  const sent = req.query.sent === '1';
  res.send(layout(`${l.title} | ${BRAND}`, `
<a class="back" href="/">← كل العروض</a>
<div class="offer">
<div class="media">
${videos.map((v) => `<video controls preload="metadata" playsinline ${images[0] ? `poster="/uploads/${images[0].filename}"` : ''} src="/uploads/${v.filename}"></video>`).join('')}
${images.length ? `<div class="gallery">${images.map((i) => `<a href="/uploads/${i.filename}" target="_blank"><img loading="lazy" src="/uploads/${i.filename}" alt="${esc(l.title)}"></a>`).join('')}</div>` : (videos.length ? '' : '<div class="noimg">لا توجد صور</div>')}
</div>
<aside class="side">
<span class="st ${l.status}">${STATUS[l.status]}</span><h1>${esc(l.title)}</h1>
<p class="muted">📍 ${esc([l.city, l.district].filter(Boolean).join(' - '))}</p>
<div class="bigprice">${num(l.price)} <small>ريال</small></div>
${pricePerM(l) ? `<p class="muted">${num(pricePerM(l))} ريال للمتر · ${num(l.area)} م²</p>` : ''}
<div class="actions">
<a class="btn" target="_blank" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`مرحبًا، أستفسر عن: ${l.title}\n${url}`)}">استفسر عبر واتساب</a>
${ml ? `<a class="btn ghost" target="_blank" href="${esc(ml)}">فتح الموقع على الخريطة</a>` : ''}
<a class="btn ghost" href="/o/${l.token}/print">نسخة PDF / طباعة</a></div>
${sent ? '<p class="ok">✓ وصلنا طلبك وسنتواصل معك قريبًا.</p>' : `
<form class="inq" method="post" action="/o/${l.token}/inquire"><h3>اطلب التواصل</h3>
<input name="name" placeholder="الاسم" required><input name="phone" inputmode="tel" placeholder="رقم الجوال" required>
<textarea name="message" rows="2" placeholder="ملاحظات (اختياري)"></textarea>
<input class="hp" name="website" tabindex="-1" autocomplete="off"><button class="btn">إرسال</button></form>`}
</aside></div>
<section class="details"><h2>تفاصيل العرض</h2>
<table class="kv">${factsRows(l).map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}${l.ad_license ? `<tr><th>رقم ترخيص الإعلان</th><td>${esc(l.ad_license)}</td></tr>` : ''}</table>
${l.description ? `<h3>الوصف</h3><p class="desc">${esc(l.description).replace(/\n/g, '<br>')}</p>` : ''}
${l.features ? `<h3>المميزات</h3><ul class="feat">${l.features.split('\n').filter(Boolean).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
${emb ? `<h3>الموقع</h3><iframe class="map" loading="lazy" src="${emb}"></iframe>` : ''}
</section>`, { desc: `${num(l.area)} م² · ${num(l.price)} ريال · ${[l.city, l.district].filter(Boolean).join(' - ')}` }));
});

app.post('/o/:token/inquire', (req, res) => {
  const l = q.get('SELECT id FROM listings WHERE token=?', req.params.token);
  if (!l) return res.sendStatus(404);
  const { name = '', phone = '', message = '', website = '' } = req.body;
  if (!website && name.trim() && phone.trim()) {
    q.run('INSERT INTO leads(listing_id,name,phone,message) VALUES(?,?,?,?)', l.id, name.trim().slice(0, 100), normPhone(phone).slice(0, 20) || phone.slice(0, 20), message.trim().slice(0, 1000));
  }
  res.redirect(`/o/${req.params.token}?sent=1`);
});

// --- نسخة الطباعة / PDF (العرض الشامل) ---
app.get('/o/:token/print', (req, res) => {
  const d = offerData(req.params.token);
  if (!d) return res.sendStatus(404);
  const { l, images } = d;
  const url = `${baseUrl(req)}/o/${l.token}`;
  res.send(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>عرض - ${esc(l.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"><link rel="icon" href="/brand/favicon.png"><link rel="stylesheet" href="/style.css"></head>
<body class="sheet"><div class="noprint bar2"><button class="btn" onclick="print()">طباعة / حفظ PDF</button><a class="btn ghost" href="/o/${l.token}">رجوع</a></div>
<div class="page"><div class="sh-head"><img src="/brand/logo-horizontal.png" alt="${esc(BRAND)}"><div class="sh-st">${STATUS[l.status]}</div></div>
<h1>${esc(l.title)}</h1><p class="muted">📍 ${esc([l.city, l.district].filter(Boolean).join(' - '))}</p>
<div class="sh-price"><div>${num(l.price)} <small>ريال</small></div>${pricePerM(l) ? `<span>${num(pricePerM(l))} ريال / م²</span>` : ''}</div>
${images[0] ? `<img class="sh-cover" src="/uploads/${images[0].filename}">` : ''}
<table class="kv">${factsRows(l).map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table>
${l.description ? `<h3>الوصف</h3><p class="desc">${esc(l.description).replace(/\n/g, '<br>')}</p>` : ''}
${l.features ? `<h3>المميزات</h3><ul class="feat">${l.features.split('\n').filter(Boolean).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
${images.length > 1 ? `<div class="sh-gal">${images.slice(1, 7).map((i) => `<img src="/uploads/${i.filename}">`).join('')}</div>` : ''}
<div class="sh-foot"><div>للاطلاع على الفيديو والصور كاملة:<br><b dir="ltr">${esc(url)}</b></div>
<div>واتساب: <b dir="ltr">+${WHATSAPP}</b>${l.ad_license ? `<br>رقم ترخيص الإعلان: ${esc(l.ad_license)}` : ''}${FAL_LICENSE ? `<br>ترخيص الهيئة العامة للعقار: ${esc(FAL_LICENSE)}` : ''}</div></div></div></body></html>`);
});

// ================= لوحة الإدارة =================
app.get('/admin/login', (_req, res) => res.send(layout('دخول', `<form class="login" method="post"><h2>دخول الإدارة</h2><input type="password" name="password" placeholder="كلمة المرور" autofocus required><button class="btn">دخول</button></form>`, { admin: true })));
app.post('/admin/login', (req, res) => {
  const ip = req.ip; const a = attempts.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - a.t > 15 * 60e3) { a.n = 0; a.t = Date.now(); }
  if (a.n >= 8) return res.status(429).send('محاولات كثيرة، حاول لاحقًا.');
  const ok = (req.body.password || '').length === ADMIN_PASSWORD.length && crypto.timingSafeEqual(Buffer.from(req.body.password), Buffer.from(ADMIN_PASSWORD));
  if (!ok) { a.n++; attempts.set(ip, a); return res.status(401).send(layout('دخول', `<form class="login" method="post"><h2>دخول الإدارة</h2><p class="err">كلمة المرور غير صحيحة</p><input type="password" name="password" placeholder="كلمة المرور" autofocus required><button class="btn">دخول</button></form>`, { admin: true })); }
  attempts.delete(ip);
  res.setHeader('Set-Cookie', `sid=${makeSession()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400}${req.secure ? '; Secure' : ''}`);
  res.redirect('/admin');
});
app.post('/admin/logout', (_req, res) => { res.setHeader('Set-Cookie', 'sid=; Max-Age=0; Path=/'); res.redirect('/admin/login'); });

app.get('/admin', requireAdmin, (req, res) => {
  const rows = q.all('SELECT l.*, (SELECT COUNT(*) FROM leads WHERE listing_id=l.id) AS leads FROM listings l ORDER BY id DESC');
  const stats = { all: rows.length, av: rows.filter((r) => r.status === 'available').length, leads: q.get("SELECT COUNT(*) c FROM leads WHERE status='new'").c, views: rows.reduce((a, r) => a + r.views, 0) };
  res.send(layout('لوحة الإدارة', `
<div class="stats"><div><b>${stats.all}</b>إجمالي العروض</div><div><b>${stats.av}</b>متاحة</div><div><b>${stats.leads}</b>عملاء جدد</div><div><b>${stats.views}</b>مشاهدات العروض</div></div>
<table class="tbl"><tr><th>العرض</th><th>المساحة</th><th>السعر</th><th>الحالة</th><th>مشاهدات</th><th>استفسارات</th><th></th></tr>
${rows.map((l) => `<tr><td><a href="/o/${l.token}" target="_blank"><b>${esc(l.title)}</b></a><br><small class="muted">${esc([l.city, l.district].filter(Boolean).join(' - '))}${l.is_public ? '' : ' · خاص (بالرابط فقط)'}</small></td>
<td>${num(l.area)}</td><td>${num(l.price)}</td><td><span class="st ${l.status}">${STATUS[l.status]}</span></td><td>${l.views}</td><td>${l.leads}</td>
<td class="acts"><a href="/admin/listing/${l.id}/edit">تعديل</a><a href="/admin/listing/${l.id}/send">إرسال لعميل</a>
<form method="post" action="/admin/listing/${l.id}/delete" onsubmit="return confirm('حذف العرض نهائيًا؟')" class="inline"><button class="link danger">حذف</button></form></td></tr>`).join('') || '<tr><td colspan="7" class="empty">لا توجد عروض. ابدأ بإضافة أول عرض.</td></tr>'}</table>`, { admin: true }));
});

const field = (label, name, v = '', extra = '') => `<label>${label}<input name="${name}" value="${esc(v)}" ${extra}></label>`;
function formPage(l, mediaList) {
  const t = l || {};
  return layout(l ? 'تعديل عرض' : 'عرض جديد', `
<form class="edit" method="post" enctype="multipart/form-data">
<h2>${l ? 'تعديل العرض' : 'عرض جديد'}</h2>
<div class="cols">
${field('عنوان العرض *', 'title', t.title, 'required placeholder="أرض سكنية - حي النرجس"')}
<label>نوع العقار<select name="type">${['أرض سكنية', 'أرض تجارية', 'أرض زراعية', 'أرض صناعية', 'فيلا', 'شقة', 'عمارة', 'محل / معرض'].map((x) => `<option ${x === (t.type || 'أرض سكنية') ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
${field('المدينة', 'city', t.city)}${field('الحي / الموقع', 'district', t.district)}
${field('المساحة (م²)', 'area', t.area ?? '', 'inputmode="decimal"')}${field('السعر الإجمالي (ريال)', 'price', t.price ?? '', 'inputmode="decimal"')}
${field('نوع الصك', 'deed_type', t.deed_type, 'placeholder="صك إلكتروني / صك شرعي"')}${field('عرض الشارع', 'street_width', t.street_width, 'placeholder="20 م"')}
${field('الواجهة', 'facade', t.facade, 'placeholder="شمالية"')}${field('رقم ترخيص الإعلان', 'ad_license', t.ad_license)}
${field('رابط الموقع (خرائط جوجل)', 'location_url', t.location_url, 'placeholder="https://maps.app.goo.gl/..."')}
<div class="two">${field('خط العرض (اختياري)', 'lat', t.lat ?? '', 'inputmode="decimal"')}${field('خط الطول (اختياري)', 'lng', t.lng ?? '', 'inputmode="decimal"')}</div>
<label>الحالة<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === (t.status || 'available') ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
<label class="chk"><input type="checkbox" name="is_public" value="1" ${t.is_public === 0 ? '' : 'checked'}> يظهر في الصفحة الرئيسية (أزل العلامة ليكون خاصًا بالرابط فقط)</label>
</div>
<label>الوصف<textarea name="description" rows="4">${esc(t.description)}</textarea></label>
<label>المميزات (كل ميزة في سطر)<textarea name="features" rows="4" placeholder="قريبة من الخدمات&#10;شارع تجاري">${esc(t.features)}</textarea></label>
<div class="uploads"><label>صور العرض (يمكن اختيار عدة صور)<input type="file" name="images" accept="image/*" multiple></label>
<label>الفيديو التسويقي<input type="file" name="video" accept="video/*"></label></div>
${mediaList && mediaList.length ? `<h3>الملفات الحالية</h3><div class="mlist">${mediaList.map((m) => `<div class="mi">${m.kind === 'image' ? `<img src="/uploads/${m.filename}">` : `<video src="/uploads/${m.filename}" muted></video>`}
<button class="link danger" formaction="/admin/media/${m.id}/delete" formmethod="post" formnovalidate>حذف</button>${m.kind === 'image' && !m.is_cover ? `<button class="link" formaction="/admin/media/${m.id}/cover" formmethod="post" formnovalidate>جعلها الغلاف</button>` : ''}</div>`).join('')}</div>` : ''}
<div class="row"><button class="btn">حفظ</button><a class="btn ghost" href="/admin">إلغاء</a></div></form>`, { admin: true });
}

const saveFields = (b) => [
  (b.title || '').trim(), b.type || '', (b.city || '').trim(), (b.district || '').trim(), (b.location_url || '').trim(),
  toNum(b.lat), toNum(b.lng), toNum(b.price), toNum(b.area), (b.deed_type || '').trim(), (b.street_width || '').trim(), (b.facade || '').trim(),
  (b.description || '').trim(), (b.features || '').trim(), (b.ad_license || '').trim(),
  STATUS[b.status] ? b.status : 'available', b.is_public ? 1 : 0,
];
function saveMedia(id, files) {
  const hasCover = q.get("SELECT 1 x FROM media WHERE listing_id=? AND kind='image' AND is_cover=1", id);
  (files?.images || []).forEach((f, i) => q.run('INSERT INTO media(listing_id,kind,filename,is_cover) VALUES(?,?,?,?)', id, 'image', f.filename, !hasCover && i === 0 ? 1 : 0));
  (files?.video || []).forEach((f) => q.run('INSERT INTO media(listing_id,kind,filename) VALUES(?,?,?)', id, 'video', f.filename));
}
const uploadFields = upload.fields([{ name: 'images', maxCount: 25 }, { name: 'video', maxCount: 3 }]);

app.get('/admin/listing/new', requireAdmin, (_req, res) => res.send(formPage(null, null)));
app.post('/admin/listing/new', requireAdmin, uploadFields, (req, res) => {
  if (!(req.body.title || '').trim()) return res.status(400).send('العنوان مطلوب');
  const r = q.run(`INSERT INTO listings(token,title,type,city,district,location_url,lat,lng,price,area,deed_type,street_width,facade,description,features,ad_license,status,is_public)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, crypto.randomBytes(6).toString('base64url'), ...saveFields(req.body));
  saveMedia(Number(r.lastInsertRowid), req.files);
  res.redirect('/admin');
});
app.get('/admin/listing/:id/edit', requireAdmin, (req, res) => {
  const l = q.get('SELECT * FROM listings WHERE id=?', req.params.id);
  if (!l) return res.sendStatus(404);
  res.send(formPage(l, mediaOf(l.id)));
});
app.post('/admin/listing/:id/edit', requireAdmin, uploadFields, (req, res) => {
  const l = q.get('SELECT id FROM listings WHERE id=?', req.params.id);
  if (!l) return res.sendStatus(404);
  q.run(`UPDATE listings SET title=?,type=?,city=?,district=?,location_url=?,lat=?,lng=?,price=?,area=?,deed_type=?,street_width=?,facade=?,description=?,features=?,ad_license=?,status=?,is_public=? WHERE id=?`, ...saveFields(req.body), l.id);
  saveMedia(l.id, req.files);
  res.redirect('/admin');
});
const rmFile = (fn) => fs.rm(path.join(UPLOAD_DIR, path.basename(fn)), { force: true }, () => {});
app.post('/admin/listing/:id/delete', requireAdmin, (req, res) => {
  mediaOf(req.params.id).forEach((m) => rmFile(m.filename));
  q.run('DELETE FROM media WHERE listing_id=?', req.params.id); q.run('UPDATE leads SET listing_id=NULL WHERE listing_id=?', req.params.id); q.run('DELETE FROM listings WHERE id=?', req.params.id);
  res.redirect('/admin');
});
app.post('/admin/media/:id/delete', requireAdmin, (req, res) => {
  const m = q.get('SELECT * FROM media WHERE id=?', req.params.id);
  if (m) { rmFile(m.filename); q.run('DELETE FROM media WHERE id=?', m.id); }
  res.redirect(m ? `/admin/listing/${m.listing_id}/edit` : '/admin');
});
app.post('/admin/media/:id/cover', requireAdmin, (req, res) => {
  const m = q.get('SELECT * FROM media WHERE id=?', req.params.id);
  if (m) { q.run('UPDATE media SET is_cover=0 WHERE listing_id=?', m.listing_id); q.run('UPDATE media SET is_cover=1 WHERE id=?', m.id); }
  res.redirect(m ? `/admin/listing/${m.listing_id}/edit` : '/admin');
});

// --- إرسال العرض لعميل (واتساب برسالة جاهزة + نسخ الرابط) ---
app.get('/admin/listing/:id/send', requireAdmin, (req, res) => {
  const l = q.get('SELECT * FROM listings WHERE id=?', req.params.id);
  if (!l) return res.sendStatus(404);
  const url = `${baseUrl(req)}/o/${l.token}`;
  const leadId = Number(req.query.lead) || 0;
  const lead = leadId ? q.get('SELECT * FROM leads WHERE id=?', leadId) : null;
  const msg = offerMessage(l, url, lead?.name);
  const phone = normPhone(req.query.phone || lead?.phone || '');
  res.send(layout('إرسال العرض', `
<div class="send"><h2>إرسال العرض: ${esc(l.title)}</h2>
<form method="get"><input type="hidden" name="lead" value="${leadId || ''}"><label>رقم جوال العميل<input name="phone" inputmode="tel" value="${esc(phone)}" placeholder="05xxxxxxxx"></label><button class="btn ghost">تحديث</button></form>
<label>نص الرسالة (يمكن تعديله ثم نسخه)<textarea id="m" rows="10">${esc(msg)}</textarea></label>
<div class="row"><a class="btn" id="wa" target="_blank" href="https://wa.me/${phone}?text=${encodeURIComponent(msg)}">فتح واتساب بالرسالة</a>
<button class="btn ghost" type="button" onclick="navigator.clipboard.writeText(document.getElementById('m').value);this.textContent='تم النسخ ✓'">نسخ النص</button>
<button class="btn ghost" type="button" onclick="navigator.clipboard.writeText('${url}');this.textContent='تم نسخ الرابط ✓'">نسخ الرابط فقط</button>
<a class="btn ghost" target="_blank" href="/o/${l.token}/print">ملف PDF</a></div>
<p class="muted">الرابط يفتح للعميل العرض كاملًا: الصور والفيديو والخريطة والتفاصيل، ويمكنه حفظه PDF.</p></div>
<script>const t=document.getElementById('m'),a=document.getElementById('wa'),p=${JSON.stringify(phone)};t.addEventListener('input',()=>a.href='https://wa.me/'+p+'?text='+encodeURIComponent(t.value));</script>`, { admin: true }));
});

// --- العملاء المحتملون ---
app.get('/admin/leads', requireAdmin, (_req, res) => {
  const rows = q.all('SELECT leads.*, listings.title, listings.id AS lid FROM leads LEFT JOIN listings ON listings.id=leads.listing_id ORDER BY leads.id DESC');
  res.send(layout('العملاء', `<div class="row between"><h2>العملاء المحتملون</h2><a class="btn ghost sm" href="/admin/leads.csv">تصدير Excel (CSV)</a></div>
<table class="tbl"><tr><th>العميل</th><th>العرض</th><th>الرسالة</th><th>الحالة / ملاحظة</th><th></th></tr>
${rows.map((r) => `<tr><td><b>${esc(r.name)}</b><br><a dir="ltr" href="tel:+${esc(r.phone)}">${esc(r.phone)}</a><br><small class="muted">${esc(r.created_at)}</small></td>
<td>${esc(r.title || '—')}</td><td>${esc(r.message)}</td>
<td><form method="post" action="/admin/leads/${r.id}" class="lf"><select name="status">${Object.entries(LEAD_STATUS).map(([k, v]) => `<option value="${k}" ${k === r.status ? 'selected' : ''}>${v}</option>`).join('')}</select><input name="note" value="${esc(r.note)}" placeholder="ملاحظة"><button class="btn sm">حفظ</button></form></td>
<td class="acts">${r.lid ? `<a href="/admin/listing/${r.lid}/send?lead=${r.id}">إرسال العرض</a>` : ''}<a target="_blank" href="https://wa.me/${esc(r.phone)}">واتساب</a></td></tr>`).join('') || '<tr><td colspan="5" class="empty">لا يوجد عملاء بعد.</td></tr>'}</table>`, { admin: true }));
});
app.post('/admin/leads/:id', requireAdmin, (req, res) => {
  q.run('UPDATE leads SET status=?, note=? WHERE id=?', LEAD_STATUS[req.body.status] ? req.body.status : 'new', (req.body.note || '').slice(0, 500), req.params.id);
  res.redirect('/admin/leads');
});
app.get('/admin/leads.csv', requireAdmin, (_req, res) => {
  const rows = q.all('SELECT leads.*, listings.title FROM leads LEFT JOIN listings ON listings.id=leads.listing_id ORDER BY leads.id DESC');
  const c = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
  res.send('﻿' + ['الاسم,الجوال,العرض,الرسالة,الحالة,ملاحظة,التاريخ', ...rows.map((r) => [r.name, r.phone, r.title, r.message, LEAD_STATUS[r.status], r.note, r.created_at].map(c).join(','))].join('\n'));
});

// أخطاء الرفع وغيرها
app.use((err, _req, res, _next) => { console.error(err); res.status(500).send(layout('خطأ', `<p class="err">حدث خطأ: ${esc(err.message)}</p>`)); });

if (require.main === module) app.listen(PORT, () => console.log(`✓ الموقع يعمل: http://localhost:${PORT}  (الإدارة: /admin)`));
module.exports = app;
