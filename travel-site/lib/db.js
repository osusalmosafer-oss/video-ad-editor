'use strict';
// قاعدة البيانات (SQLite المدمجة في Node) + الإعدادات + منطق الأسعار والتوفر
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'asas.db'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
db.exec(`
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS hotels(
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  stars INTEGER DEFAULT 4, district TEXT, address TEXT, distance_m INTEGER, kaaba_view INTEGER DEFAULT 0,
  description TEXT, amenities TEXT, license_no TEXT, lat REAL, lng REAL,
  is_active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS hotel_images(
  id INTEGER PRIMARY KEY AUTOINCREMENT, hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  filename TEXT NOT NULL, is_cover INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS room_types(
  id INTEGER PRIMARY KEY AUTOINCREMENT, hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, capacity INTEGER DEFAULT 2, base_price INTEGER NOT NULL, total_rooms INTEGER DEFAULT 1,
  breakfast INTEGER DEFAULT 0, description TEXT, is_active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS rates(
  id INTEGER PRIMARY KEY AUTOINCREMENT, room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  from_date TEXT NOT NULL, to_date TEXT NOT NULL, price INTEGER NOT NULL, label TEXT);
CREATE TABLE IF NOT EXISTS bookings(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT UNIQUE NOT NULL,
  hotel_id INTEGER NOT NULL, room_type_id INTEGER NOT NULL,
  hotel_name TEXT, room_name TEXT,
  check_in TEXT NOT NULL, check_out TEXT NOT NULL, nights INTEGER NOT NULL, rooms INTEGER NOT NULL, guests INTEGER NOT NULL,
  total INTEGER NOT NULL, vat INTEGER NOT NULL,
  guest_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, nationality TEXT, notes TEXT,
  status TEXT DEFAULT 'pending', pay_method TEXT, paid_at TEXT, expires_at TEXT,
  admin_note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS pay_links(
  id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, code TEXT UNIQUE NOT NULL, amount INTEGER NOT NULL,
  description TEXT NOT NULL, customer_name TEXT, phone TEXT, booking_ref TEXT, status TEXT DEFAULT 'unpaid',
  expires_at TEXT, paid_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payments(
  id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER REFERENCES bookings(id), link_id INTEGER REFERENCES pay_links(id),
  provider TEXT NOT NULL, provider_ref TEXT, amount INTEGER NOT NULL, status TEXT DEFAULT 'created',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_book_room ON bookings(room_type_id, check_in, check_out);
`);

// ترحيل قاعدة قديمة: كان booking_id إلزاميًا ولا يوجد link_id
{ const cols = db.prepare('PRAGMA table_info(payments)').all();
  if (cols.find((c) => c.name === 'booking_id' && c.notnull) || !cols.find((c) => c.name === 'link_id')) {
    db.exec(`ALTER TABLE payments RENAME TO payments_old;
      CREATE TABLE payments(id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER REFERENCES bookings(id), link_id INTEGER REFERENCES pay_links(id), provider TEXT NOT NULL, provider_ref TEXT, amount INTEGER NOT NULL, status TEXT DEFAULT 'created', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
      INSERT INTO payments(id,booking_id,provider,provider_ref,amount,status,created_at) SELECT id,booking_id,provider,provider_ref,amount,status,created_at FROM payments_old; DROP TABLE payments_old;`);
  } }

