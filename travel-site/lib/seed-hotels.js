'use strict';
// فنادق مبدئية (مسودات مخفية، بلا أسعار) من بيانات Booking.com العامة: الاسم والنجوم والموقع والمرافق فقط.
// لا نسخ للصور/الوصف/التقييمات (حقوق الغير) ولا أسعار — أكملها من لوحة الإدارة ثم فعّل الفندق.
const { q } = require('./db');
const HARAM = [21.4225, 39.8262];
const distM = ([a, b], [c, d]) => { const R = 6371000, r = Math.PI / 180, x = (d - b) * r * Math.cos(((a + c) / 2) * r), y = (c - a) * r; return Math.round(Math.hypot(x, y) * R / 1); };
const HOTELS = [
  ['novotel-makkah-thakher-city', 'نوفوتيل مكة ذاخر سيتي', 4, 'الأندلس', 'حي الأندلس، مكة المكرمة', [21.444701, 39.833971], 'مطعم، خدمة غرف، مركز لياقة، مواقف سيارات، واي فاي مجاني، غرف عائلية، استقبال 24 ساعة، نقل مجاني'],
  ['doubletree-hilton-makkah-aziziyah', 'دبل تري باي هيلتون مكة العزيزية', 4, 'العزيزية', 'طريق الملك خالد، مكة المكرمة', [21.401062, 39.872649], 'مطعم، خدمة غرف، مواقف مجانية، واي فاي مجاني، غرف عائلية، نادي أطفال، استقبال 24 ساعة، مرافق لذوي الاحتياجات الخاصة'],
  ['violet-hotel-aziziyah', 'فندق فيوليت العزيزية', 3, 'العزيزية', 'طريق الرياض الطائف، العزيزية، مكة المكرمة', [21.418618, 39.853303], 'مطعم، مسبح داخلي، ساونا، مركز لياقة، مصلى، واي فاي مجاني، غرف عائلية، استقبال 24 ساعة'],
  ['voco-makkah-ihg', 'فوكو مكة (voco Makkah by IHG)', 4, 'المسفلة', 'شارع إبراهيم الخليل، المسفلة، مكة المكرمة', [21.407782, 39.81849], 'مطعم ومقهى، خدمة غرف، مواقف سيارات، واي فاي مجاني، غرف عائلية، استقبال 24 ساعة، ميني ماركت، مرافق لذوي الاحتياجات الخاصة'],
  ['millennium-makkah-al-naseem', 'ميلينيوم مكة النسيم', 4, 'النسيم', 'طريق الطائف، حي النسيم، مكة المكرمة', [21.380843, 39.872262], 'مطعم، مركز لياقة، مواقف مجانية، واي فاي مجاني، غرف عائلية، نادي أطفال، استقبال 24 ساعة، ميني ماركت'],
  ['copthorne-makkah-al-naseem', 'كوبثورن مكة النسيم', 4, 'النسيم', 'طريق الطائف، حي النسيم، مكة المكرمة', [21.38074, 39.872503], 'مطعم، مركز لياقة، مواقف مجانية، واي فاي مجاني، غرف عائلية، استقبال 24 ساعة، خدمة غرف'],
  ['four-points-sheraton-makkah-al-naseem', 'فور بوينتس باي شيراتون مكة النسيم', 4, 'النسيم', 'الدائري الثالث، خلف جامع الراجحي، مكة المكرمة', [21.38081, 39.874312], 'مطعم، مركز لياقة، مواقف مجانية، واي فاي مجاني، غرف عائلية، استقبال 24 ساعة، ميني ماركت'],
];
const EN = { 'novotel-makkah-thakher-city': ['Novotel Makkah Thakher City', 'Al Andalus', 'Al Andalus District, Makkah'], 'doubletree-hilton-makkah-aziziyah': ['DoubleTree by Hilton Makkah Aziziyah', 'Al Aziziyah', 'King Khalid Road, Makkah'], 'violet-hotel-aziziyah': ['Violet Hotel Aziziyah', 'Al Aziziyah', 'Riyadh–Taif Road, Al Aziziyah, Makkah'], 'voco-makkah-ihg': ['voco Makkah by IHG', 'Al Misfalah', 'Ibrahim Al Khalil Street, Al Misfalah, Makkah'], 'millennium-makkah-al-naseem': ['Millennium Makkah Al Naseem', 'Al Naseem', 'Taif Road, Al Naseem, Makkah'], 'copthorne-makkah-al-naseem': ['Copthorne Makkah Al Naseem', 'Al Naseem', 'Taif Road, Al Naseem, Makkah'], 'four-points-sheraton-makkah-al-naseem': ['Four Points by Sheraton Makkah Al Naseem', 'Al Naseem', 'Third Ring Road, behind Al Rajhi Mosque, Makkah'] };
function backfillEn() { for (const [slug, [n, d, a]] of Object.entries(EN)) q.run('UPDATE hotels SET name_en=?,district_en=?,address_en=? WHERE slug=? AND name_en IS NULL', n, d, a, slug); }
function run() {
  backfillEn();
  if (q.get("SELECT 1 FROM settings WHERE key='seed_hotels_v2'")) return; // مرة واحدة فقط حتى لا تعود فنادق حذفتها
  const fresh = !q.get('SELECT 1 FROM hotels LIMIT 1');
  q.run("INSERT INTO settings(key,value) VALUES('seed_hotels_v2','1')");
  if (!fresh && process.env.SEED_ON_EXISTING !== '1') return;
  for (const [slug, name, stars, district, address, ll, amenities] of HOTELS) {
    if (q.get('SELECT 1 FROM hotels WHERE slug=?', slug)) continue;
    q.run('INSERT INTO hotels(slug,name,stars,district,address,distance_m,description,amenities,lat,lng,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,0)', slug, name, stars, district, address, distM(HARAM, ll),
      'مسودة: أكمل الوصف والصور وأنواع الغرف والأسعار ثم فعّل الفندق. (المسافة تقريبية بخط مستقيم عن الحرم)', amenities, ll[0], ll[1]);
  }
  backfillEn();
  console.log('✓ أُضيفت الفنادق كمسودات مخفية');
}
module.exports = { run };
