const {chromium}=require('playwright-core');const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..');const b64=f=>fs.readFileSync(f).toString('base64');
const font=w=>`@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64(path.join(R,'fonts','Cairo-'+w+'.ttf'))})}`;
const html=`<html><head><meta charset=utf-8><style>${font(700)}${font(900)}
body{margin:0;width:1080px;height:1920px;position:relative;overflow:hidden;background:#1F2449;font-family:C;direction:rtl;color:#fff}
.ph{position:absolute;inset:0;background:url(data:image/jpeg;base64,${b64(path.join(R,'carousel/bg/haram-wide.jpg'))}) center/cover;filter:saturate(.85) brightness(.9)}
.ov{position:absolute;inset:0;background:linear-gradient(rgba(22,26,56,.88),rgba(22,26,56,.35) 45%,rgba(22,26,56,.85))}
.t{position:absolute;left:70px;right:70px;top:560px;text-align:center}
h1{margin:0;font-size:150px;line-height:1.35;font-weight:900;text-shadow:0 6px 30px rgba(0,0,0,.55)}
mark{background:#2884FF;color:#fff;border-radius:34px;padding:0 30px}
.chips{margin-top:60px;display:flex;gap:22px;justify-content:center}
.chips span{background:rgba(255,255,255,.12);border:3px solid rgba(255,255,255,.4);border-radius:60px;padding:10px 40px;font-weight:700;font-size:58px}
.tag{position:absolute;top:340px;left:0;right:0;text-align:center}.tag span{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.3);border-radius:60px;padding:8px 34px;font-weight:700;font-size:40px}
</style></head><body><div class=ph></div><div class=ov></div>
<div class=tag><span>أبواب الحرم</span></div>
<div class=t><h1>أقرب <mark>باب</mark><br>لفندقك؟</h1><div class=chips><span>جبل عمر</span><span>أجياد</span><span>الغزة</span></div></div></body></html>`;
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await br.newPage({viewport:{width:1080,height:1920}});await p.setContent(html);await p.waitForTimeout(300);
fs.mkdirSync('/home/user/video-ad-editor/asas-agency-manager/content/covers',{recursive:true});
await p.screenshot({path:'/home/user/video-ad-editor/asas-agency-manager/content/covers/cover-doors.png'});await br.close();})();
