/* يولّد بطاقات «سؤال من الحرم» بهوية أسس المسافر.
   الاستعمال:  node render-cards.js [questions.json] [--out مجلد] [--chrome مسار_كروم]
   يحتاج: npm i playwright-core  +  متصفح كروم (أو إدج) منصّب.
   المخرجات لكل سؤال:
     <id>_video-full.png     1080x1920  بطاقة كاملة للثانيتين الأوليين من الفيديو
     <id>_video-overlay.png  1080x1920  شفافة، البطاقة فقط فوق الفيديو
     <id>_carousel.png       1080x1350  شريحة سؤال وجواب للكاروسيل (4:5)
   "sample": true بالملف يضع شريط «عيّنة» على كل صورة. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--chrome') || path.join(__dirname, 'questions.json');
const outDir = opt('--out', path.join(__dirname, 'samples'));
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
const kit = path.join(__dirname, '..');
const theme = JSON.parse(fs.readFileSync(path.join(kit, 'theme.json'), 'utf8'));

const chromeCandidates = [
  opt('--chrome', ''), process.env.CHROME_PATH || '',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/opt/pw-browsers/chromium',
].filter(Boolean);
const chromePath = chromeCandidates.find(p => fs.existsSync(p));
if (!chromePath) { console.error('ما لقيت كروم. مرّر المسار بـ --chrome'); process.exit(1); }

const b64 = f => fs.readFileSync(path.join(kit, f)).toString('base64');
const font = (w, f) => `@font-face{font-family:Cairo;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/' + f)})}`;
const logoD = 'data:image/png;base64,' + b64('logos/logo-horizontal-on-dark.png');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const NAVY = theme.bg, BLUE = theme.acc, INK = theme.ink, MUT = theme.mut;
const css = `
${font(500, 'Cairo-500.ttf')}${font(700, 'Cairo-700.ttf')}${font(900, 'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%}
body{font-family:Cairo,sans-serif;direction:rtl;color:${INK}}
.bg{background:linear-gradient(165deg,${NAVY} 0%,#272E5C 100%)}
.fill{position:absolute;inset:0}
.col{position:absolute;left:80px;right:80px;display:flex;flex-direction:column}
.tag{align-self:flex-start;background:${BLUE};color:#fff;font-weight:900;font-size:42px;padding:10px 38px;border-radius:60px;margin-bottom:34px}
.qcard{background:#fff;color:${NAVY};border-radius:44px;padding:58px 56px 62px;box-shadow:0 24px 70px #0007}
.qcard small{display:block;font-weight:700;font-size:34px;color:${BLUE};margin-bottom:16px}
.qcard b{display:block;font-weight:900;font-size:74px;line-height:1.38}
.ans{margin-top:44px;font-weight:900;font-size:86px;line-height:1.3;color:#fff}
.ans span{display:inline-block;color:${BLUE};background:#fff;border-radius:24px;padding:4px 28px}
.note{margin-top:22px;font-weight:500;font-size:42px;color:${MUT};line-height:1.5}
.logo{position:absolute;left:0;right:0;display:flex;justify-content:center}
.logo img{width:520px}
.foot{position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:38px;color:${MUT};direction:ltr}
.cm{display:flex;gap:26px;align-items:flex-start;direction:rtl}
.av{flex:0 0 96px;width:96px;height:96px;border-radius:50%;background:#D5DAE8;position:relative;overflow:hidden}
.av:before{content:'';position:absolute;left:30px;top:16px;width:36px;height:36px;border-radius:50%;background:#fff}
.av:after{content:'';position:absolute;left:14px;top:58px;width:68px;height:60px;border-radius:50%;background:#fff}
.bub{background:#EEF1F8;color:${NAVY};border-radius:36px;border-top-right-radius:8px;padding:34px 40px;font-weight:700;font-size:62px;line-height:1.45}
.from{font-weight:700;font-size:32px;color:${BLUE};margin:0 0 14px 0}
.sample{position:absolute;top:28px;right:60px;background:#C0392B;color:#fff;font-weight:700;font-size:30px;padding:6px 24px;border-radius:12px}
`;
const sample = cfg.sample ? '<div class="sample">عيّنة — بيانات تجريبية</div>' : '';
const tag = `<div class="tag">${esc(cfg.series || 'سؤال من الحرم')}</div>`;
const qcard = (q, it) => it && it.comment
  ? `<div class="qcard"><small>من تعليقات الجمهور</small><div class="cm"><div class="av"></div><div class="bub">${esc(it.comment)}</div></div></div>`
  : `<div class="qcard"><small>سؤال وصلنا</small><b>${esc(q)}</b></div>`;

const views = it => ({
  'video-full': { w: 1080, h: 1920, transparent: false, html:
    `<div class="fill bg"></div>${sample}
     <div class="logo" style="top:200px"><img src="${logoD}"></div>
     <div class="col" style="top:520px">${tag}${qcard(it.question, it)}
       <div class="note" style="margin-top:56px;text-align:center">الجواب من الساحات 👇</div></div>
     <div class="foot" style="top:1560px">${esc(theme.handle)}</div>` },
  'video-overlay': { w: 1080, h: 1920, transparent: true, html:
    `<div class="col" style="top:330px">${tag}${qcard(it.question, it)}</div>` },
  'carousel': { w: 1080, h: 1350, transparent: false, html:
    `<div class="fill bg"></div>${sample}
     <div class="logo" style="top:120px"><img src="${logoD}" style="width:420px"></div>
     <div class="col" style="top:300px">${tag}${qcard(it.question, it)}
       <div class="ans"><span>${esc(it.answer)}</span></div>
       ${it.note ? `<div class="note">${esc(it.note)}</div>` : ''}</div>
     <div class="foot" style="top:1240px">${esc(theme.handle)}</div>` },
});

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const br = await chromium.launch({ executablePath: chromePath });
  for (const it of cfg.items) {
    for (const [name, v] of Object.entries(views(it))) {
      if (name === 'carousel' && !it.answer) continue;   // الكاروسيل يحتاج جواباً مؤكداً
      const pg = await br.newPage({ viewport: { width: v.w, height: v.h } });
      await pg.setContent(`<html><head><meta charset=utf-8><style>${css}${v.transparent ? 'html,body{background:transparent}' : ''}</style></head><body>${v.html}</body></html>`);
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForTimeout(250);
      const f = path.join(outDir, `${it.id}_${name}.png`);
      await pg.screenshot({ path: f, omitBackground: v.transparent });
      await pg.close(); console.log('OK', f);
    }
  }
  await br.close();
})();
