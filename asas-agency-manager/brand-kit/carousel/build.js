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

/* ظلال خلفية: برج الساعة، مآذن الحرم وساحاته، أبراج العنوان جبل عمر (رسم مبسّط أصلي، ليس صورة) */
const SKY = {
 clock: `<g>
  <g class=far><rect x=60 y=470 width=70 height=230 /><rect x=140 y=420 width=60 height=280 /><rect x=880 y=440 width=70 height=260 /><rect x=960 y=500 width=70 height=200 /><rect x=205 y=520 width=70 height=180 /><rect x=805 y=500 width=70 height=200 /></g>
  <g class=near>
  <rect x=330 y=560 width=420 height=140 /><rect x=250 y=470 width=95 height=230 /><rect x=735 y=470 width=95 height=230 />
  <rect x=262 y=440 width=70 height=40 /><rect x=748 y=440 width=70 height=40 />
  <rect x=470 y=250 width=140 height=320 />
  <rect x=435 y=170 width=210 height=130 /><rect x=435 y=150 width=26 height=26 /><rect x=619 y=150 width=26 height=26 />
  <rect x=500 y=100 width=80 height=75 />
  <polygon points="508,100 572,100 546,28 534,28" />
  <path d="M547 4 a15 15 0 1 0 0 30 a11.5 11.5 0 1 1 0 -30z" />
  </g>
  <circle class=face cx=540 cy=236 r=46 /><circle class=face2 cx=540 cy=236 r=34 />
  <rect class=slit x=533 y=210 width=14 height=26 />
 </g>`,
 haram: (() => {
   const mn = (x, h, w = 26) => `<rect x=${x - w / 2} y=${700 - h} width=${w} height=${h} /><rect x=${x - w} y=${700 - h + 70} width=${w * 2} height=14 /><rect x=${x - w} y=${700 - h + 170} width=${w * 2} height=14 /><rect x=${x - w * .8} y=${700 - h - 26} width=${w * 1.6} height=30 /><polygon points="${x - w * .7},${700 - h - 26} ${x + w * .7},${700 - h - 26} ${x},${700 - h - 120}" /><circle cx=${x} cy=${700 - h - 126} r=6 />`;
   const dome = (x, r) => `<path d="M${x - r} 700 a${r} ${r} 0 0 1 ${2 * r} 0z" /><rect x=${x - 4} y=${700 - r - 22} width=8 height=24 />`;
   let arches = ''; for (let i = 0; i < 18; i++) arches += `<path d="M${40 + i * 56} 700 v-44 a18 18 0 0 1 36 0 v44z" />`;
   return `<g><g class=far>${mn(120, 400, 20)}${mn(960, 400, 20)}${dome(250, 70)}${dome(830, 70)}</g>
   <g class=near>${mn(330, 520)}${mn(540, 600, 30)}${mn(750, 520)}<rect x=0 y=600 width=1080 height=100 />${dome(440, 55)}${dome(640, 55)}</g>
   <g class=cut>${arches}</g></g>`; })(),
 address: (() => {
   let w = ''; for (let y = 200; y < 560; y += 26) w += `<rect class=win x=345 y=${y} width=160 height=4 /><rect class=win x=575 y=${y + 40} width=160 height=4 />`;
   return `<g><g class=far><rect x=110 y=330 width=140 height=370 /><rect x=125 y=300 width=110 height=40 /><rect x=830 y=290 width=140 height=410 /><rect x=845 y=262 width=110 height=40 /><rect x=20 y=480 width=80 height=220 /><rect x=985 y=450 width=75 height=250 /></g>
   <g class=near><rect x=300 y=560 width=480 height=140 />
   <rect x=330 y=200 width=190 height=380 /><rect x=345 y=160 width=160 height=48 /><rect x=370 y=120 width=110 height=48 /><rect x=395 y=92 width=60 height=34 />
   <rect x=560 y=250 width=190 height=330 /><rect x=575 y=212 width=160 height=48 /><rect x=600 y=176 width=110 height=44 /><rect x=625 y=150 width=60 height=32 />
   ${w}</g></g>`; })()
};

