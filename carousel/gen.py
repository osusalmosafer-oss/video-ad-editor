slides = [
 dict(kind="cover", label="إعلانات الفيديو", h="ليش الناس <u>تتخطى</u> إعلانك؟", sub="٥ أخطاء تقتل إعلانك في أول ٣ ثواني", vis="circles"),
 dict(kind="card", label="الخطأ ١", h="تبدأ <u>بالشعار</u>", body="الناس ما تهتم بشعارك. ابدأ بمشكلة العميل أو بنتيجة تبهره، والشعار يجي بالآخر."),
 dict(kind="card", label="الخطأ ٢", h="هوك <u>ضعيف</u>", body="أول ٣ ثواني تقرر كل شي. سؤال صادم أو رقم قوي أو لقطة غير متوقعة تمسك المشاهد."),
 dict(kind="card", label="الخطأ ٣", h="بدون <u>ترجمة</u>", body="أغلب الناس تشاهد والصوت مغلق. اكتب الكلام على الشاشة بخط كبير وواضح."),
 dict(kind="card", label="الخطأ ٤", h="رسالة <u>مشتتة</u>", body="فكرة وحدة بس في كل إعلان. كل ما زادت الرسائل قلّ اللي يوصل للمشاهد."),
 dict(kind="card", label="الخطأ ٥", h="ما فيه <u>دعوة</u> للتصرف", body="قل للمشاهد وش يسوي بعد: اطلب الحين، سجّل، أو راسلنا. لا تتركه يخمّن."),
 dict(kind="last", label="الخلاصة", h="احفظها قبل <u>إعلانك</u> الجاي", body="أرسلها لصاحبك اللي يصور إعلانات، أو اكتب «هوك» في التعليقات."),
]
N=len(slides)
out=[]
for i,s in enumerate(slides,1):
    cue = '' if i==N else '<div class="cue">اسحب ←</div>'
    vis = '<div class="glow"></div><div class="rings"><i></i><i></i><i></i></div>' if s["kind"]=="cover" else ''
    sub = f'<p class="sub">{s["sub"]}</p>' if s["kind"]=="cover" else f'<p class="body">{s["body"]}</p>'
    num = f'<div class="big">{i-1}</div>' if s["kind"]=="card" else ''
    out.append(f'''<section class="slide {s["kind"]}" id="s{i}">{vis}{num}
<div class="counter">{i} / {N}</div><div class="pill">{s["label"] if s["kind"]!="cover" else "إعلانات"}</div>
<div class="main"><h1>{s["h"]}</h1>{sub}</div>
<div class="brand">@yourbrand</div>{cue}</section>''')
html=f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{{font-family:Cairo;src:url(fonts/Cairo.ttf);font-weight:200 1000}}
:root{{--bg:#0B0B0F;--fg:#F5F2EA;--ac:#FFC400;--mu:#8A8A93}}
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
u{{color:var(--ac);text-decoration:none;background:linear-gradient(var(--ac),var(--ac)) bottom 6px right/100% 10px no-repeat;padding-bottom:14px}}
.body,.sub{{font-weight:700;font-size:46px;line-height:1.7;margin-top:50px;color:#D8D5CC}}
.big{{position:absolute;left:60px;top:200px;font-size:420px;font-weight:900;color:var(--ac);opacity:.12;line-height:1;direction:ltr}}
.card .main{{top:520px}}
.glow{{position:absolute;left:-200px;bottom:-200px;width:900px;height:900px;background:radial-gradient(circle,rgba(255,196,0,.35),transparent 65%)}}
.rings{{position:absolute;left:-260px;bottom:-260px;width:800px;height:800px}}
.rings i{{position:absolute;border:6px solid var(--ac);border-radius:50%;inset:0}}
.rings i:nth-child(2){{inset:120px;opacity:.6}}.rings i:nth-child(3){{inset:240px;opacity:.35}}
.cover .main{{top:300px}}.last .main{{top:420px}}
</style></head><body>{"".join(out)}</body></html>'''
open("carousel.html","w").write(html)
