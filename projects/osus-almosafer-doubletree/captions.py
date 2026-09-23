# -*- coding: utf-8 -*-
"""caps.js + .srt + .txt — الحدود مستخرجة من الصوت نفسه.
VAD على نطاق الكلام (300-3400 هرتز) نسبةً للنطاق المنخفض (هواء/ضجيج الشارع)
أعطى 15 مقطع كلام، وعليها رُكّبت الجُمل الاثنتا عشرة."""
import json, io

# (البداية, النهاية, النص, رقم الجملة) — كل سطر يطابق مقطع كلام مكتشفاً
PARTS = [
 ( 0.36,  1.78, "انتبه من هذا الخطأ", 1),
 ( 1.86,  3.64, "كثير من الناس يخطئون في الحجز", 2),
 ( 4.16,  5.72, "بين فندقين بنفس الاسم", 3),
 ( 5.82,  7.60, "فندق دبل تري جبل عمر", 4),
 ( 8.24, 10.44, "وفندق دبل تري العزيزية", 5),
 (10.92, 14.40, "فندق دبل تري جبل عمر هنا ويبعد عن", 6),
 (14.84, 16.28, "الحرم دقائق مشي", 6),
 (16.92, 18.92, "وهذا موقعه على الخريطة", 7),
 (19.40, 20.28, "وفندق دبل تري", 8),
 (20.88, 22.52, "العزيزية هناك ويبعد عن الحرم", 8),
 (22.92, 23.67, "5 كيلومتر", 8),
 (23.67, 25.92, "ويحتاج مواصلات وهذا موقعه على الخريطة", 9),
 (26.44, 29.28, "وبينهم فرق كبير في الموقع والسعر والفخامة", 10),
 (29.68, 32.32, "فتأكد قبل ما تحجز الفندق", 11),
 (32.80, 33.64, "ولحجز هذا", 12),
 (34.16, 34.72, "أو هذا", 12),
 (35.20, 36.52, "الرابط في البايو", 12),
]
SENTENCES = {
 1:"انتبه من هذا الخطأ", 2:"كثير من الناس يخطئون في الحجز", 3:"بين فندقين بنفس الاسم",
 4:"فندق دبل تري جبل عمر", 5:"وفندق دبل تري العزيزية",
 6:"فندق دبل تري جبل عمر هنا ويبعد عن الحرم دقائق مشي",
 7:"وهذا موقعه على الخريطة",
 8:"وفندق دبل تري العزيزية هناك ويبعد عن الحرم 5 كيلومتر",
 9:"ويحتاج مواصلات وهذا موقعه على الخريطة",
 10:"وبينهم فرق كبير في الموقع والسعر والفخامة",
 11:"فتأكد قبل ما تحجز الفندق", 12:"ولحجز هذا أو هذا الرابط في البايو",
}
HOT = {"انتبه","الخطأ","يخطئون","بنفس","الاسم","عمر","العزيزية","مشي","كيلومتر",
       "مواصلات","والفخامة","والسعر","الموقع","فتأكد","الرابط","البايو","الخريطة","الحرم"}
MAXW, MAXC, BRIDGE = 3, 22, 0.30

caps=[]
for s,e,txt,_ in PARTS:
    words=txt.split(); chunks=[]; cur=[]
    for w in words:
        trial=cur+[w]
        over = len(trial)>MAXW or len(" ".join(trial))>MAXC
        if over and cur and not cur[-1].isdigit():
            chunks.append(cur); cur=[w]
        else: cur=trial
    if cur: chunks.append(cur)
    weights=[sum(len(w) for w in c)+len(c) for c in chunks]
    tot=sum(weights); span=e-s; t=s
    for c,wt in zip(chunks,weights):
        d=span*wt/tot
        caps.append({"s":round(t,3),"e":round(t+d,3),
                     "w":[{"t":w,"h":(w in HOT)} for w in c]})
        t+=d
    caps[-1]["e"]=round(e,3)

# يمدّ الكرت قليلاً عبر السكتات القصيرة حتى لا يرفّ الكابشن
for i,c in enumerate(caps):
    nxt = caps[i+1]["s"] if i+1<len(caps) else 1e9
    c["e"]=round(min(c["e"]+BRIDGE, nxt), 3)

open("caps.js","w",encoding="utf-8").write("window.CAPS="+json.dumps(caps,ensure_ascii=False)+";\n")

bounds={}
for s,e,_,i in PARTS:
    b=bounds.setdefault(i,[s,e]); b[0]=min(b[0],s); b[1]=max(b[1],e)
def ts(x):
    h=int(x//3600); m=int(x%3600//60); s=x%60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".",",")
with io.open("ad-master.srt","w",encoding="utf-8") as f:
    for i in sorted(bounds):
        s,e=bounds[i]; f.write(f"{i}\n{ts(s)} --> {ts(e)}\n{SENTENCES[i]}\n\n")
with io.open("ad-master.txt","w",encoding="utf-8") as f:
    f.write("\n".join(SENTENCES[i] for i in sorted(SENTENCES))+"\n")
print(f"caps.js: {len(caps)} كرت · srt: {len(bounds)} جملة · آخر كلام: {max(e for _,e,_,_ in PARTS):.2f} ث")
