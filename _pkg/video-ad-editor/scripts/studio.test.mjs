// فحص تشغيل شاشة التعديل: القفزة تعيد بذرة الساعة، وما فيه حلقتان تتصارعان.
//   node scripts/studio.test.mjs   (من مجلد السكل)
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const html=fs.readFileSync(process.argv[2]||path.join(HERE,'studio.html'),'utf8');
const parts=html.split('<script>'); const body=parts[parts.length-1].split('</script>')[0];

// ── بيئة وهمية ────────────────────────────────────────────────
let NOW=0; const drawn=[];
const el=(id)=>({id,value:'0',max:'1000',textContent:'',dataset:{},classList:{toggle(){}},
                 appendChild(){}, children:[], onclick:null, oninput:null,
                 innerHTML:'', className:'', complete:true});
const els={}; for(const id of ['tl','tm','list','pl','bk','fw','LOGO','VF']) els[id]=el(id);
els.tl.max='1272'; els.list.children=[];
const document={ getElementById:id=>els[id], createElement:()=>el('x'),
  fonts:{ready:Promise.resolve()}, head:{appendChild(){}} };
const window={ init(){}, async setFrame(p){ await null; }, draw(t){ drawn.push(+t.toFixed(2)); } };
const performance={ now:()=>NOW };
const fetch=async(u)=>({json:async()=>u.includes('caps')?{cards:[],total:37.6}:{}});
const setTimeout_=(fn)=>queueMicrotask(fn);

const run=new Function('document','window','performance','fetch','setTimeout','Promise','Math','console',
  body+'\n; return {get playing(){return playing},get cur(){return cur}, pl:document.getElementById("pl"), tl:document.getElementById("tl"), seek:(f)=>seek(f)};');
const S=run(document,window,performance,fetch,setTimeout_,Promise,Math,console);

const tick=async(ms)=>{ NOW+=ms; for(let i=0;i<40;i++) await new Promise(r=>queueMicrotask(r)); };

let fail=0;
const check=(name,cond,extra='')=>{ console.log((cond?'✓ ':'✗ ')+name+(extra?'   '+extra:'')); if(!cond) fail++; };

await tick(0);
// 1) شغّل من 0، ومرّر ثانيتين
S.pl.onclick.call(S.pl);
await tick(2000);
const afterPlay=S.cur;
check('التشغيل يتقدّم من مكان البداية (فريم 138)', afterPlay>=190 && afterPlay<=206, 'frame='+afterPlay);

// 2) أوقف، ثم قدّم إلى الثانية 20 (frame 600)
S.pl.onclick.call(S.pl);
check('الإيقاف يشتغل', S.playing===false);
S.tl.value='600'; S.tl.oninput(); await tick(0);
check('القفزة تضبط المؤشر', S.cur===600, 'cur='+S.cur);

// 3) شغّل مرة ثانية — لازم يكمّل من 600 لا من الصفر
drawn.length=0;
S.pl.onclick.call(S.pl);
await tick(1000);
check('التشغيل بعد القفزة يكمّل من مكانه', S.cur>=625 && S.cur<=635, 'cur='+S.cur);
check('ما رجع لأول المقطع', Math.min(...drawn)>=19.9, 'أقل ثانية مرسومة='+Math.min(...drawn).toFixed(2));

// 4) قفزة أثناء التشغيل — لازم يكمّل من الجديد بلا ما يرجّعه المُشغّل
S.tl.value='900'; S.tl.oninput(); await tick(0);
await tick(500);
check('القفزة أثناء التشغيل تصمد', S.cur>=910 && S.cur<=920, 'cur='+S.cur);

// 5) ضغطتا تشغيل متتاليتان ما تخلّيان حلقتين تتصارعان
S.pl.onclick.call(S.pl); S.pl.onclick.call(S.pl);
const before=S.cur; await tick(1000);
const d=S.cur-before;
check('ما فيه حلقتان متوازيتان', d>=25 && d<=35, 'تقدّم='+d+' فريم بثانية');

// 6) من النهاية، التشغيل يبدأ من جديد
S.pl.onclick.call(S.pl);                       // إيقاف
S.tl.value=S.tl.max; S.tl.oninput(); await tick(0);
S.pl.onclick.call(S.pl); await tick(300);
check('من النهاية يبدأ من الصفر', S.cur<20, 'cur='+S.cur);

console.log(fail? `\n${fail} فحص فشل`:'\nكل الفحوص نجحت');
process.exit(fail?1:0);
