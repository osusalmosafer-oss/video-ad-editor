BASE='''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;src:url(fonts/Cairo.ttf);font-weight:200 1000}
:root{--bg:#1F2449;--fg:#FFFFFF;--ac:#FFC24B;--mu:#A9B1D6}
*{box-sizing:border-box;margin:0}body{background:#222;font-family:Cairo}
.s{width:1080px;height:1920px;background:var(--bg);color:var(--fg);position:relative;overflow:hidden;margin-bottom:20px;text-align:center}
.glow{position:absolute;left:50%;top:50%;width:1300px;height:1300px;margin:-650px 0 0 -650px;background:radial-gradient(circle,rgba(255,194,75,.20),transparent 62%)}
.frame{position:absolute;inset:60px;border:3px solid rgba(255,194,75,.55);border-radius:36px}
.frame2{position:absolute;inset:78px;border:1.5px solid rgba(255,194,75,.25);border-radius:24px}
.pill{position:absolute;top:150px;left:50%;transform:translateX(-50%);border:3px solid var(--ac);color:var(--ac);font-weight:800;font-size:42px;padding:8px 46px;border-radius:60px;white-space:nowrap}
.brand{position:absolute;bottom:130px;left:0;right:0;font-weight:700;font-size:36px;color:var(--mu);direction:ltr}
.cnt{position:absolute;bottom:200px;left:0;right:0;font-weight:700;font-size:32px;color:var(--mu);direction:ltr}
.main{position:absolute;left:130px;right:130px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:50px;z-index:2}
h1{font-weight:900;font-size:108px;line-height:1.6;white-space:nowrap}
h2{font-weight:900;font-size:92px;line-height:1.7}
p{font-weight:700;font-size:52px;line-height:1.8;color:#DCE0F2}
.ac{color:var(--ac)}
.src{font-weight:700;font-size:44px;color:var(--ac);border-top:3px solid rgba(255,194,75,.5);padding-top:26px;margin-top:10px}
.crescent{position:relative;width:170px;height:170px}
.crescent i{position:absolute;border-radius:50%}
.crescent i:nth-child(1){inset:0;background:var(--ac)}
.crescent i:nth-child(2){inset:-6px 0 6px -52px;background:var(--bg);left:auto;right:-52px;width:150px;height:150px;top:10px}
.star{color:var(--ac);font-size:64px;letter-spacing:30px}
</style></head><body>%s</body></html>'''
def slide(i,n,pill,body):
    cnt=f'<div class="cnt">{i} / {n}</div>' if n else ''
    return f'<section class="s" id="s{i}"><div class="glow"></div><div class="frame"></div><div class="frame2"></div><div class="pill">{pill}</div><div class="main">{body}</div>{cnt}<div class="brand">@osusalmosafer</div></section>'
cres='<svg width="190" height="190" viewBox="0 0 190 190" style="margin-top:40px"><defs><mask id="m"><rect width="190" height="190" fill="white"/><circle cx="120" cy="82" r="68" fill="black"/></mask></defs><circle cx="90" cy="95" r="80" fill="#FFC24B" mask="url(#m)"/><polygon points="140,40 146,58 165,58 150,69 156,87 140,76 124,87 130,69 115,58 134,58" fill="#FFC24B" transform="translate(5,-10) scale(.9)"/></svg>'
poster=slide(0,0,'ليلة الجمعة',f'{cres}<h1>اللهم صلِّ وسلِّم<br>على نبينا <span class="ac">محمد</span></h1><p>أكثروا من الصلاة عليّ يوم الجمعة وليلة الجمعة</p><div class="src">رواه البيهقي</div>')
N=5
series=[
 slide(1,N,'ليلة الجمعة',f'{cres}<h1>أكثروا من<br><span class="ac">الصلاة</span><br>على النبي</h1><p>صلى الله عليه وسلم</p>'),
 slide(2,N,'قال الله تعالى','<h2>﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا <span class="ac">صَلُّوا عَلَيْهِ</span> وَسَلِّمُوا تَسْلِيمًا﴾</h2><div class="src">سورة الأحزاب - الآية ٥٦</div>'),
 slide(3,N,'قال رسول الله ﷺ'.replace('ﷺ','صلى الله عليه وسلم'),'<h2>«مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا <span class="ac">عَشْرًا</span>»</h2><div class="src">رواه مسلم</div>'),
 slide(4,N,'قال رسول الله صلى الله عليه وسلم','<h2>«أَكْثِرُوا مِنَ <span class="ac">الصَّلَاةِ عَلَيَّ</span> يَوْمَ الْجُمُعَةِ وَلَيْلَةَ الْجُمُعَةِ»</h2><div class="src">رواه البيهقي</div>'),
 slide(5,N,'ليلة الجمعة',f'{cres}<h2><span class="ac">اللهم صلِّ وسلِّم وبارك</span><br>على نبينا محمد</h2><p>شاركها وذكّر من تحب بالصلاة على النبي صلى الله عليه وسلم</p>'),
]
open('jumua.html','w').write(BASE.replace('%s',poster+''.join(series)))
