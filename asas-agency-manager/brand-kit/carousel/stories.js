/* صور ستوري (1080x1920) لمقاطع الحجز بهوية أسس المسافر. ملصق الرابط يُضاف من التطبيق في المنطقة الفارغة تحت الزر.
   الاستعمال: node stories.js [stories.json] [--out مجلد] [--chrome مسار] */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--chrome') || path.join(__dirname, 'stories.json');
const outDir = path.resolve(opt('--out', path.join(__dirname, 'out', 'stories')));
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
const kit = path.join(__dirname, '..');
const theme = JSON.parse(fs.readFileSync(path.join(kit, 'theme.json'), 'utf8'));
const chrome = [opt('--chrome', ''), process.env.CHROME_PATH || '', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/opt/pw-browsers/chromium'].filter(Boolean).find(p => fs.existsSync(p));
if (!chrome) { console.error('ما لقيت كروم. مرّر --chrome'); process.exit(1); }
const b64 = f => fs.readFileSync(path.join(kit, f)).toString('base64');
const font = (w, f) => `@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/' + f)})}`;
const logo = 'data:image/png;base64,' + b64('logos/icon-on-dark.png');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hl = (t, w) => esc(t).replace(esc(w), `<mark>${esc(w)}</mark>`);
const css = `${font(500,'Cairo-500.ttf')}${font(700,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;overflow:hidden;font-family:C,sans-serif;direction:rtl;color:#fff;position:relative;background:radial-gradient(120% 70% at 50% 0%,#2C3570 0%,${theme.bg} 55%,#161A38 100%)}
.photo{position:absolute;inset:0;background-size:cover;filter:grayscale(.85) contrast(1.08) brightness(.9);opacity:.45;-webkit-mask-image:linear-gradient(to bottom,transparent 5%,rgba(0,0,0,.6) 30%,#000 55%)}
.tint{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(31,36,73,.4),rgba(31,36,73,.15) 60%,rgba(22,26,56,.6));mix-blend-mode:multiply}
.glow{position:absolute;left:0;right:0;bottom:0;height:1100px;background:radial-gradient(70% 55% at 50% 100%,rgba(70,120,255,.38),rgba(40,132,255,.1) 55%,transparent)}
.body{position:absolute;left:80px;right:80px;top:470px}
h1{font-weight:900;font-size:128px;line-height:1.5}
mark{background:${theme.acc};color:#fff;border-radius:30px;padding:0 28px}
.sub{margin-top:30px;font-weight:700;font-size:62px;line-height:1.55;color:#DDE2F7}
.pill{position:absolute;left:0;right:0;top:1130px;display:flex;justify-content:center}
.pill span{background:${theme.acc};font-weight:900;font-size:56px;padding:22px 56px;border-radius:32px;box-shadow:0 18px 44px rgba(40,132,255,.45);text-align:center;line-height:1.4}
.zone{position:absolute;left:0;right:0;top:1330px;text-align:center;font-weight:700;font-size:44px;color:rgba(255,255,255,.55)}
.chip{position:absolute;left:0;right:0;bottom:260px;display:flex;justify-content:center}
.chip div{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2);border-radius:60px;padding:8px 34px 8px 12px;font-weight:700;font-size:36px;direction:ltr}
.chip img{width:60px;height:60px;border-radius:50%}`;
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const br = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const s of cfg.stories) {
    const img = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'bg', s.photo)).toString('base64');
    await pg.setContent(`<html><head><meta charset=utf-8><style>${css}</style></head><body>
<div class=photo style="background-image:url(${img});background-position:${s.pos || 'center top'}"></div><div class=tint></div><div class=glow></div>
<div class=body><h1>${hl(s.title, s.hl)}</h1><div class=sub>${esc(s.sub)}</div></div>
<div class=pill><span>${esc(cfg.cta)}</span></div>
<div class=zone>${'' /* مساحة فارغة لملصق الرابط */}</div>
<div class=chip><div><img src="${logo}"><span>@osusalmosafer</span></div></div></body></html>`);
    await pg.evaluate(() => document.fonts.ready);
    const f = path.join(outDir, `story-${s.id}.png`); await pg.screenshot({ path: f }); console.log(f);
  }
  await br.close();
})();
