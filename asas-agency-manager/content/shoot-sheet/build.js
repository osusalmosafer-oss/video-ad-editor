const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const kit = path.join(__dirname, '../../brand-kit');
const b64 = f => fs.readFileSync(path.join(kit, f)).toString('base64');
const font = (w, f) => `@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64('fonts/' + f)})}`;
const logo = 'data:image/png;base64,' + b64('logos/logo-horizontal-on-dark.png');
const chk = t => `<li><i></i>${t}</li>`;
const html = `<html><head><meta charset=utf-8><style>
${font(500,'Cairo-500.ttf')}${font(700,'Cairo-700.ttf')}${font(900,'Cairo-900.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
@page{size:148mm 210mm;margin:0}
body{font-family:C,sans-serif;direction:rtl;background:#1F2449;color:#fff}
.pg{width:148mm;height:210mm;padding:8mm 9mm 8mm;page-break-after:always;position:relative;overflow:hidden}
.hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:2.5mm}
.hd img{height:8mm}.hd b{font-size:12pt;color:#A9B1D6}
h1{font-size:17pt;font-weight:900;margin-bottom:2mm}
h1 mark{background:#2884FF;color:#fff;border-radius:3mm;padding:0 3mm}
h2{font-size:11.5pt;font-weight:900;color:#2884FF;margin:2.4mm 0 1mm}
.box{background:rgba(255,255,255,.07);border:.3mm solid rgba(255,255,255,.18);border-radius:3mm;padding:2.6mm 3.4mm;margin-bottom:2.2mm}
.row{display:flex;justify-content:space-between;gap:3mm;font-size:9.3pt;line-height:1.45;border-bottom:.2mm solid rgba(255,255,255,.1);padding:.7mm 0}
.row:last-child{border:0}.row span:first-child{color:#A9B1D6;font-weight:700;white-space:nowrap}.row span:last-child{font-weight:900;text-align:left}
ul{list-style:none}li{font-size:9.4pt;line-height:1.45;font-weight:500;display:flex;gap:2.4mm;align-items:flex-start;padding:.5mm 0}
li i{flex:none;width:3.6mm;height:3.6mm;border:.35mm solid #2884FF;border-radius:.9mm;margin-top:1.6mm}
.nt{font-size:9pt;color:#A9B1D6;line-height:1.5;margin-top:1.5mm}
.ft{position:absolute;bottom:5mm;left:9mm;right:9mm;font-size:8pt;color:#A9B1D6;display:flex;justify-content:space-between}
table{width:100%;border-collapse:collapse;font-size:9pt}td,th{border:.25mm solid rgba(255,255,255,.25);padding:1.6mm 1.8mm;text-align:right}th{background:rgba(40,132,255,.25);font-weight:900}
td.e{height:7.2mm}
</style></head><body>

<div class=pg><div class=hd><img src="${logo}"><b>ورقة التصوير 1 من 4</b></div>
<h1>إعدادات <mark>الكاميرا</mark> جالكسي S26 الترا</h1>
<div class=box><div class=row><span>الوضع</span><span>Pro Video (فيديو احترافي)</span></div>
<div class=row><span>الدقة والإطارات</span><span>4K × 30 (60 إذا الحركة كثيرة)</span></div>
<div class=row><span>Auto FPS</span><span>مطفأ</span></div>
<div class=row><span>HDR10+</span><span>مطفأ (إلا إذا بتعدّل اللون)</span></div>
<div class=row><span>التثبيت</span><span>Super Steady إذا متاح، وإلا عادي</span></div>
<div class=row><span>سرعة الغالق</span><span>1/60 مع 30 • 1/120 مع 60</span></div>
<div class=row><span>ISO</span><span>أقل ما يمكن (ما يزيد عن 400 نادراً)</span></div>
<div class=row><span>موازنة البيض</span><span>يدوي 4500–5500K، ثابتة في كل الغرفة</span></div>
<div class=row><span>التعريض (EV)</span><span>−0.3 إلى −0.7 عند النافذة</span></div>
<div class=row><span>قفل AE/AF</span><span>اضغط مطولاً على الشاشة قبل كل لقطة</span></div></div>
<h2>العدسات</h2>
<div class=box><div class=row><span>1x الرئيسية</span><span>الأساس لكل شيء</span></div>
<div class=row><span>0.5x الواسعة</span><span>الغرف الصغيرة والحمّام</span></div>
<div class=row><span>3x تيليفوتو</span><span>الإطلالة من بعيد وتفاصيل</span></div>
<div class=row><span>الزوم الرقمي</span><span>لا</span></div></div>
<h2>قبل أي لقطة</h2>
<ul>${chk('امسح العدسات، وإصبعك بعيد عن الميكروفونات')}${chk('وضع عدم الإزعاج أو الطيران')}${chk('البطارية فوق 50% ومساحة كافية (4K يأكل مساحة)')}${chk('الجوال بيدين قرب الصدر، أو جيمبل')}${chk('لا 200 ميجا في الفيديو')}</ul>
<p class=nt>أسماء الخيارات قد تختلف قليلاً في جوالك. جرّب لقطة قصيرة وراجع اللون قبل ما تصوّر الفندق كله.</p>
<div class=ft><span>أسس المسافر</span><span>@osusalmosafer</span></div></div>

<div class=pg><div class=hd><img src="${logo}"><b>ورقة التصوير 2 من 4</b></div>
<h1>لقطات <mark>الفندق</mark> بالترتيب</h1>
<h2>قبل الدخول</h2>
<ul>${chk('إذن من إدارة الفندق للتصوير الداخلي')}${chk('لا ضيوف ولا وجوه في اللقطات')}${chk('معك قائمة الفندق وأنواع غرفه (ثنائية، ثلاثية، رباعية، أجنحة)')}</ul>
<h2>اللقطات (لقطة 4 ثوانٍ على الأقل)</h2>
<ul>${chk('1) الواجهة من الساحات أو الطريق (واسعة)')}${chk('2) من الحرم للفندق: الباب المناسب، ثم الممشى')}${chk('3) مدخل الفندق واللوبي والاستقبال')}${chk('4) المصعد والممر ورقم الدور')}${chk('5) كل نوع غرفة (الورقة 3)')}${chk('6) المطاعم والإفطار')}${chk('7) المصلى')}${chk('8) المواقف أو مدخل السيارات')}${chk('9) مدخل المول (الدور/المكان)')}${chk('10) أقرب باب للحرم من الفندق، وبالمشي')}</ul>
<h2>الحركة</h2>
<ul>${chk('امشِ ببطء، حركة واحدة في اللقطة (تقدّم أو دوران)')}${chk('واسعة ثم متوسطة ثم تفصيل')}${chk('لا تهزّ ولا تقطع الحركة في نصفها')}${chk('اترك ثانية قبل وبعد كل لقطة للمونتاج')}</ul>
<h2>الصوت</h2>
<ul>${chk('صوت المكان فقط، بدون موسيقى')}${chk('التعليق الصوتي يُسجَّل بعد المونتاج')}</ul>
<div class=ft><span>أسس المسافر</span><span>@osusalmosafer</span></div></div>

<div class=pg><div class=hd><img src="${logo}"><b>ورقة التصوير 3 من 4</b></div>
<h1>كل <mark>نوع غرفة</mark> (20 إلى 40 ثانية)</h1>
<ul>${chk('1) باب الغرفة يُفتح ثم لقطة واسعة (0.5x)')}${chk('2) السرير أو الأسرّة: صوّر بحسب عدد الأشخاص لا نوع السرير')}${chk('3) الحمّام')}${chk('4) النافذة: قفل التعريض وخفّض −0.5')}${chk('5) الإطلالة بحقيقتها')}${chk('6) تفصيلتان مميزتان (طاولة، مكتب، مناظر)')}</ul>
<div class=box style="margin-top:3mm"><div class=row><span>ثنائية</span><span>صوّر</span></div><div class=row><span>ثلاثية</span><span>صوّر</span></div><div class=row><span>رباعية</span><span>صوّر</span></div><div class=row><span>جناح (باسمه)</span><span>غرفة النوم + الصالة + الحمّامان</span></div></div>
<h2>الإطلالة</h2>
<ul>${chk('صوّر ما تشوفه فعلاً، ولا تعلن إطلالة غير مؤكدة')}${chk('إطلالة الكعبة: تُكتب بعد تأكيد المالك')}${chk('إطلالة حرم جزئي: اذكر ما يظهر في اللقطة')}</ul>
<h2>التسمية</h2>
<div class=box><div class=row><span>الصيغة</span><span style="direction:ltr">hotel_room_view_01</span></div><div class=row><span>مثال</span><span style="direction:ltr">rotana_double_city_01</span></div></div>
<p class=nt>التسمية الثابتة تسهّل عليك قائمة التشغيل واختيار اللقطات في المونتاج.</p>
<div class=ft><span>أسس المسافر</span><span>@osusalmosafer</span></div></div>

<div class=pg><div class=hd><img src="${logo}"><b>ورقة التصوير 4 من 4</b></div>
<h1>سجلّ <mark>اللقطات</mark></h1>
<table><tr><th>الفندق</th><th>نوع الغرفة</th><th>الإطلالة</th><th>تمّ</th></tr>
${'<tr><td class=e></td><td class=e></td><td class=e></td><td class=e></td></tr>'.repeat(13)}</table>
<h2>يوتيوب بعد التصوير</h2>
<ul>${chk('شورتس لكل غرفة، وفيديو طويل 3 إلى 8 دقائق للفندق')}${chk('قائمة تشغيل لكل فندق، ورفع 1–2 يومياً')}${chk('رفع النسخة الأصلية بدون علامة منصة أخرى')}</ul>
<div class=ft><span>أسس المسافر</span><span>@osusalmosafer</span></div></div>
</body></html>`;
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await br.newPage();
  await pg.setContent(html); await pg.evaluate(() => document.fonts.ready);
  const out = path.join(__dirname, 'hotel-shoot-sheet.pdf');
  await pg.pdf({ path: out, width: '148mm', height: '210mm', printBackground: true });
  await br.close(); console.log(out);
})();
