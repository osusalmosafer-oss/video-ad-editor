/* كاروسيل «أقرب باب لفندقك؟» بتصميم جريء (لوحة رقم الباب). الاستعمال:
   node doors.js [--out مجلد] [--w 1080 --h 1350] [--safe أعلى,يمين,أسفل,يسار] [--swipe right|left] */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const W = +opt('--w', 1080), H = +opt('--h', 1350), out = path.resolve(opt('--out', path.join(__dirname, 'out', 'doors')));
const safe = (opt('--safe', '') || '').split(',').map(Number);
const SW = opt('--swipe', 'left') === 'right';
const kit = path.join(__dirname, '..');
const b64 = f => fs.readFileSync(path.join(kit, f)).toString('base64');
const img = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'bg', f)).toString('base64');
const font = (w, f) => `@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/' + f)})}`;
const logo = 'data:image/png;base64,' + b64('logos/icon-on-dark.png');
const AMB = '#FFC233', GRN = '#0E7A43', BLU = '#2884FF';
const arrow = SW ? '<path d="M4 24H66"/><path d="M48 8l18 16-18 16"/>' : '<path d="M70 24H8"/><path d="M26 8L8 24l18 16"/>';
const S = [
 { bg: 'gate-real.jpg', cover: true },
 { bg: 'haram-courtyard-a.jpg', n: '1', name: 'باب الملك عبدالعزيز', items: ['العليان جراند', 'فندق الشهداء', 'سويس أوتيل مكة'], note: 'الباب الثاني في المقطع' },
 { bg: 'haram-courtyard-b.jpg', n: '79', name: 'باب الملك فهد', items: ['فندق أنجم', 'أبراج الكسوة', 'الباصات من مواقف جبل الكعبة'], note: 'جوار دار التوحيد' },
 { bg: 'haram-wide.jpg', n: '19', name: 'باب السلام', items: ['الجاي من محبس الجن'], note: 'آخر باب في المقطع' },
 { bg: 'gate-real.jpg', ask: true },
 { bg: 'haram-wide.jpg', save: true }
];
const N = S.length;
const css = `${font(500,'Cairo-500.ttf')}${font(700,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:C,sans-serif;direction:rtl;color:#fff;position:relative;background:#0B0F26}
.ph{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(1.15) contrast(1.08)}
.ov{position:absolute;inset:0}
.top{position:absolute;top:70px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center}
.tag{background:${AMB};color:#1A1300;border-radius:60px;padding:8px 32px;font-weight:900;font-size:34px}
.cnt{background:rgba(0,0,0,.55);border-radius:40px;padding:6px 26px;font-weight:700;font-size:34px;direction:ltr}
.chip{position:absolute;left:80px;bottom:60px;display:flex;align-items:center;gap:16px;background:rgba(0,0,0,.55);border:2px solid rgba(255,255,255,.25);border-radius:60px;padding:8px 34px 8px 12px;font-weight:700;font-size:36px;direction:ltr}
.chip img{width:60px;height:60px;border-radius:50%}
.plate{position:absolute;right:80px;top:210px;min-width:330px;height:330px;padding:0 50px;border-radius:56px;background:${GRN};border:14px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:230px;line-height:1;color:#fff;box-shadow:0 30px 80px rgba(0,0,0,.6);direction:ltr}
.plate.s{font-size:190px}
.nm{position:absolute;right:80px;top:590px;left:80px;font-weight:900;font-size:96px;line-height:1.25}
.nm small{display:block;font-weight:700;font-size:40px;color:${AMB};margin-bottom:6px}
.ls{position:absolute;right:80px;left:80px;top:790px;display:flex;flex-direction:column;gap:16px}
.ls div{background:rgba(8,12,34,.82);border:3px solid rgba(255,255,255,.28);border-right:16px solid ${AMB};border-radius:30px;padding:18px 36px;font-weight:900;font-size:56px;line-height:1.25}
.nt{position:absolute;left:80px;width:400px;top:300px;font-weight:900;font-size:50px;line-height:1.35;color:${AMB};text-align:right}
.big{position:absolute;right:80px;left:80px;top:300px;font-weight:900;font-size:150px;line-height:1.18}
.big b{color:${AMB};font-weight:900}
.sub{position:absolute;right:80px;left:80px;font-weight:700;font-size:58px;line-height:1.4}
.pill{position:absolute;left:0;right:0;bottom:170px;display:flex;justify-content:center}
.pill span{display:inline-flex;align-items:center;gap:26px;background:${AMB};color:#1A1300;font-weight:900;font-size:56px;padding:20px 54px;border-radius:34px;box-shadow:0 18px 50px rgba(255,194,51,.4)}
`;
function slide(s, i) {
  let ov = 'background:linear-gradient(to bottom,rgba(8,12,34,.55),rgba(8,12,34,.2) 35%,rgba(8,12,34,.85))';
  let b = '';
  if (s.cover) { ov = 'background:linear-gradient(to bottom,rgba(8,12,34,.7),rgba(8,12,34,.15) 40%,rgba(8,12,34,.9))';
    b = `<div class=big><b>أقرب باب</b><br>لفندقك؟</div><div class=sub style="top:760px;color:#fff">اعرف بابك قبل ما تمشي</div><div class=pill><span>اسحب ${SW ? 'لليمين' : 'لليسار'}<svg width="74" height="48" viewBox="0 0 74 48" fill="none" stroke="#1A1300" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${arrow}</svg></span></div>`; }
  else if (s.n) { ov = 'background:linear-gradient(to bottom,rgba(8,12,34,.7),rgba(8,12,34,.55) 40%,rgba(8,12,34,.92))';
    b = `<div class="plate ${s.n.length > 1 ? 's' : ''}">${s.n}</div><div class=nm><small>رقم الباب</small>${s.name}</div><div class=ls>${s.items.map(t => `<div>${t}</div>`).join('')}</div><div class=nt>${s.note}</div>`; }
  else if (s.ask) { ov = 'background:linear-gradient(to bottom,rgba(8,12,34,.8),rgba(8,12,34,.55) 50%,rgba(8,12,34,.92))';
    b = `<div class=big style="font-size:132px;top:330px">فندقك <b>مو هنا؟</b></div><div class=sub style="top:780px;font-size:64px">اكتب اسمه في التعليقات<br>ونقولك أقرب باب له</div>`; }
  else { ov = 'background:linear-gradient(to bottom,rgba(8,12,34,.8),rgba(8,12,34,.55) 50%,rgba(8,12,34,.92))';
    b = `<div class=big style="font-size:132px;top:330px"><b>احفظ</b> المنشور</div><div class=sub style="top:700px;font-size:62px">وأرسله لمن يعتمر معك<br>قبل ما تروحون</div>`; }
  const top = `<div class=top><div class=tag>أبواب الحرم</div>${s.cover ? '' : `<div class=cnt>${i + 1}/${N}</div>`}</div>`;
  const chip = `<div class=chip><img src="${logo}"><span>@osusalmosafer</span></div>`;
  let fr0 = '', fr1 = '';
  if (safe.length === 4 && safe.every(Number.isFinite)) {
    const [st, sr, sb, sl] = safe, aw = W - sl - sr, ah = H - st - sb, k = Math.min(aw / 920, ah / 1220, 1);
    const fx = sl + (aw - 920 * k) / 2 - 80 * k, fy = st + (ah - 1220 * k) / 2 - 70 * k;
    fr0 = `<div style="position:absolute;left:${fx}px;top:${fy}px;width:1080px;height:1350px;transform-origin:0 0;transform:scale(${k})">`; fr1 = '</div>';
  }
  return `<html><head><meta charset=utf-8><style>${css}</style></head><body><div class=ph style="background-image:url(${img(s.bg)})"></div><div class=ov style="${ov}"></div>${fr0}${top}${b}${chip}${fr1}</body></html>`;
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: W, height: H } });
  for (let i = 0; i < N; i++) { await pg.setContent(slide(S[i], i)); await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(out, `slide-${String(i + 1).padStart(2, '0')}.png`) }); }
  await br.close(); console.log(out);
})();
