'use strict';
// رفع صور الفنادق دفعة واحدة من مجلدات:  node scripts/import-photos.js <المجلد>
// البنية:  <المجلد>/<slug-الفندق>/*.jpg|png|webp   (الصورة الأولى أبجديًا تصبح الغلاف إن لم يكن للفندق صور)
// استخدم فقط صورًا لك حق نشرها (من الفندق أو الوكالة المورّدة بإذن، أو تصويرك).
const fs = require('node:fs'); const path = require('node:path'); const crypto = require('node:crypto');
const { q, UPLOAD_DIR } = require('../lib/db');
const root = process.argv[2];
if (!root || !fs.existsSync(root)) { console.error('الاستخدام: node scripts/import-photos.js <المجلد>'); process.exit(1); }
const kind = (b) => (b[0] === 0xff && b[1] === 0xd8 ? '.jpg' : b.subarray(0, 4).toString('latin1') === '\x89PNG' ? '.png' : b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' ? '.webp' : null);
let total = 0;
for (const slug of fs.readdirSync(root)) {
  const dir = path.join(root, slug); if (!fs.statSync(dir).isDirectory()) continue;
  const h = q.get('SELECT id FROM hotels WHERE slug=?', slug);
  if (!h) { console.log(`✗ لا فندق بالمعرّف ${slug}`); continue; }
  const has = !!q.get('SELECT 1 FROM hotel_images WHERE hotel_id=?', h.id); let n = 0;
  for (const f of fs.readdirSync(dir).sort()) {
    const buf = fs.readFileSync(path.join(dir, f)); const ext = kind(buf);
    if (!ext || buf.length > 6 * 1024 * 1024) { console.log(`  تجاهل ${slug}/${f}`); continue; }
    const name = crypto.randomBytes(12).toString('hex') + ext; fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    q.run('INSERT INTO hotel_images(hotel_id,filename,is_cover) VALUES(?,?,?)', h.id, name, !has && n === 0 ? 1 : 0); n++; total++;
  }
  console.log(`✓ ${slug}: ${n} صورة`);
}
console.log(`المجموع: ${total}`);
