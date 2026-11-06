'use strict';
// صور مرفقة مع المشروع (seed-photos/<slug>/*.jpg) تُضاف مرة واحدة للفندق إن لم يكن له صور.
const fs = require('node:fs'); const path = require('node:path'); const crypto = require('node:crypto');
const { q, UPLOAD_DIR, setting, setSetting } = require('./db');
const ROOT = path.join(__dirname, '..', 'seed-photos');
function run() {
  if (!fs.existsSync(ROOT)) return;
  for (const slug of fs.readdirSync(ROOT)) {
    const dir = path.join(ROOT, slug); if (!fs.statSync(dir).isDirectory() || setting('seed_photos:' + slug)) continue;
    const h = q.get('SELECT id FROM hotels WHERE slug=?', slug); if (!h) continue; // ننتظر حتى يوجد الفندق
    setSetting('seed_photos:' + slug, '1');
    if (q.get('SELECT 1 FROM hotel_images WHERE hotel_id=?', h.id)) continue;
    let n = 0;
    for (const f of fs.readdirSync(dir).sort()) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      const name = crypto.randomBytes(12).toString('hex') + path.extname(f).toLowerCase();
      fs.copyFileSync(path.join(dir, f), path.join(UPLOAD_DIR, name));
      q.run('INSERT INTO hotel_images(hotel_id,filename,is_cover) VALUES(?,?,?)', h.id, name, n === 0 ? 1 : 0); n++;
    }
    console.log(`✓ صور ${slug}: ${n}`);
  }
}
module.exports = { run };
