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
];
function run() {
  if (q.get('SELECT 1 FROM hotels LIMIT 1')) return;
  for (const [slug, name, stars, district, address, ll, amenities] of HOTELS) {
    q.run('INSERT INTO hotels(slug,name,stars,district,address,distance_m,description,amenities,lat,lng,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,0)', slug, name, stars, district, address, distM(HARAM, ll),
      'مسودة: أكمل الوصف والصور وأنواع الغرف والأسعار ثم فعّل الفندق. (المسافة تقريبية بخط مستقيم عن الحرم)', amenities, ll[0], ll[1]);
  }
  console.log('✓ أُضيفت 3 فنادق كمسودات مخفية');
}
module.exports = { run };
