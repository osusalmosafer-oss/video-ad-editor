#!/usr/bin/env node
/* يولّد «القشرة» التي تُرفع إلى الاستضافة: index.html + manifest + sw.js + version.json.
   التطبيق نفسه (JS/CSS/الأيقونات) يُحمَّل من نسخة محدّدة (commit) في GitHub عبر jsDelivr، فيبقى الرفع صغيراً.
   الاستعمال:  node tools/make-shell.js --sha <commit> [--out shell] [--cdn <base>] */
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const sha = arg('sha'); if (!sha){ console.error('--sha مطلوب'); process.exit(1); }
const out = arg('out', 'shell'), root = path.join(__dirname, '..');
const CDN = arg('cdn', `https://cdn.jsdelivr.net/gh/osusalmosafer-oss/video-ad-editor@${sha}/premiere-clone/`);
fs.mkdirSync(out, {recursive:true});
const cdn = new Set(), scripts = [];   // ملاحظة: Wix يحجز المسار /sw.js ولا يقدّم .webmanifest
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// 1) السكربتات المحلية تُحمَّل بحلقة واحدة (الرقم يظهر مرة واحدة)، بالترتيب نفسه
html = html.replace(/<script src="([^"]+)"><\/script>\s*/g, (m, u) => { if (/^(https?:|\/\/)/.test(u)) return m; scripts.push(u); cdn.add(u); return scripts.length === 1 ? '@@LOADER@@' : ''; });
html = html.replace('@@LOADER@@', `<script>(function(B,L){L.forEach(function(f){var s=document.createElement('script');s.src=B+f;s.async=false;document.body.appendChild(s)})})(window.ASSET_BASE,${JSON.stringify(scripts)});</script>\n`);
// 2) ورقة الأنماط بحلقة في الرأس
const css = [];
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, u) => { if (/^(https?:|\/\/)/.test(u)) return m; css.push(u); cdn.add(u); return ''; });
// 3) الأيقونات تبقى روابط مطلقة ثابتة (آيفون يقرؤها من الصفحة)
html = html.replace(/(src|href)="(icons\/[^"]+)"/g, (m, a, u) => { cdn.add(u); return `${a}="${CDN}${u}"`; });
html = html.replace('href="manifest.webmanifest"', 'href="manifest.json"');   // Wix لا يقدّم .webmanifest
html = html.replace('</head>', `<script>window.SW_URL="abu-sw.js";window.ASSET_BASE=${JSON.stringify(CDN)};window.APP_VERSION=${JSON.stringify(sha.slice(0, 12))};${JSON.stringify(css)}.forEach(function(f){var l=document.createElement('link');l.rel='stylesheet';l.href=window.ASSET_BASE+f;document.head.appendChild(l)});</script>\n</head>`);
fs.writeFileSync(path.join(out, 'index.html'), html);
const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
man.icons.forEach(i => { cdn.add(i.src); i.src = CDN + i.src; });
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(man, null, 2));
['assets/asas/bug.png', 'assets/asas/wa.png'].forEach(f => cdn.add(f));
const sw = `/* مونتاج أبو صهيب — service worker (القشرة): الشبكة أولاً لملفات الموقع، والكاش أولاً للـCDN (نسخ ثابتة بالـcommit). */
const CACHE = 'abu-suhaib-${sha.slice(0, 12)}';
const LOCAL = ['./', 'index.html', 'manifest.json', 'version.json'];
const BASE = ${JSON.stringify(CDN)};
const REMOTE = ${JSON.stringify([...cdn])}.map(f => BASE + f);
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(async c => { await c.addAll(LOCAL); await Promise.allSettled(REMOTE.map(u => c.add(u))); }).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === location.origin){
    e.respondWith(fetch(r, u.pathname.endsWith('version.json') ? {cache:'no-store'} : undefined).then(res => { if (res && res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r)));
  } else if (u.hostname === 'cdn.jsdelivr.net'){
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res && res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
  }
});
`;
fs.writeFileSync(path.join(out, 'abu-sw.js'), sw);   // Wix يحجز /sw.js ويقدّم عنده نسخة تلغي نفسها
fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({version:sha.slice(0, 12), built:new Date().toISOString()}));
console.log(`القشرة في ${out}: ${['index.html', 'manifest.json', 'abu-sw.js', 'version.json'].map(f => f + ' ' + fs.statSync(path.join(out, f)).size + 'B').join(' · ')} | ${cdn.size} ملفاً من الـCDN`);
