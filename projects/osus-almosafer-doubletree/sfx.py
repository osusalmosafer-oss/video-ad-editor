# مؤثرات صوتية مُركّبة بالكود — مربوطة بنبضات الخطة
import numpy as np, wave, re, json, sys, os
W=os.path.dirname(os.path.abspath(__file__)); SR=48000
src=open(os.path.join(W,'plan.js'),encoding='utf-8').read()
TOTAL=float(re.search(r'SRC_END\s*=\s*([\d.]+)',src).group(1))+float(re.search(r'OUTRO\s*=\s*([\d.]+)',src).group(1))
beats=[(float(a),b=='true') for a,b in re.findall(r'\{t:\s*([\d.]+),\s*sweep:\s*(true|false)',src)]
n=int(TOTAL*SR)+SR; buf=np.zeros(n); rng=np.random.RandomState(7)

def add(sig,t0,g=1.0):
    i=max(0,int(t0*SR)); j=min(n,i+len(sig))
    if j>i: buf[i:j]+=sig[:j-i]*g
def lp(x,a0,a1):
    y=np.empty_like(x); z=0.0
    for i in range(len(x)):
        a=a0+(a1-a0)*(i/len(x)); z+=a*(x[i]-z); y[i]=z
    return y
def nrm(x): return x/(np.max(np.abs(x))+1e-9)
def whoosh(dur=0.36,up=True):
    L=int(dur*SR); t=np.arange(L)/SR
    y=lp(rng.randn(L),0.03,0.32) if up else lp(rng.randn(L),0.32,0.03)
    return nrm(y)*np.sin(np.pi*np.clip(t/dur,0,1))**1.6
def thud(f0=140,f1=56,dur=0.34):
    L=int(dur*SR); t=np.arange(L)/SR
    f=f0*np.exp(np.log(f1/f0)*t/dur); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t/0.090)
    s+=lp(rng.randn(L),0.35,0.05)*np.exp(-t/0.006)*0.35
    return nrm(s)
def tap(dur=0.10):
    L=int(dur*SR); t=np.arange(L)/SR
    s=lp(rng.randn(L),0.24,0.05)*np.exp(-t/0.014)
    s*=np.minimum(1.0,t/0.0012); return nrm(s)
def alert(dur=0.70):
    # نغمتان صاعدتان + طَرْق خفيف = تنبيه واضح بلا إزعاج
    L=int(dur*SR); t=np.arange(L)/SR; s=np.zeros(L)
    for k,(f,t0,ln) in enumerate([(880,0.00,0.22),(1174,0.16,0.34)]):
        i0=int(t0*SR); i1=min(L,i0+int(ln*SR)); tt=np.arange(i1-i0)/SR
        env=np.exp(-tt/0.085)*np.minimum(1.0,tt/0.004)
        s[i0:i1]+=(np.sin(2*np.pi*f*tt)+0.30*np.sin(2*np.pi*2*f*tt))*env
    s+=np.concatenate([tap(0.09),np.zeros(L-int(0.09*SR))])[:L]*0.5
    return nrm(s)

WU,WD,TH,TP,AL=whoosh(0.36,True),whoosh(0.32,False),thud(),tap(),alert()
ev=0
for t0,sw in beats:
    if sw:
        add(WU if t0<20 else WD, max(0,t0-0.16), 0.085); ev+=1
add(AL, 6.22, 0.10); ev+=1                       # «انتبه»
for t0 in (11.00, 20.80, 32.40):          # ظهور الكروت
    add(TP, t0, 0.070); ev+=1
add(TH, 37.58, 0.105); ev+=1                     # الدخول لكرت النهاية
buf=np.clip(buf,-0.95,0.95)
pcm=(buf*32767).astype('<i2'); st=np.repeat(pcm[:,None],2,axis=1).ravel()
w=wave.open(os.path.join(W,'sfx.wav'),'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(st.tobytes()); w.close()
print('sfx.wav  %.2fs  أحداث=%d  (%.1f/دقيقة)'%(TOTAL,ev,ev*60/TOTAL))
