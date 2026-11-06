'use strict';
// استيراد قائمة أسعار الموردين: node scripts/import-rates.js [ملف البيانات]
// - يُنشئ الفنادق الجديدة كمسودات مخفية، ويحدّث بيانات الفنادق الموجودة بنفس المعرّف (slug) دون تغيير ظهورها.
// - سعر البيع = ceil(التكلفة × (1 + الهامش%)) والهامش من الإعدادات (markup_percent، الافتراضي 12).
// - الغرف المستوردة «حسب الطلب» (التأكيد يدويًا بعد التحقق من التوفر) و«بالأسعار فقط» (لا تُباع خارج فترات الأسعار).
// يمكن إعادة تشغيله بأمان: يستبدل غرف هذا الملف فقط.
const path = require('node:path');
const { db, q, setting } = require('../lib/db');
const file = process.argv[2] || path.join(__dirname, 'data', 'price-list-2026-11-03.js');
const SRC = path.basename(file, '.js');
const data = require(path.resolve(file));
const markup = Number(process.env.MARKUP || setting('markup_percent') || 12);
const sell = (cost) => Math.ceil((cost * (100 + markup)) / 100 - 1e-9);
const year = (m) => (Number(m) >= 11 ? 2026 : 2027);
const iso = (md) => { const [m, d] = md.split('-'); return `${year(m)}-${m}-${d}`; };
const addDays = (s, n) => new Date(Date.parse(s + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const report = { amb: [], checks: [], hotels: 0, rooms: 0, rates: 0, updated: [], created: [] };

db.exec('BEGIN');
try {
  for (const h of data) {
    const ex = q.get('SELECT id FROM hotels WHERE slug=?', h.slug);
    const extras = JSON.stringify((h.extras || []).map(([ar, en, cost]) => ({ ar, en, cost })));
    const meal = h.bf ? 'الإفطار مشمول' : 'بدون وجبات';
    const mealEn = h.bf ? 'Breakfast included' : 'No meals';
    const amen = [meal, h.transfer ? 'توصيل للحرم' : ''].filter(Boolean).join('، ');
    const amenEn = [mealEn, h.transfer ? 'Shuttle to the Haram' : ''].filter(Boolean).join(', ');
    let id;
    if (ex) {
      id = ex.id;
      q.run('UPDATE hotels SET extras=?, transfer=?, stars=COALESCE(stars,?) WHERE id=?', extras, h.transfer, h.stars, id);
      q.run("UPDATE hotels SET amenities=CASE WHEN amenities IS NULL OR amenities='' THEN ? ELSE amenities END, amenities_en=CASE WHEN amenities_en IS NULL OR amenities_en='' THEN ? ELSE amenities_en END WHERE id=?", amen, amenEn, id);
      report.updated.push(h.ar);
    } else {
      id = Number(q.run('INSERT INTO hotels(slug,name,name_en,stars,district,district_en,address,address_en,description,description_en,amenities,amenities_en,extras,transfer,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)',
        h.slug, h.ar, h.en, h.stars, h.area, h.areaEn, `${h.area}، مكة المكرمة`, `${h.areaEn}, Makkah`, 'مسودة: أضف الصور والوصف ثم فعّل الفندق.', 'Draft: add photos and description, then activate.', amen, amenEn, extras, h.transfer).lastInsertRowid);
      report.created.push(h.ar);
    }
    q.run('DELETE FROM room_types WHERE hotel_id=? AND src=?', id, SRC);
    report.hotels++;
    for (const r of h.rooms) {
      const ps = r.periods.map(([a, b, p]) => {
        if (Array.isArray(p)) report.amb.push(`${h.ar} — ${r.ar} (${a}→${b}): ${p.join(' / ')}`);
        return { a, b, cost: Array.isArray(p) ? Math.max(...p) : p };
      });
      if (r.check) report.checks.push(`${h.ar} — ${r.ar}: ${r.check}`);
      const minCost = Math.min(...ps.map((x) => x.cost));
      const rid = Number(q.run('INSERT INTO room_types(hotel_id,name,name_en,capacity,base_price,base_cost,total_rooms,breakfast,is_active,rates_only,on_request,src) VALUES(?,?,?,?,?,?,?,?,1,1,1,?)',
        id, r.ar, r.en, r.cap, sell(minCost), minCost, 50, r.bf ?? h.bf, SRC).lastInsertRowid);
      report.rooms++;
      for (const p of ps) {
        const from = iso(p.a);
        const sharedBoundary = ps.some((o) => o !== p && o.a === p.b);
        const to = sharedBoundary ? addDays(iso(p.b), -1) : iso(p.b);
        q.run('INSERT INTO rates(room_type_id,from_date,to_date,price,cost,label) VALUES(?,?,?,?,?,?)', rid, from, to, sell(p.cost), p.cost, 'قائمة 2026-11-03');
        report.rates++;
      }
    }
  }
  db.exec('COMMIT');
} catch (e) { db.exec('ROLLBACK'); throw e; }
console.log(`الهامش: ${markup}% | فنادق: ${report.hotels} (جديد ${report.created.length}، محدَّث ${report.updated.length}) | غرف: ${report.rooms} | فترات أسعار: ${report.rates}`);
console.log(`\nأسعار «س1 / س2» (اعتُمد الأعلى مؤقتًا): ${report.amb.length}`); report.amb.slice(0, 5).forEach((x) => console.log('  ' + x));
console.log(`\nنقاط للمراجعة: ${report.checks.length}`); report.checks.forEach((x) => console.log('  ' + x));
