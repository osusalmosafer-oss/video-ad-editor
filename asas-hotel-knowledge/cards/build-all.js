// كل فندق جديد: أضف سطراً في hotels-index.json (slug, txt, image أو null، photos اختياري)
// تشغيل: NODE_PATH=... node build-all.js   ثم: python3 make-pdf.py
// ينتج: card-<slug>.png لكل فندق بلا image، و hotels-all.pdf (كل الفنادق بترتيب الإضافة)
const {chromium}=require('playwright-core');const fs=require('fs'),path=require('path');
const R='/home/user/video-ad-editor/asas-agency-manager/brand-kit/';
const b64=f=>fs.readFileSync(f).toString('base64');
const font=w=>`@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64(R+'fonts/Cairo-'+w+'.ttf')})}`;
const logo=b64(R+'logos/logo-horizontal-white.png');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
function body(txt,photos){
  const lines=fs.readFileSync(path.join(__dirname,txt),'utf8').split('\n').map(l=>l.trim());
  let title=lines.shift(),tag='';
  if(title.startsWith('بيانات أولية')){tag=title;const k=lines.findIndex(l=>l.startsWith('فندق اليوم:'));title=lines.splice(k,1)[0].replace('فندق اليوم:','').trim();}
  const rows=[],notes=[];
  for(const l of lines){if(!l)continue;const i=l.indexOf(':');
    if(i>0&&i<28)rows.push(`<div class=r><b>${esc(l.slice(0,i))}</b><span>${esc(l.slice(i+1).trim())}</span></div>`);else notes.push(esc(l));}
  const ph=(photos||[]).map(f=>`<img class=p src="data:image/jpeg;base64,${b64(path.join(__dirname,f))}">`).join('');
  return `<div class=top><img src="data:image/png;base64,${logo}"></div><h1>${esc(title)}</h1>${tag?`<div class=tag>${esc(tag)}</div>`:''}${ph?`<div class=ps>${ph}</div>`:''}<div class=box>${rows.join('')}</div>${notes.length?`<div class=note>${notes.join('<br>')}</div>`:''}`;
}
const css=`${font(500)}${font(700)}${font(900)}body{margin:0;padding-bottom:48px;width:1080px;background:#1F2449;font-family:C;color:#fff}
.top{padding:36px 48px 0}.top img{height:54px}h1{margin:22px 48px 18px;font-size:50px;font-weight:900;line-height:1.35}
.tag{margin:-6px 48px 18px;color:#ffd27a;font-size:24px;line-height:1.6}.ps{margin:0 48px 16px;display:flex;gap:16px}.p{flex:1;min-width:0;height:300px;object-fit:cover;border-radius:22px}
.box{margin:0 48px;background:#272d5c;border-radius:26px;padding:10px 30px}
.r{display:flex;gap:18px;padding:15px 0;border-bottom:1px solid #3a4180;font-size:29px;line-height:1.55}.r:last-child{border:0}
.r b{color:#59a2ff;min-width:200px;font-weight:700}.r span{font-weight:500}
.note{margin:22px 48px 0;color:#A9B1D6;font-size:26px;line-height:1.7}`;
(async()=>{const idx=JSON.parse(fs.readFileSync(path.join(__dirname,'hotels-index.json'),'utf8'));
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await br.newPage({viewport:{width:1080,height:900}});
for(const h of idx){if(h.image)continue;
  await p.setContent(`<html dir=rtl><meta charset=utf-8><style>${css}</style><body>${body(h.txt,h.photos)}</body></html>`);
  await p.waitForTimeout(300);await p.screenshot({path:path.join(__dirname,`card-${h.slug}.png`),fullPage:true});}
await br.close();})();
