# -*- coding: utf-8 -*-
"""مؤثرات مركّبة بالكود + خفض لحظي للصوت الأصلي حتى تُسمع.
يقرأ voice.wav (صوت المصدر ممتدّاً لمدة الإعلان) ويكتب mix.wav جاهزاً للتجميع.
الخلفية هنا شارع مفتوح بهواء: متوسط ‎-17 dB، فالمؤثر لوحده يُطمَس —
ولذلك كل مؤثر يخفض الأصلي 5 dB لـ0.22 ث حوله، والأصوات مائلة للحدّة لتمرّ فوق الهواء."""
import numpy as np, wave, re, os, sys
W=os.path.dirname(os.path.abspath(__file__)); SR=48000
src=open(os.path.join(W,'plan.js'),encoding='utf-8').read()
TOTAL=float(re.search(r'SRC_END\s*=\s*([\d.]+)',src).group(1))+float(re.search(r'OUTRO\s*=\s*([\d.]+)',src).group(1))
beats=[(float(a),b=='true') for a,b in re.findall(r'\{t:\s*([\d.]+),\s*sweep:\s*(true|false)',src)]

# ── الصوت الأصلي ──────────────────────────────────────────────
vw=wave.open(os.path.join(W,'voice.wav'))
assert vw.getframerate()==SR and vw.getnchannels()==2
voice=np.frombuffer(vw.readframes(vw.getnframes()),dtype='<i2').astype(np.float32)/32768
voice=voice.reshape(-1,2); vw.close()
n=voice.shape[0]

buf=np.zeros(n); rng=np.random.RandomState(7); duck=np.ones(n)

def add(sig,t0,g=1.0):
    i=max(0,int(t0*SR)); j=min(n,i+len(sig))
    if j>i: buf[i:j]+=sig[:j-i]*g
def dip(t0,depth=0.56,pre=0.05,hold=0.10,rel=0.22):
    """خفض قصير ناعم للصوت الأصلي حول المؤثر"""
    a=int(max(0,(t0-pre))*SR); b=int(min(TOTAL,(t0+hold+rel))*SR)
    if b<=a: return
    t=(np.arange(b-a)/SR)
    down=np.clip(t/max(pre,1e-3),0,1)
    up=np.clip((t-(pre+hold))/rel,0,1)
    env=1-(depth*(1-np.maximum(0,up))*down)
    duck[a:b]=np.minimum(duck[a:b],env)
def lp(x,a0,a1):
    y=np.empty_like(x); z=0.0
    for i in range(len(x)):
        a=a0+(a1-a0)*(i/len(x)); z+=a*(x[i]-z); y[i]=z
    return y
def hp(x,a=0.62):                      # فرق أول = تمرير عالٍ بسيط، يرفع الحدّة فوق الهواء
    y=np.empty_like(x); z=0.0
    for i in range(len(x)):
        z=a*(z+x[i]-(x[i-1] if i else 0.0)); y[i]=z
    return y
def nrm(x): return x/(np.max(np.abs(x))+1e-9)

def whoosh(dur=0.36,up=True):
    L=int(dur*SR); t=np.arange(L)/SR
    y=lp(rng.randn(L),0.03,0.34) if up else lp(rng.randn(L),0.34,0.03)
    return nrm(y)*np.sin(np.pi*np.clip(t/dur,0,1))**1.6
def thud(f0=140,f1=56,dur=0.34):
    L=int(dur*SR); t=np.arange(L)/SR
    f=f0*np.exp(np.log(f1/f0)*t/dur); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t/0.090)+lp(rng.randn(L),0.35,0.05)*np.exp(-t/0.006)*0.35
    return nrm(s)
def pop(dur=0.26):
    """صوت ظهور شريحة: نقرة حادّة + زقزقة صاعدة قصيرة — تمرّ فوق هواء الشارع"""
    L=int(dur*SR); t=np.arange(L)/SR
    click=hp(rng.randn(L))*np.exp(-t/0.0055)
    f=1500*np.exp(np.log(3400/1500)*np.clip(t/0.085,0,1))
    chirp=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.045)*np.minimum(1.0,t/0.0015)
    body=np.sin(2*np.pi*760*t)*np.exp(-t/0.030)*0.35
    return nrm(click*0.85+chirp*1.0+body)
