'use strict';
// بيانات تجريبية للمعاينة فقط (أسماء وأسعار وهمية) — لا تُشغّله على الموقع الحقيقي.
const { q } = require('../lib/db');
if (q.get('SELECT 1 FROM hotels LIMIT 1')) { console.log('توجد فنادق مسبقًا — تم الإلغاء'); process.exit(0); }
const mk = (slug, name, stars, district, dist, kaaba, desc, rooms) => {
  const id = Number(q.run('INSERT INTO hotels(slug,name,stars,district,distance_m,kaaba_view,description,amenities,name_en,district_en,description_en,amenities_en) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', slug, name, stars, district, dist, kaaba, desc, 'واي فاي، مصعد، مصلى، خدمة غرف 24 ساعة', 'Demo Hotel ' + slug.slice(-1) + ' (sample data)', district === 'أجياد' ? 'Ajyad' : 'Al Aziziyah', 'Sample data for preview only.', 'Wi-Fi, Elevator, Prayer room, 24h room service').lastInsertRowid);
  for (const [n, cap, price, total, bf] of rooms) q.run('INSERT INTO room_types(hotel_id,name,capacity,base_price,total_rooms,breakfast,name_en) VALUES(?,?,?,?,?,?,?)', id, n, cap, price, total, bf, { 'غرفة مزدوجة': 'Double room', 'غرفة رباعية': 'Quad room', 'غرفة ثلاثية': 'Triple room' }[n]);
};
mk('demo-hotel-1', 'فندق تجريبي (1) — بيانات وهمية', 5, 'أجياد', 150, 1, 'بيانات تجريبية للمعاينة فقط. استبدلها من لوحة الإدارة.', [['غرفة مزدوجة', 2, 100, 5, 1], ['غرفة رباعية', 4, 180, 3, 1]]);
mk('demo-hotel-2', 'فندق تجريبي (2) — بيانات وهمية', 4, 'العزيزية', 1800, 0, 'بيانات تجريبية للمعاينة فقط.', [['غرفة ثلاثية', 3, 90, 4, 0]]);
console.log('تمت إضافة بيانات تجريبية');
