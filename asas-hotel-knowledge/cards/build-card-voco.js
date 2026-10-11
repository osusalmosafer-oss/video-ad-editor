// تشغيل: NODE_PATH=... node build-card-voco.js [مسار صورة الفندق]
const {chromium}=require('playwright-core');const fs=require('fs'),path=require('path');
const R='/home/user/video-ad-editor/asas-agency-manager/brand-kit/';
const photo=process.argv[2];
const b64=f=>fs.readFileSync(f).toString('base64');
const font=w=>`@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64(R+'fonts/Cairo-'+w+'.ttf')})}`;
const qr=b64(path.join(__dirname,'qr-voco.png'));
const logo=b64(R+'logos/logo-horizontal-white.png');
const two=['voco-room.jpg','voco-bus.jpg'].map(f=>`<img src="data:image/jpeg;base64,${b64(path.join(__dirname,f))}">`).join('');
const ph=photo?`<img class=ph style="object-position:50% 62%" src="data:image/jpeg;base64,${b64(photo)}">`:`<div class=ph2>صورة الفندق تُضاف هنا</div>`;
const row=(t,v)=>`<div class=r><b>${t}</b><span>${v}</span></div>`;
const html=`<html dir=rtl><meta charset=utf-8><style>${font(500)}${font(700)}${font(900)}
body{margin:0;padding-bottom:48px;width:1080px;background:#1F2449;font-family:C;color:#fff}
.top{padding:36px 48px 0;display:flex;justify-content:space-between;align-items:center}
.top img{height:54px}.tag{background:#2884FF;border-radius:30px;padding:8px 22px;font-weight:700;font-size:26px}
h1{margin:22px 48px 4px;font-size:68px;font-weight:900}
.sub{margin:0 48px 22px;color:#A9B1D6;font-size:28px}
.ph,.ph2{margin:0 48px;width:984px;height:380px;border-radius:26px;object-fit:cover;display:block}
.ph2{background:#2a3160;border:3px dashed #5a67a8;display:flex;align-items:center;justify-content:center;color:#A9B1D6;font-size:32px}
.box{margin:22px 48px 0;background:#272d5c;border-radius:26px;padding:10px 30px}
.r{display:flex;gap:18px;padding:15px 0;border-bottom:1px solid #3a4180;font-size:30px;line-height:1.5}
.r:last-child{border:0}.r b{color:#59a2ff;min-width:190px;font-weight:700}.r span{font-weight:500}
.map{margin:22px 48px 0;display:flex;gap:26px;align-items:center;background:#272d5c;border-radius:26px;padding:22px 30px}
.map img{width:190px;height:190px;border-radius:14px;background:#fff;padding:8px}
.map div{font-size:30px;line-height:1.6}.map small{color:#A9B1D6;font-size:24px;display:block}
.note{margin:22px 48px 40px;color:#ffd27a;font-size:25px;line-height:1.7}
.two{margin:16px 48px 0;display:flex;gap:16px}.two img{width:484px;height:300px;object-fit:cover;border-radius:22px}</style><body>
<div class=top><img src="data:image/png;base64,${logo}"><div class=tag>بيانات مُتحقق منها · 11 أكتوبر 2026</div></div>
<h1>فوكو مكة</h1><div class=sub>المسفلة، شارع إبراهيم الخليل · 4 نجوم</div>
${ph}
<div class=two>${two}</div>
<div class=box>
${row('المسافة للحرم','1.3 كم')}
${row('الأبراج','9 أبراج، كل برج ينزل مباشرة إلى المطعم')}
${row('المصليات','في كل برج مصلى مستقل للنساء ومصلى للرجال')}
${row('المجمع التجاري','في الأسفل')}
${row('الغرف','ثنائية بسرير كينغ. وبأسرّة منفصلة: ثنائية، ثلاثية، رباعية. نحو 80% من الغرف رباعية')}
${row('الجناح العائلي','غرفتان بباب واحد، 7 أسرّة، بدون صالة، بدورتي مياه')}
${row('المواصلات','مجانية من وإلى الحرم على مدار الساعة. الباصات توقف في مواقف كدي، ومنها باصات ترددية كثيرة للحرم تنزل خلف برج الساعة')}
${row('المواقف','مدفوعة، 60 ريالاً لليوم، وتختلف في المواسم. تُدفع في مواقف الفندق')}
</div>
<div class=map><img src="data:image/png;base64,${qr}"><div>الموقع على الخرائط<small>امسح الرمز بالجوال لفتح الموقع</small></div></div>
</body></html>`;
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await br.newPage({viewport:{width:1080,height:1000}});await p.setContent(html);await p.waitForTimeout(400);
await p.screenshot({path:path.join(__dirname,'card-voco.png'),fullPage:true});await br.close();})();
