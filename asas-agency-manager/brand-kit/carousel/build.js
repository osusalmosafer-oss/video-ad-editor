/* كاروسيل «ليش ما نكتب سعر الفندق؟» بهوية أسس المسافر. 1080x1350 (4:5).
   الاستعمال: node build.js [slides.json] [--out مجلد] [--chrome مسار]   يحتاج: playwright-core + كروم */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--chrome') || path.join(__dirname, 'slides.json');
const outDir = path.resolve(opt('--out', path.join(__dirname, 'out')));
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
const kit = path.join(__dirname, '..');
const theme = JSON.parse(fs.readFileSync(path.join(kit, 'theme.json'), 'utf8'));
const chrome = [opt('--chrome', ''), process.env.CHROME_PATH || '', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/opt/pw-browsers/chromium'].filter(Boolean).find(p => fs.existsSync(p));
if (!chrome) { console.error('ما لقيت كروم. مرّر --chrome'); process.exit(1); }
const b64 = f => fs.readFileSync(path.join(kit, f)).toString('base64');
const font = (w, f) => `@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/' + f)})}`;
const logo = 'data:image/png;base64,' + b64('logos/icon-on-dark.png');
const logoH = 'data:image/png;base64,' + b64('logos/logo-horizontal-on-dark.png');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hl = (t, w) => esc(t).replace(esc(w), `<mark>${esc(w)}</mark>`);
const N = cfg.slides.length;
const css = `${font(500,'Cairo-500.ttf')}${font(700,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;overflow:hidden;font-family:C,sans-serif;direction:rtl;color:#fff;position:relative;
 background:radial-gradient(120% 80% at 50% 0%,#2C3570 0%,${theme.bg} 55%,#161A38 100%)}
.top{position:absolute;top:70px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center}
.tag{background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2);border-radius:60px;padding:10px 34px;font-weight:700;font-size:36px}
.cnt{background:rgba(0,0,0,.35);border-radius:40px;padding:6px 26px;font-weight:700;font-size:34px;direction:ltr}
.body{position:absolute;left:80px;right:80px;top:230px}
.kick{font-weight:700;font-size:44px;color:${theme.mut};margin-bottom:18px}
h1{font-weight:900;font-size:112px;line-height:1.5}
h1.big{font-size:132px;line-height:1.5}
h1.cta{font-size:100px}
mark{background:${theme.acc};color:#fff;border-radius:28px;padding:0 26px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.sub{margin-top:36px;font-weight:700;font-size:54px;line-height:1.5;color:#DDE2F7}
.card{margin-top:56px;background:rgba(255,255,255,.09);border:2px solid rgba(255,255,255,.22);border-radius:44px;padding:44px 52px;box-shadow:0 30px 70px rgba(0,0,0,.35)}
.card small{display:block;font-weight:700;font-size:36px;color:${theme.acc};margin-bottom:14px}
.card b{display:block;font-weight:900;font-size:58px;line-height:1.5}
.foot{margin-top:48px;font-weight:500;font-size:46px;line-height:1.55;color:#C9D0EE}
.list{margin-top:36px;display:flex;flex-direction:column;gap:12px}
.list div{display:flex;align-items:center;gap:26px;background:rgba(255,255,255,.09);border:2px solid rgba(255,255,255,.2);border-radius:30px;padding:8px 30px;font-weight:900;font-size:52px;line-height:1.2}
.list i{font-style:normal;background:${theme.acc};border-radius:50%;width:60px;height:60px;display:inline-flex;align-items:center;justify-content:center;font-size:36px}
.pill{position:absolute;left:0;right:0;bottom:150px;display:flex;justify-content:center}
.pill span{background:${theme.acc};font-weight:900;font-size:64px;padding:20px 64px;border-radius:32px;box-shadow:0 18px 44px rgba(40,132,255,.45)}
.chip{position:absolute;left:80px;bottom:60px;display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2);border-radius:60px;padding:8px 34px 8px 12px;font-weight:700;font-size:36px;direction:ltr}
.chip img{width:60px;height:60px;border-radius:50%}
.swipe{position:absolute;right:80px;bottom:76px;font-weight:700;font-size:34px;color:${theme.mut}}
`;
function slide(s, i) {
  let b = '';
  if (s.type === 'cover') b = `<div class=body style="top:300px"><h1 class=big>${hl(s.title, s.hl)}</h1><div class=sub>${esc(s.sub)}</div></div><div class=pill style="bottom:240px"><span style="background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.25);box-shadow:none;font-size:48px">اسحب لليسار</span></div>`;
  else if (s.type === 'step') b = `<div class=body><div class=kick>الخطوة ${esc(s.n)}</div><h1>${hl(s.title, s.hl)}</h1><div class=card><small>${esc(s.card.label)}</small>${s.card.lines.map(l => `<b>${esc(l)}</b>`).join('')}</div><div class=foot>${esc(s.foot)}</div></div>`;
  else b = `<div class=body><h1 class=cta>${hl(s.title, s.hl)}</h1><div class=list>${s.list.map((l, k) => `<div><i>${k + 1}</i>${esc(l)}</div>`).join('')}</div></div><div class=pill style="bottom:150px"><span>${esc(s.pill)}</span></div>`;
  return `<html><head><meta charset=utf-8><style>${css}</style></head><body>
<div class=top><div class=tag>${esc(cfg.tag)}</div>${s.type === 'cover' ? '' : `<div class=cnt>${i + 1}/${N}</div>`}</div>${b}
<div class=chip><img src="${logo}"><span>@osusalmosafer</span></div></body></html>`;
}
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const br = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1080, height: 1350 } });
  for (let i = 0; i < N; i++) {
    await pg.setContent(slide(cfg.slides[i], i)); await pg.evaluate(() => document.fonts.ready);
    const f = path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`); await pg.screenshot({ path: f }); console.log(f);
  }
  await br.close();
})();
