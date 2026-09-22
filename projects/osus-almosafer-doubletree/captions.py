# -*- coding: utf-8 -*-
"""يبني caps.js + .srt + .txt من جُمل النص وتوقيتاتها.
التوقيتات مثبّتة على حدود المقاطع المكتشفة في المصدر:
5.78 · 8.03 · 10.87 · 16.73 · 18.60 · 20.20 · 26.47
وداخل الجملة تُوزّع الكلمات بالتناسب مع طول كل كلمة."""
import json, io

SENT = [
 (0.35, 2.15, "انتبه من هذا الخطأ"),
 (2.25, 4.15, "كثير من الناس يخطئون في الحجز"),
 (4.25, 5.72, "بين فندقين بنفس الاسم"),
 (5.92, 7.97, "فندق دبل تري جبل عمر"),
 (8.15,10.40, "وفندق دبل تري العزيزية"),
 (10.95,16.60,"فندق دبل تري جبل عمر هنا ويبعد عن الحرم دقائق مشي"),
 (16.80,18.54,"وهذا موقعه على الخريطة"),
 (18.70,23.30,"وفندق دبل تري العزيزية هناك ويبعد عن الحرم 5 كيلومتر"),
 (23.45,26.40,"ويحتاج مواصلات وهذا موقعه على الخريطة"),
 (26.55,29.70,"وبينهم فرق كبير في الموقع والسعر والفخامة"),
 (29.85,32.40,"فتأكد قبل ما تحجز الفندق"),
 (32.90,37.35,"ولحجز هذا أو هذا الرابط في البايو"),
]
HOT = {"انتبه","الخطأ","يخطئون","بنفس","الاسم","عمر","العزيزية","مشي","كيلومتر",
       "مواصلات","والفخامة","والسعر","الموقع","فتأكد","الرابط","البايو","الخريطة","الحرم"}

MAXW, MAXC = 3, 22
caps=[]
for s,e,txt in SENT:
    words=txt.split()
    chunks=[]; cur=[]
    for w in words:
        trial=cur+[w]
        over = len(trial)>MAXW or len(" ".join(trial))>MAXC
        if over and cur and not cur[-1].isdigit():   # لا ينتهي الكرت برقم مفصول عن وحدته
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

open("caps.js","w",encoding="utf-8").write("window.CAPS="+json.dumps(caps,ensure_ascii=False)+";\n")

def ts(x):
    h=int(x//3600); m=int(x%3600//60); s=x%60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".",",")
with io.open("ad-master.srt","w",encoding="utf-8") as f:
    for i,(s,e,txt) in enumerate(SENT,1):
        f.write(f"{i}\n{ts(s)} --> {ts(e)}\n{txt}\n\n")
with io.open("ad-master.txt","w",encoding="utf-8") as f:
    f.write("\n".join(t for _,_,t in SENT)+"\n")
print(f"caps.js: {len(caps)} كرت كابشن · srt: {len(SENT)} سطر")