const N = cfg.slides.length;
const css = `${font(500,'Cairo-500.ttf')}${font(700,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;overflow:hidden;font-family:C,sans-serif;direction:rtl;color:#fff;position:relative;
 background:radial-gradient(120% 80% at 50% 0%,#2C3570 0%,${theme.bg} 55%,#161A38 100%)}
.photo{position:absolute;inset:0;background-size:cover;background-position:center top;filter:grayscale(.85) contrast(1.08) brightness(.9);opacity:.42;
 -webkit-mask-image:linear-gradient(to bottom,transparent 8%,rgba(0,0,0,.55) 30%,#000 55%);mask-image:linear-gradient(to bottom,transparent 8%,rgba(0,0,0,.55) 30%,#000 55%)}
.tint{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(31,36,73,.35),rgba(31,36,73,.15) 60%,rgba(22,26,56,.55));mix-blend-mode:multiply}
.glow{position:absolute;left:0;right:0;bottom:0;height:900px;background:radial-gradient(70% 55% at 50% 100%,rgba(70,120,255,.38) 0%,rgba(40,132,255,.10) 55%,transparent 100%)}
.sky{position:absolute;left:0;bottom:0;width:1080px;height:880px;-webkit-mask-image:linear-gradient(to top,#000 50%,rgba(0,0,0,.85) 80%,rgba(0,0,0,.6) 100%);mask-image:linear-gradient(to top,#000 50%,rgba(0,0,0,.85) 80%,rgba(0,0,0,.6) 100%)}
.sky .far{fill:rgba(140,170,255,.10)}.sky .near{fill:rgba(150,180,255,.18)}.sky .near rect.win{fill:rgba(255,255,255,.09)}
.sky .face{fill:none;stroke:rgba(150,185,255,.28);stroke-width:5}.sky .face2{fill:rgba(150,185,255,.10)}.sky .slit{fill:rgba(150,185,255,.25)}
.sky .cut{fill:rgba(31,36,73,.55)}
.sky g.near{filter:drop-shadow(0 0 26px rgba(70,120,255,.55))}
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
.card{margin-top:56px;background:rgba(31,36,73,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.22);border-radius:44px;padding:44px 52px;box-shadow:0 30px 70px rgba(0,0,0,.35)}
.card small{display:block;font-weight:700;font-size:36px;color:${theme.acc};margin-bottom:14px}
.card b{display:block;font-weight:900;font-size:58px;line-height:1.5}
.foot{margin-top:48px;font-weight:500;font-size:46px;line-height:1.55;color:#C9D0EE}
.list{margin-top:36px;display:flex;flex-direction:column;gap:12px}
.list div{display:flex;align-items:center;gap:26px;background:rgba(31,36,73,.6);border:2px solid rgba(255,255,255,.2);border-radius:30px;padding:8px 30px;font-weight:900;font-size:52px;line-height:1.2}
.list i{font-style:normal;background:${theme.acc};border-radius:50%;width:60px;height:60px;display:inline-flex;align-items:center;justify-content:center;font-size:36px}
.pill{position:absolute;left:0;right:0;bottom:150px;display:flex;justify-content:center}
.pill span{background:${theme.acc};font-weight:900;font-size:64px;padding:20px 64px;border-radius:32px;box-shadow:0 18px 44px rgba(40,132,255,.45)}
.chip{position:absolute;left:80px;bottom:60px;display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2);border-radius:60px;padding:8px 34px 8px 12px;font-weight:700;font-size:36px;direction:ltr}
.chip img{width:60px;height:60px;border-radius:50%}
.pill span.sw{display:inline-flex;align-items:center;gap:26px;font-size:54px;padding:18px 48px;background:rgba(40,132,255,.22);border:3px solid ${theme.acc};box-shadow:0 0 40px rgba(40,132,255,.5)}
.swipe{position:absolute;right:80px;bottom:76px;font-weight:700;font-size:34px;color:${theme.mut}}
`;
function slide(s, i) {
  let b = '';
  if (s.type === 'cover') b = `<div class=body style="top:300px"><h1 class=big>${hl(s.title, s.hl)}</h1><div class=sub>${esc(s.sub)}</div></div><div class=pill style="bottom:240px"><span class=sw>اسحب لليسار<svg width="74" height="48" viewBox="0 0 74 48" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M70 24H8"/><path d="M26 8L8 24l18 16"/></svg></span></div>`;
  else if (s.type === 'step') b = `<div class=body><div class=kick>الخطوة ${esc(s.n)}</div><h1>${hl(s.title, s.hl)}</h1><div class=card><small>${esc(s.card.label)}</small>${s.card.lines.map(l => `<b>${esc(l)}</b>`).join('')}</div><div class=foot>${esc(s.foot)}</div></div>`;
  else b = `<div class=body><h1 class=cta>${hl(s.title, s.hl)}</h1><div class=list>${s.list.map((l, k) => `<div><i>${k + 1}</i>${esc(l)}</div>`).join('')}</div></div><div class=pill style="bottom:150px"><span>${esc(s.pill)}</span></div>`;
  return `<html><head><meta charset=utf-8><style>${css}</style></head><body>
${s.photo ? `<div class=photo style="background-image:url(data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname,'bg',s.photo)).toString('base64')})"></div><div class=tint></div>` : ''}<div class=glow></div>${s.photo ? '' : `<svg class=sky viewBox="0 0 1080 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${SKY[s.sky || 'clock']}</svg>`}
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