def alert(dur=0.72):
    L=int(dur*SR); t=np.arange(L)/SR; s=np.zeros(L)
    for f,t0,ln in [(880,0.00,0.22),(1174,0.16,0.34)]:
        i0=int(t0*SR); i1=min(L,i0+int(ln*SR)); tt=np.arange(i1-i0)/SR
        env=np.exp(-tt/0.085)*np.minimum(1.0,tt/0.004)
        s[i0:i1]+=(np.sin(2*np.pi*f*tt)+0.30*np.sin(2*np.pi*2*f*tt))*env
    return nrm(s+np.concatenate([pop(0.10),np.zeros(L-int(0.10*SR))])[:L]*0.45)

WU,WD,TH,PP,AL=whoosh(0.36,True),whoosh(0.32,False),thud(),pop(),alert()
# النقرة توضع في السكتة الصغيرة قبل الكلمة مباشرة، فتُسمع بلا ما تخنق صوته
CARDS=[16.84, 24.38, 33.18, 34.27]      # خريطة 1 · خريطة 2 · مربّع جبل عمر · مربّع العزيزية
OUTRO_T=[t for t,_ in beats][-1]
ev=[]
add(AL, 0.32, 0.115); dip(0.32,0.50); ev.append(0.32)
WIN0=int(0.07*SR)
for t0,sw in beats:
    if not sw: continue
    S = WU if t0<19 else WD
    i=int(max(0,t0-0.10)*SR)
    bg=float(np.sqrt((voice[i:i+WIN0].mean(axis=1)**2).mean()))+1e-9
    S_RMS=float(np.sqrt((S[int(0.06*SR):int(0.13*SR)]**2).mean()))
    g=min(0.28, bg*(1-0.34)*10**(1.5/20)/S_RMS)
    add(S, max(0,t0-0.16), g); dip(t0-0.06,0.34,0.08,0.06,0.26); ev.append(t0)
# مستوى كل نقرة يُحسب من الخلفية عندها: الهدف أن تعلو عليها ~3.5 dB بعد الخفض.
# الخلفية هنا شارع مفتوح بهواء وضجيج، فالمستوى الثابت يُطمَس — ولذلك يُقاس لا يُخمَّن.
WIN=int(0.07*SR)
PP_RMS=float(np.sqrt((PP[:WIN]**2).mean()))
for t0 in CARDS:
    i=int(t0*SR)
    bg=float(np.sqrt((voice[i:i+WIN].mean(axis=1)**2).mean()))+1e-9
    bg_db=20*np.log10(bg)
    depth = 0.40 if bg_db < -20 else 0.62          # يخفض أعمق لما يكون يتكلم بصوت عالٍ
    g = min(0.34, bg*(1-depth)*10**(3.5/20)/PP_RMS)
    add(PP, t0, g); dip(t0, depth, 0.04, 0.07, 0.17); ev.append(t0)
    print("   نقرة %5.2f ث: خلفية %5.1f dB · خفض %.0f%% · كسب %.3f"%(t0,bg_db,depth*100,g))          # ← أعلى وأحدّ من قبل
add(TH, OUTRO_T-0.02, 0.110)                                  # يتزامن مع كشيدة النهاية = لحظة واحدة

# نسخة المؤثرات وحدها — لقياس أنها فعلاً تعلو على الخلفية
sw=wave.open(os.path.join(W,'sfx_only.wav'),'wb'); sw.setnchannels(1); sw.setsampwidth(2); sw.setframerate(SR)
sw.writeframes((np.clip(buf,-0.98,0.98)*32767).astype('<i2').tobytes()); sw.close()
out=np.clip(voice*duck[:,None]+buf[:,None],-0.98,0.98)
pcm=(out*32767).astype('<i2')
w=wave.open(os.path.join(W,'mix.wav'),'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(pcm.tobytes()); w.close()
peak=20*np.log10(np.max(np.abs(buf))+1e-9)
moments=sorted(set(round(x,2) for x in ev))
print("mix.wav %.2f ث · %d لحظة مؤثر (%.1f/دقيقة) · ذروة المؤثرات %.1f dBFS"
      %(TOTAL,len(moments),len(moments)*60/TOTAL,peak))
