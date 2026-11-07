slides = [
 dict(kind="cover", label="حجز مكة", h="٥ أسئلة <u>اسألها</u> قبل الدفع", sub="للوكالة اللي تحجز معها، تحميك من المفاجآت"),
 dict(kind="card", label="سؤال ١", h="السعر <u>شامل</u>؟", body="اسأل: هل السعر شامل الضريبة والرسوم؟ وش اللي ما يدخل فيه؟"),
 dict(kind="card", label="سؤال ٢", h="أي <u>فندق</u> بالضبط؟", body="اطلب اسم الفندق ونوع الغرفة بالتحديد، مو وصف عام. عشان تقارن العروض بنفس الأساس."),
 dict(kind="card", label="سؤال ٣", h="كم <u>يبعد</u>؟", body="اسأل كم دقيقة مشي للحرم وأقرب باب، وهل فيه نقل. الكلمة «قريب» لحالها ما تكفي."),
 dict(kind="card", label="سؤال ٤", h="كم <u>الليالي</u> بالضبط؟", body="تأكد من تاريخ الدخول والخروج وعدد الليالي، عشان ما تتفاجأ عند الوصول."),
 dict(kind="card", label="سؤال ٥", h="متى <u>التأكيد</u>؟", body="اسأل متى يوصلك تأكيد الحجز، وبأي طريقة، وهل تقدر تتأكد منه مع الفندق نفسه."),
 dict(kind="last", label="الخلاصة", h="احفظ الأسئلة <u>قبل</u> الدفع", body="أرسلها لمن يجهز لرحلة مكة. وإذا تبي نجاوبك بكل وضوح، راسلنا."),
]
N=len(slides)
out=[]
for i,s in enumerate(slides,1):
    cue = '' if i==N else '<div class="cue">اسحب ←</div>'
    chips = ''.join(f'<div class="chip"><b>{a}</b><span>{b}</span></div>' for a,b in s.get("chips",[]))
    vis = '<div class="glow"></div><div class="rings"><i></i><i></i><i></i></div>' if s["kind"]=="cover" else ''
    sub = f'<p class="sub">{s["sub"]}</p>' if s["kind"]=="cover" else f'<p class="body">{s.get("body","")}</p>'
    num = ''
    out.append(f'''<section class="slide {s["kind"]} {"chips-s" if s["kind"]=="chips" else ""}" id="s{i}">{vis}{num}
<div class="counter">{i} / {N}</div><div class="pill">{s["label"] if s["kind"]!="cover" else "حجز مكة"}</div>
<div class="main"><h1>{s["h"]}</h1>{sub if s["kind"]!="chips" else '<div class="chips">'+chips+'</div>'}</div>
<div class="brand">@osusalmosafer</div>{cue}</section>''')
html=f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{{font-family:Cairo;src:url(fonts/Cairo.ttf);font-weight:200 1000}}
:root{{--bg:#1F2449;--fg:#FFFFFF;--ac:#FFC24B;--mu:#A9B1D6}}
*{{box-sizing:border-box;margin:0}}body{{background:#222;font-family:Cairo}}
.slide{{width:1080px;height:1350px;background:var(--bg);color:var(--fg);position:relative;overflow:hidden;margin-bottom:20px}}
.counter,.pill,.brand,.cue{{position:absolute;font-weight:700}}
.counter{{top:80px;right:80px;font-size:34px;color:var(--mu);direction:ltr}}
.pill{{top:70px;left:80px;font-size:34px;border:3px solid var(--ac);color:var(--ac);padding:6px 30px;border-radius:50px}}
.brand{{bottom:80px;right:80px;font-size:34px;color:var(--mu);direction:ltr}}
.cue{{bottom:80px;left:80px;font-size:40px;color:var(--ac)}}
.main{{position:absolute;right:80px;left:80px;top:420px;z-index:2}}
h1{{font-weight:900;font-size:112px;line-height:1.35}}
.cover h1{{font-size:128px}}
u{{display:inline-block;white-space:nowrap;line-height:1.25;color:var(--ac);text-decoration:none;background:linear-gradient(var(--ac),var(--ac)) bottom 6px right/100% 10px no-repeat;padding-bottom:14px}}
.body,.sub{{font-weight:700;font-size:46px;line-height:1.7;margin-top:50px;color:#DCE0F2}}
.big{{position:absolute;left:60px;top:200px;font-size:420px;font-weight:900;color:var(--ac);opacity:.12;line-height:1;direction:ltr}}
.card .main{{top:520px}}
.glow{{position:absolute;left:-200px;bottom:-200px;width:900px;height:900px;background:radial-gradient(circle,rgba(255,194,75,.16),transparent 65%)}}
.rings{{position:absolute;left:-340px;bottom:-340px;width:760px;height:760px}}
.rings i{{position:absolute;border:6px solid var(--ac);border-radius:50%;inset:0}}
.rings i:nth-child(2){{inset:120px;opacity:.6}}.rings i:nth-child(3){{inset:240px;opacity:.35}}
.chips{{margin-top:30px;display:flex;flex-direction:column;gap:28px}}.chip{{border:3px solid #3A4275;border-radius:28px;padding:30px 40px}}.chip b{{display:block;font-size:56px;font-weight:900;color:var(--ac)}}.chip span{{font-size:40px;font-weight:700;color:#DCE0F2;line-height:1.5}}.cover .main{{top:240px}}.chips-s .main{{top:230px}}.last .main{{top:420px}}
</style></head><body>{"".join(out)}</body></html>'''
open("carousel6.html","w").write(html)
