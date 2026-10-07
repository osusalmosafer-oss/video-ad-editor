/* عيّنة فيديو «الكلمة المفتاحية» بهوية أسس المسافر.
   الاستعمال:  node build-demo.js [--out demo.mp4] [--chrome مسار] [--fps 30]
   يحتاج: playwright-core (npm i playwright-core)، كروم أو إدج، و ffmpeg في PATH، و python لتوليد الصوت.
   ما في العيّنة: بطاقة السؤال، كلمة مفتاحية بنمطين (أ: كلمة كبيرة، ب: مستطيل أزرق)، 5 مؤثرات هادئة، شريط تقدم، كرت نهاية.
   الصورة المركزية «لقطتك هنا» مكان فيديو المتحدث الحقيقي. */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const kit = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(opt('--out', path.join(__dirname, 'demo.mp4')));
const FPS = +opt('--fps', 30), DUR = 20, W = 1080, H = 1920;
const chrome = [opt('--chrome', ''), process.env.CHROME_PATH || '',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/opt/pw-browsers/chromium'].filter(Boolean).find(p => fs.existsSync(p));
if (!chrome) { console.error('ما لقيت كروم. مرّر --chrome'); process.exit(1); }
const b64 = f => fs.readFileSync(path.join(kit, f)).toString('base64');
const font = (w, f) => `@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/' + f)})}`;
const logoH = 'data:image/png;base64,' + b64('logos/logo-horizontal-on-dark.png');
const logoV = 'data:image/png;base64,' + b64('logos/logo-vertical-on-dark.png');
const theme = JSON.parse(fs.readFileSync(path.join(kit, 'theme.json'), 'utf8'));
const html = `<html><head><meta charset=utf-8><style>
${font(500,'Cairo-500.ttf')}${font(700,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;overflow:hidden;background:${theme.bg};font-family:C,sans-serif;direction:rtl;color:#fff;position:relative}
.abs{position:absolute}
#bg{inset:0;background:linear-gradient(165deg,#1F2449,#272E5C)}
#grid{inset:0;opacity:.07;background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);background-size:60px 60px}
#ph{left:90px;right:90px;top:340px;height:900px;border-radius:40px;border:3px dashed rgba(255,255,255,.28);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:54px;color:rgba(255,255,255,.55);text-align:center;line-height:1.5}
#cap{left:80px;right:80px;bottom:460px;background:rgba(31,36,73,.96);border:3px solid rgba(255,255,255,.14);border-radius:38px;padding:30px 40px;font-weight:800;font-size:56px;line-height:1.45;text-align:center;box-shadow:0 20px 48px rgba(0,0,0,.35)}
#tag{background:${theme.acc};color:#fff;font-weight:900;font-size:42px;padding:10px 38px;border-radius:60px}
#q{background:#fff;color:${theme.bg};border-radius:44px;padding:58px 56px 62px;box-shadow:0 24px 70px #0007}
#q small{display:block;font-weight:700;font-size:34px;color:${theme.acc};margin-bottom:16px}
#q b{display:block;font-weight:900;font-size:74px;line-height:1.38}
#kwA span,#kwB span{white-space:nowrap;display:inline-block}
#kwA{left:0;right:0;text-align:center;font-weight:900;font-size:128px;line-height:1.1;text-shadow:0 8px 30px rgba(0,0,0,.55)}
#kwA i{display:block;width:60%;height:14px;margin:14px auto 0;background:${theme.acc};border-radius:8px;transform-origin:center}
#kwB{left:0;right:0;display:flex;justify-content:center}
#kwB span{background:${theme.acc};color:#fff;font-weight:900;font-size:92px;padding:20px 54px;border-radius:30px;box-shadow:0 18px 44px rgba(40,132,255,.45)}
#lab{top:48px;left:50px;font-weight:700;font-size:34px;color:rgba(255,255,255,.65)}
#smp{top:36px;right:50px;background:#C0392B;color:#fff;font-weight:700;font-size:30px;padding:6px 24px;border-radius:12px}
#bar{left:60px;right:60px;top:1492px;height:7px;border-radius:4px;background:rgba(255,255,255,.18)}
#bar div{height:100%;background:${theme.acc};border-radius:4px;width:0}
#flash{inset:0;background:#fff;opacity:0}
#end{inset:0;background:${theme.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:50px;opacity:0}
#end img{width:620px}
#end h1{font-weight:900;font-size:96px}
#end p{font-weight:700;font-size:46px;color:${theme.mut}}
</style></head><body>
<div id=bg class=abs></div><div id=grid class=abs></div>
<div id=ph class=abs>لقطتك هنا<br>(فيديو المتحدث)</div>
<div id=qwrap class=abs style="left:80px;right:80px;top:520px"><div id=tag style="display:inline-block;margin-bottom:34px">سؤال من الحرم</div><div id=q><small>من تعليقات الجمهور</small><b>هل أقدر أصلي في مصلى برج الساعة؟</b></div></div>
<div id=kwA class=abs style="top:1010px;opacity:0"><span></span><i></i></div>
<div id=kwB class=abs style="top:1060px;opacity:0"><span></span></div>
<div id=cap class=abs style="opacity:0"></div>
<div id=bar class=abs><div></div></div>
<div id=flash class=abs></div>
<div id=end class=abs><img src="${logoV}"><h1>عندك سؤال؟</h1><p>اكتبه في التعليقات</p></div>
<div id=lab class=abs></div><div id=smp class=abs>عيّنة تجريبية</div>
<script>
const E=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
const B=t=>{t=Math.min(1,Math.max(0,t));const c=1.9;return 1+ (c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const $=id=>document.getElementById(id);
const caps=[[2.6,6.8,'المصلى يعتمد على إدارة الفندق'],[6.8,11,'أحياناً يسمحون وأحياناً لا'],[11,14.5,'فالأفضل تتأكد قبل لا تروح'],[14.5,17,'وانظر أين المدخل بنفسك']];
const kws=[
 {s:3.2,e:6.0,st:'A',t:'إدارة الفندق'},
 {s:7.5,e:10.5,st:'B',t:'أحياناً يسمحون'},
 {s:11.5,e:14.0,st:'B',t:'تأكد قبل لا تروح'},
 {s:14.5,e:16.8,st:'A',t:'المدخل'}];
function render(t){
  // بطاقة السؤال 0 إلى 2.4
  const qo = t<2.4 ? (t<0.5?E(t/0.5):1) : 1-E((t-2.4)/0.4);
  $('qwrap').style.opacity=qo; $('qwrap').style.transform='translateY('+((1-qo)*40)+'px)';
  // مكان المتحدث
  $('ph').style.opacity = t<2.2?0.0:(t<17?E((t-2.2)/0.4):1-E((t-17)/0.3));
  // الكابشن
  let c=caps.find(x=>t>=x[0]&&t<x[1]); const cap=$('cap');
  if(c){cap.textContent=c[2];const a=Math.min(E((t-c[0])/0.2),E((c[1]-t)/0.15));cap.style.opacity=a;cap.style.transform='translateY('+((1-a)*24)+'px)'}else cap.style.opacity=0;
  // الكلمات المفتاحية
  $('kwA').style.opacity=0;$('kwB').style.opacity=0;let lab='';
  for(const k of kws){ if(t>=k.s&&t<k.e){
    const el=$(k.st==='A'?'kwA':'kwB'); const sp=el.querySelector('span'); sp.textContent=k.t;
    let fs=k.st==='A'?128:92; sp.style.fontSize=fs+'px'; while(sp.offsetWidth>(k.st==='A'?900:880)&&fs>40){fs-=4;sp.style.fontSize=fs+'px'}
    const p=(t-k.s)/0.28, out=Math.min(1,(k.e-t)/0.2);
    el.style.opacity=Math.min(E(p*1.2),out);
    const sc=0.7+0.3*B(p); el.style.transform='scale('+sc+') rotate('+(k.st==='B'?-2*(1-E(p)):0)+'deg)';
    if(k.st==='A'){el.querySelector('i').style.transform='scaleX('+E((t-k.s-0.1)/0.35)+')'}
    lab= k.st==='A'?'نمط أ: كلمة كبيرة':'نمط ب: مستطيل أزرق';
  }}
  $('lab').textContent=lab;
  // وميض خفيف جداً مع الكاميرا 14.5
  $('flash').style.opacity = (t>=14.5&&t<14.65)? 0.10*(1-(t-14.5)/0.15):0;
  // شريط التقدم
  $('bar').firstElementChild.style.width=(Math.min(1,t/17)*100)+'%';
  $('bar').style.opacity = t<17.3?1:0;
  // كرت النهاية
  $('end').style.opacity = t<17?0:E((t-17)/0.5);
}
</script></body></html>`;
(async () => {
  const frames = path.join(__dirname, '_frames'); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  const br = await chromium.launch({ executablePath: chrome });
  const pg = await br.newPage({ viewport: { width: W, height: H } });
  await pg.setContent(html); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
  const N = FPS * DUR;
  for (let i = 0; i < N; i++) {
    await pg.evaluate(t => render(t), i / FPS);
    await pg.screenshot({ path: path.join(frames, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
    if (i % 100 === 0) console.log('frame', i, '/', N);
  }
  await br.close();
  const wav = path.join(__dirname, '_sfx.wav');
  const py = process.platform === 'win32' ? 'python' : 'python3';
  cp.execFileSync(py, [path.join(__dirname, 'sfx.py'), wav], { stdio: 'inherit' });
  cp.execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%05d.jpg'), '-i', wav,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-c:a', 'aac', '-b:a', '160k', '-shortest', out], { stdio: 'inherit' });
  fs.rmSync(frames, { recursive: true, force: true });
  console.log('تم:', out);
})();
