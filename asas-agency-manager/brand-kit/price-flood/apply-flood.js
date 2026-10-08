/* يركّب «سيل أسئلة السعر» فوق أي فيديو: بطاقات تعليقات حقيقية تسقط من فوق وتضرب الشاشة بشكل عشوائي غير مرتب مع اهتزاز خفيف،
   ثم تنزل كلها وتكمل مقطعك. تعليقات فيها تاريخ أو يوم محذوفة مسبقاً (comments.json).
   الاستعمال:  node apply-flood.js فيديو.mp4 [--out خرج.mp4] [--start 0] [--dur 6.5] [--comments comments.json] [--max 120] [--seed 7]
   يحتاج: playwright-core و ffmpeg و كروم (أو إدج) و python (للصوت) */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const kit = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const src = args.find((a, i) => !a.startsWith('--') && !['--out','--start','--dur','--comments','--max','--seed','--chrome'].includes(args[i-1]));
if (!src) { console.error('استعمل: node apply-flood.js فيديو.mp4'); process.exit(1); }
const out = path.resolve(opt('--out', 'flood-out.mp4'));
const START = +opt('--start', 0), DUR = +opt('--dur', 6.5), MAX = +opt('--max', 120), SEED = +opt('--seed', 7), FPS = 30, W = 1080, H = 1920;
let comments = JSON.parse(fs.readFileSync(path.resolve(opt('--comments', path.join(__dirname, 'comments.json'))), 'utf8')).slice(0, MAX);
const chrome = [opt('--chrome',''), process.env.CHROME_PATH||'', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/opt/pw-browsers/chromium'].filter(Boolean).find(p=>fs.existsSync(p));
if(!chrome){console.error('ما لقيت كروم');process.exit(1);}
const b64=f=>fs.readFileSync(path.join(kit,f)).toString('base64');
const font=(w,f)=>`@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/'+f)})}`;
const theme=JSON.parse(fs.readFileSync(path.join(kit,'theme.json'),'utf8'));
const IC={
 facebook:'<svg width="42" height="42" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#1877F2"/><path d="M26.5 40V27h4.4l.7-5h-5.1v-3.2c0-1.5.5-2.5 2.6-2.5h2.6V11.8c-.5-.1-2-.2-3.8-.2-3.8 0-6.3 2.3-6.3 6.5V22H17v5h4.6v13z" fill="#fff"/></svg>',
 instagram:'<svg width="42" height="42" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".4" stop-color="#FA7E1E"/><stop offset=".7" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#g)"/><rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="32" cy="16" r="2" fill="#fff"/></svg>',
 tiktok:'<svg width="42" height="42" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#111"/><path d="M26 10v18a5 5 0 1 1-5-5M26 10c1 4 4 6 8 6" fill="none" stroke="#fff" stroke-width="4"/></svg>'};
// عشوائية ثابتة (نفس البذرة = نفس النتيجة)
let s = SEED; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
// نخلط الترتيب حتى لا تتجمع منصة واحدة
for (let i = comments.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [comments[i], comments[j]] = [comments[j], comments[i]]; }
const N = comments.length, STEP = (DUR - 0.3) / N, FALL = 0.16;
const cards = comments.map((c, i) => ({
  t: i * STEP, x: (rnd() - 0.5) * 220, y: 260 + rnd() * 1330, rot: (rnd() - 0.5) * 26, sc: 0.82 + rnd() * 0.4,
  w: 560 + Math.floor(rnd() * 380), shake: i % 4 === 0 ? 1 : 0, p: c.platform, text: c.text }));
const html = `<html><head><meta charset=utf-8><style>
${font(800,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:C,sans-serif;direction:rtl;position:relative}
#stage{position:absolute;inset:0}
#dim{position:absolute;inset:0;background:rgba(31,36,73,.55);opacity:0}
.cd{position:absolute;left:50%;top:0;background:#fff;color:${theme.bg};border-radius:30px;padding:18px 28px;display:flex;align-items:center;gap:18px;box-shadow:0 14px 40px #0007;font-weight:800;font-size:44px;line-height:1.25;white-space:nowrap;overflow:hidden;opacity:0}
.cd .tx{flex:1;min-width:0;overflow:hidden}
.cd svg{flex:0 0 42px}
</style></head><body><div id=stage><div id=dim></div>
${cards.map((c,i)=>`<div class=cd id=c${i} style="width:${c.w}px"><span style="display:contents">${IC[c.p]}</span><div class=tx>${c.text.replace(/</g,'&lt;')}</div></div>`).join('')}
</div><script>
const C=${JSON.stringify(cards)}, N=${N}, STEP=${STEP}, FALL=${FALL}, DUR=${DUR};
const E=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3), $=id=>document.getElementById(id);
function fit(){for(let i=0;i<N;i++){const tx=document.querySelector('#c'+i+' .tx');let fs=44;tx.style.fontSize=fs+'px';while(tx.scrollWidth>tx.clientWidth+1&&fs>22){fs-=2;tx.style.fontSize=fs+'px'}}}
function render(t){
  // اهتزاز الشاشة عند الضربات القوية (كل رابع بطاقة)
  let sx=0,sy=0;
  C.forEach((c,i)=>{ if(!c.shake) return; const d=t-(c.t+FALL); if(d>=0&&d<0.14){const a=14*(1-d/0.14); sx+=Math.sin(d*90+i)*a; sy+=Math.cos(d*110+i*2)*a;} });
  $('stage').style.transform='translate('+sx+'px,'+sy+'px)';
  const outP=E((t-(DUR+0.1))/0.35);
  $('dim').style.opacity=Math.min(E(t/0.25),1-outP)*0.9;
  C.forEach((c,i)=>{
    const el=$('c'+i), d=t-c.t;
    if(d<0){el.style.opacity=0;return;}
    let y,sc=c.sc,op=1;
    if(d<FALL){const k=d/FALL; y=-320+(c.y+320)*k*k;}            // سقوط متسارع
    else{y=c.y; const b=d-FALL; sc=c.sc*(1+0.12*Math.exp(-b*22)*Math.cos(b*38));} // ارتطام وارتداد
    if(outP>0){y+=outP*1900*(0.6+(i%5)*0.15); op=1-outP*0.6;}     // الخروج: تسقط كلها للأسفل
    el.style.opacity=op;
    el.style.transform='translate(calc(-50% + '+c.x+'px),'+y+'px) rotate('+c.rot+'deg) scale('+sc+')';
    el.style.zIndex=10+i;
  });
}
</script></body></html>`;
(async () => {
  const frames = path.join(__dirname, '_fl'); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  const br = await chromium.launch({ executablePath: chrome });
  const pg = await br.newPage({ viewport: { width: W, height: H } });
  await pg.setContent(html); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300); await pg.evaluate(() => fit());
  const total = Math.ceil((DUR + 0.6) * FPS);
  for (let i = 0; i < total; i++) { await pg.evaluate(t => render(t), i / FPS); await pg.screenshot({ path: path.join(frames, String(i).padStart(5,'0') + '.png'), omitBackground: true }); if (i % 60 === 0) console.log('frame', i, '/', total); }
  await br.close();
  // مؤثر صاعد ناعم واحد عند البداية (سياسة المالك: قليلة وهادئة، ذروة -18 dBFS)
  const wav = path.join(__dirname, '_riser.wav');
  cp.execFileSync(process.platform==='win32'?'python':'python3', ['-c', `
import wave,numpy as np
SR=44100;dur=1.4;n=int(SR*dur);t=np.arange(n)/SR
f=300+(1800-300)*(t/dur)**2;ph=2*np.pi*np.cumsum(f)/SR
x=(np.sin(ph)*0.55+np.random.default_rng(5).standard_normal(n)*0.1)*(t/dur)**1.3
x*=np.minimum(1,(dur-t)/0.08);x*=10**(-18/20)/np.max(np.abs(x))
w=wave.open(r'${wav.replace(/\\/g,'\\\\')}','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes());w.close()`]);
  const ms = Math.round(Math.max(0, START - 0.2) * 1000);
  const hasAudio = cp.spawnSync('ffprobe', ['-v','error','-select_streams','a','-show_entries','stream=index','-of','csv=p=0', src]).stdout.toString().trim() !== '';
  const fc = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2[b];[1:v]format=rgba,setpts=PTS+${START}/TB[o];[b][o]overlay=eof_action=pass:format=auto[v]` +
    (hasAudio ? `;[2:a]adelay=${ms}|${ms}[r];[0:a][r]amix=inputs=2:duration=first:normalize=0[a]` : `;[2:a]adelay=${ms}|${ms}[a]`);
  cp.execFileSync('ffmpeg', ['-y','-v','error','-i', src, '-framerate', String(FPS), '-i', path.join(frames,'%05d.png'), '-i', wav,
    '-filter_complex', fc, '-map','[v]','-map','[a]','-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-c:a','aac','-b:a','160k','-shortest', out], { stdio: 'inherit' });
  fs.rmSync(frames, { recursive: true, force: true }); console.log('تم:', out, '| بطاقات:', N);
})();