// أعمدة اللغة الإنجليزية (ترحيل آمن للقواعد القديمة)
for (const [t, c] of [['hotels', 'name_en'], ['hotels', 'district_en'], ['hotels', 'address_en'], ['hotels', 'description_en'], ['hotels', 'amenities_en'], ['room_types', 'name_en'], ['room_types', 'description_en'], ['bookings', 'hotel_name_en'], ['bookings', 'room_name_en'], ['hotels', 'extras'], ['hotels', 'transfer'], ['room_types', 'rates_only'], ['room_types', 'on_request'], ['room_types', 'base_cost'], ['room_types', 'src'], ['rates', 'cost'], ['rates', 'cost_we'], ['rates', 'price_we']]) {
  if (!db.prepare(`PRAGMA table_info(${t})`).all().some((x) => x.name === c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${/^(transfer|rates_only|on_request|base_cost|cost|cost_we|price_we)$/.test(c) ? 'INTEGER DEFAULT 0' : 'TEXT'}`);
}

const q = {
  all: (sql, ...a) => db.prepare(sql).all(...a),
  get: (sql, ...a) => db.prepare(sql).get(...a),
  run: (sql, ...a) => db.prepare(sql).run(...a),
};

// ---------- الإعدادات ----------
const DEFAULTS = {
  agency_name: 'أسس المسافر',
  agency_tagline: 'حجوزات فنادق مكة المكرمة للمعتمرين',
  tourism_license: '73106939', // رقم ترخيص وزارة السياحة
  cr_number: '7050251656',  // السجل التجاري
  vat_number: '',           // الرقم الضريبي
  sbc_cert_no: '0000267645',          // رقم/معرّف توثيق المركز السعودي للأعمال
  sbc_cert_url: 'https://eauthenticate.saudibusiness.gov.sa/certificate-details/0000267645',         // رابط صفحة التوثيق في المركز السعودي للأعمال
  address: 'مكة المكرمة، المملكة العربية السعودية',
  phone: '+966566403938', whatsapp: '966566403938', email: 'info@osusalmosafer.com.sa',
  vat_registered: '0',      // هل الوكالة مسجّلة في ضريبة القيمة المضافة؟ (0 = لا: لا تُعرض ولا تُحتسب ضريبة)
  vat_rate: '15',
  weekend_days: '',         // ليالي «نهاية الأسبوع» (0=الأحد … 6=السبت) مثل 4,5؛ فارغ = لم تُحدَّد بعد
  hold_minutes: '30',       // مدة حجز الغرفة بانتظار الدفع الإلكتروني
  transfer_hold_hours: '24',// مدة حجز الغرفة بانتظار الحوالة
  cancel_free_hours: '48',  // الإلغاء المجاني قبل الوصول بـ (ساعة)
  enable_bank_transfer: '0', bank_name: '', bank_iban: '', bank_holder: '',
  enable_pay_later: '0',
  markup_percent: '12',     // هامش الربح على أسعار الموردين (للتسعير من التكلفة)
  policy_terms: '', policy_privacy: '', policy_cancel: '', about_text: '',
  agency_name_en: 'Osus Almosafer', agency_tagline_en: 'Makkah hotel bookings for Umrah pilgrims', address_en: 'Makkah, Saudi Arabia',
  policy_terms_en: '', policy_privacy_en: '', policy_cancel_en: '', about_text_en: '',
};
const setting = (k) => { const r = q.get('SELECT value FROM settings WHERE key=?', k); return r ? r.value : (DEFAULTS[k] ?? ''); };
const allSettings = () => { const o = { ...DEFAULTS }; for (const r of q.all('SELECT key,value FROM settings')) o[r.key] = r.value; return o; };
const setSetting = (k, v) => q.run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, String(v ?? ''));
if (process.env.WHATSAPP && !q.get("SELECT 1 FROM settings WHERE key='whatsapp'")) setSetting('whatsapp', process.env.WHATSAPP.replace(/\D/g, ''));

// ---------- التواريخ ----------
const DAY = 86400000;
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
const toMs = (s) => Date.parse(s + 'T00:00:00Z');
const fmtDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const nightsBetween = (a, b) => Math.round((toMs(b) - toMs(a)) / DAY);
const todayRiyadh = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
const nightList = (a, b) => { const out = []; for (let t = toMs(a); t < toMs(b); t += DAY) out.push(fmtDate(t)); return out; };

// ---------- الأسعار (الأسعار بالريال شاملة الضريبة) ----------
function nightPrice(roomTypeId, base, night) {
  const r = q.get('SELECT price, price_we FROM rates WHERE room_type_id=? AND from_date<=? AND to_date>=? ORDER BY id DESC LIMIT 1', roomTypeId, night, night);
  if (!r) return null;
  if (r.price_we == null) return r.price;
  // سعران: وسط الأسبوع / نهاية الأسبوع. إن لم تُحدَّد أيام النهاية بعد نستعمل الأعلى لكل الليالي (حتى لا نبيع بأقل من المقصود)
  const days = setting('weekend_days').split(',').filter((x) => x !== '').map(Number);
  if (!days.length) return Math.max(r.price, r.price_we);
  return days.includes(new Date(night + 'T00:00:00Z').getUTCDay()) ? r.price_we : r.price;
}
function quote(room, checkIn, checkOut, rooms) {
  const nights = nightList(checkIn, checkOut);
  const raw = nights.map((n) => nightPrice(room.id, room.base_price, n));
  const uncovered = room.rates_only ? raw.filter((x) => x == null).length : 0;
  const perNight = raw.map((x) => (x == null ? room.base_price : x));
  const total = perNight.reduce((a, b) => a + b, 0) * rooms;           // ريال صحيح، شامل الضريبة
  const rate = setting('vat_registered') === '1' ? Number(setting('vat_rate')) || 0 : 0;
  const vat = Math.round((total * rate) / (100 + rate));
  return { uncovered, nights: nights.length, perNight, total, vat, net: total - vat, avg: Math.round(perNight.reduce((a, b) => a + b, 0) / (nights.length || 1)) };
}

// ---------- التوفر ----------
const ACTIVE_SQL = "(status='confirmed' OR (status IN ('pending','awaiting_transfer','pay_later') AND expires_at > ?))";
function availableRooms(room, checkIn, checkOut) {
  if (room.on_request) return 999; // مخزون المورد لا نتتبعه؛ التأكيد يدويًا
  const nowIso = new Date().toISOString();
  const rows = q.all(`SELECT check_in, check_out, rooms FROM bookings WHERE room_type_id=? AND check_in<? AND check_out>? AND ${ACTIVE_SQL}`, room.id, checkOut, checkIn, nowIso);
  let max = 0;
  for (const n of nightList(checkIn, checkOut)) {
    let used = 0;
    for (const b of rows) if (b.check_in <= n && b.check_out > n) used += b.rooms;
    if (used > max) max = used;
  }
  return Math.max(0, room.total_rooms - max);
}

const newCode = () => 'PL-' + crypto.randomBytes(5).toString('base64url').replace(/[-_]/g, 'X').toUpperCase().slice(0, 7);
const newRef = () => 'AS-' + crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'X').toUpperCase().slice(0, 8);
const slugify = (s) => String(s).trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'hotel-' + Date.now();

module.exports = { db, q, DATA_DIR, UPLOAD_DIR, setting, allSettings, setSetting, DEFAULTS, isDate, toMs, nightsBetween, todayRiyadh, nightList, quote, availableRooms, newRef, newCode, slugify };
