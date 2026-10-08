/* تجربة «سيل أسئلة الأسعار»: بطاقات تعليقات حقيقية تتدفق فوق بعض بفارق أجزاء من الثانية، ثم الجواب بخمس كلمات مفتاحية.
   الاستعمال: node build.js [--out demo.mp4] [--chrome مسار] [--sample]   (يحتاج playwright-core و ffmpeg و python) */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const kit = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(opt('--out', path.join(__dirname, 'demo.mp4')));
const SAMPLE = args.includes('--sample'), FPS = 30, DUR = 20, W = 1080, H = 1920;
const chrome = [opt('--chrome',''), process.env.CHROME_PATH||'', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/opt/pw-browsers/chromium'].filter(Boolean).find(p=>fs.existsSync(p));
if(!chrome){console.error('ما لقيت كروم');process.exit(1);}
const b64=f=>fs.readFileSync(path.join(kit,f)).toString('base64');
const font=(w,f)=>`@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/'+f)})}`;
const logoV='data:image/png;base64,'+b64('logos/logo-vertical-on-dark.png');
const theme=JSON.parse(fs.readFileSync(path.join(kit,'theme.json'),'utf8'));
const IC={
 facebook:'<svg width="40" height="40" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#1877F2"/><path d="M26.5 40V27h4.4l.7-5h-5.1v-3.2c0-1.5.5-2.5 2.6-2.5h2.6V11.8c-.5-.1-2-.2-3.8-.2-3.8 0-6.3 2.3-6.3 6.5V22H17v5h4.6v13z" fill="#fff"/></svg>',
 instagram:'<svg width="40" height="40" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".4" stop-color="#FA7E1E"/><stop offset=".7" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#g)"/><rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="32" cy="16" r="2" fill="#fff"/></svg>',
 tiktok:'<svg width="40" height="40" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#111"/><path d="M26 10v18a5 5 0 1 1-5-5M26 10c1 4 4 6 8 6" fill="none" stroke="#fff" stroke-width="4"/></svg>'};
const ICONS=['facebook','instagram','tiktok'].map(k=>IC[k]).join('');
/* تعليقات حقيقية بلا أسماء (من فيسبوك وإنستقرام وتيك توك، 6 إلى 8 أكتوبر 2026) */
const CARDS=[['facebook','كم الأسعار في هذا الفندق'],['tiktok','كم سعر الليلة'],['facebook','كم سعر الغرفة المزدوجة'],['instagram','كلشي شفناه الا الأسعار'],
 ['facebook','اسعار'],['tiktok','السعر كم لي يوم الخميس انشالله'],['facebook','الاسعار'],['facebook','كم سعر الغرفة الثنائية في شهر نوفمبر'],
 ['tiktok','بكم'],['tiktok','كم السعر للجناح وكم سرير داخل الجناح'],['tiktok','كم السعر']];
const html=`<html><head><meta charset=utf-8><style>
${font(500,'Cairo-500.ttf')}${font(700,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;overflow:hidden;background:${theme.bg};font-family:C,sans-serif;direction:rtl;color:#fff;position:relative}
.abs{position:absolute}
#bg{inset:0;background:linear-gradient(165deg,#1F2449,#272E5C)}
#ph{left:90px;right:90px;top:420px;height:760px;border-radius:40px;border:3px dashed rgba(255,255,255,.28);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:54px;color:rgba(255,255,255,.55);text-align:center;line-height:1.5;opacity:0}
#tag{left:80px;top:250px;background:${theme.acc};color:#fff;font-weight:900;font-size:42px;padding:10px 38px;border-radius:60px;display:inline-flex;align-items:center;gap:14px}
#tag span{display:inline-flex;gap:10px;direction:ltr}
.cd{left:90px;right:90px;background:#fff;color:${theme.bg};border-radius:34px;padding:22px 34px;display:flex;align-items:center;gap:22px;box-shadow:0 16px 44px #0006;font-weight:800;font-size:46px;line-height:1.3;white-space:nowrap;overflow:hidden;opacity:0}
.cd .ic{flex:0 0 40px}
.cd .tx{flex:1;min-width:0}
.pill{left:0;right:0;display:flex;justify-content:center;opacity:0}
.pill span{background:${theme.acc};color:#fff;font-weight:900;font-size:76px;padding:14px 50px;border-radius:28px;box-shadow:0 14px 38px rgba(40,132,255,.45);white-space:nowrap}
#cap{left:80px;right:80px;bottom:520px;background:rgba(31,36,73,.96);border:3px solid rgba(255,255,255,.14);border-radius:38px;padding:30px 40px;font-weight:800;font-size:56px;line-height:1.45;text-align:center;box-shadow:0 20px 48px rgba(0,0,0,.35);opacity:0}
#bar{left:60px;right:60px;top:1432px;height:7px;border-radius:4px;background:rgba(255,255,255,.18)}
#bar div{height:100%;background:${theme.acc};border-radius:4px;width:0}
#end{inset:0;background:${theme.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:50px;opacity:0}
#end img{width:620px}#end h1{font-weight:900;font-size:96px}#end p{font-weight:700;font-size:46px;color:${theme.mut}}
#smp{top:36px;right:50px;background:#C0392B;color:#fff;font-weight:700;font-size:30px;padding:6px 24px;border-radius:12px}
</style></head><body>
<div id=bg class=abs></div>
<div id=ph class=abs>لقطتك هنا<br>(فيديو المتحدث)</div>
<div id=tag class=abs>أسئلة من التعليقات<span>${ICONS}</span></div>
${CARDS.map((c,i)=>`<div class="cd abs" id=c${i}><div class=ic>${IC[c[0]]}</div><div class=tx>${c[1]}</div></div>`).join('')}
${['التاريخ','عدد الأشخاص','نوع الغرفة','الفندق','نوع الإطلالة'].map((t,i)=>`<div class="pill abs" id=p${i} style="top:${400+i*125}px"><span>${t}</span></div>`).join('')}
<div id=cap class=abs></div>
<div id=bar class=abs><div></div></div>
<div id=end class=abs><img src="${logoV}"><h1>عندك سؤال؟</h1><p>اكتبه في التعليقات</p></div>
${SAMPLE?'<div id=smp class=abs>تجربة</div>':''}
<script>
const E=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
const $=id=>document.getElementById(id);
const N=${CARDS.length}, STEP=0.3, T0=0.5, FLOOD_END=5.0;
const caps=[[5.2,7.2,'ليش ما نكتب السعر في الفيديو؟'],[7.2,11,'لأنه يتغير حسب خمسة أشياء'],[11,14,'ولو كتبنا رقماً عاماً ممكن يضلل'],[14,15.6,'أرسل لنا تاريخك وعدد الأشخاص'],[15.6,17,'ونعطيك السعر الدقيق']];
const pillT=[7.6,8.3,9.0,9.7,10.4];
function fit(){for(let i=0;i<N;i++){const tx=document.querySelector('#c'+i+' .tx');let fs=46;tx.style.fontSize=fs+'px';while(tx.scrollWidth>tx.clientWidth+1&&fs>26){fs-=2;tx.style.fontSize=fs+'px'}}}
function render(t){
  // سيل البطاقات: كل بطاقة تدخل بفارق STEP وتتراكم متداخلة
  for(let i=0;i<N;i++){
    const s=T0+i*STEP, el=$('c'+i);
    const k=E((t-s)/0.28), out=E((t-FLOOD_END)/0.4);
    const y=330+i*112, dx=(i%2?1:-1)*(18+(i*7)%22), rot=(i%2?1:-1)*(1.2+(i%3)*0.5);
    const fromX=(i%2?1:-1)*-260;
    const faded = i<N-4 ? 0.75 : 1;
    el.style.opacity=Math.min(k*faded,1-out);
    el.style.top=y+'px';
    el.style.transform='translateX('+(fromX*(1-k)+dx)+'px) rotate('+rot*k+'deg) scale('+(0.96+0.04*k)+')';
    el.style.zIndex=10+i;
  }
  $('tag').style.opacity = t<FLOOD_END+0.3 ? 1 : 1-E((t-FLOOD_END-0.3)/0.3);
  $('ph').style.opacity = t<FLOOD_END?0:(t<17?E((t-FLOOD_END)/0.4):1-E((t-17)/0.3));
  for(let i=0;i<5;i++){const el=$('p'+i);const p=(t-pillT[i])/0.16;const o=t>=pillT[i]?Math.min(E(p*1.6),t<17?1:1-E((t-17)/0.3)):0;
    el.style.opacity=o;el.style.transform='scale('+(0.8+0.2*E(p))+')';}
  let c=caps.find(x=>t>=x[0]&&t<x[1]);const cap=$('cap');
  if(c){cap.textContent=c[2];const a=Math.min(E((t-c[0])/0.2),E((c[1]-t)/0.15));cap.style.opacity=a;cap.style.transform='translateY('+((1-a)*24)+'px)'}else cap.style.opacity=0;
  $('bar').firstElementChild.style.width=(Math.min(1,t/17)*100)+'%';
  $('bar').style.opacity=t<17.3?1:0;
  $('end').style.opacity=t<17?0:E((t-17)/0.5);
}
</script></body></html>`;
(async()=>{
  const frames=path.join(__dirname,'_frames');fs.rmSync(frames,{recursive:true,force:true});fs.mkdirSync(frames);
  const br=await chromium.launch({executablePath:chrome});const pg=await br.newPage({viewport:{width:W,height:H}});
  await pg.setContent(html);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(300);await pg.evaluate(()=>fit());
  for(let i=0;i<FPS*DUR;i++){await pg.evaluate(t=>render(t),i/FPS);await pg.screenshot({path:path.join(frames,String(i).padStart(5,'0')+'.jpg'),type:'jpeg',quality:90});}
  await br.close();
  const wav=path.join(__dirname,'_sfx.wav');cp.execFileSync(process.platform==='win32'?'python':'python3',[path.join(__dirname,'sfx.py'),wav],{stdio:'inherit'});
  cp.execFileSync('ffmpeg',['-y','-v','error','-framerate',String(FPS),'-i',path.join(frames,'%05d.jpg'),'-i',wav,'-c:v','libx264','-pix_fmt','yuv420p','-crf','21','-c:a','aac','-b:a','160k','-shortest',out],{stdio:'inherit'});
  fs.rmSync(frames,{recursive:true,force:true});console.log('تم:',out);
})();
