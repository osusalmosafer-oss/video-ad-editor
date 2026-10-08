"""مؤثرات هادئة لتجربة «سيل أسئلة الأسعار»: 3 أحداث فقط في 20 ثانية، ذروة -18 dBFS."""
import sys, wave
import numpy as np
SR=44100; DUR=20.0
buf=np.zeros(int(SR*DUR))
def add(t0,x):
    i=int(t0*SR); buf[i:i+len(x)]+=x[:len(buf)-i]
def env(n,d): return np.exp(-(np.arange(n)/SR)*d)
def click(t0,f=1800,amp=1.0):
    n=int(0.05*SR); t=np.arange(n)/SR
    add(t0,(np.sin(2*np.pi*f*t)*env(n,90)+np.random.default_rng(3).standard_normal(n)*env(n,400)*0.35)*0.5*amp)
def riser(t0,dur=1.6,amp=1.0):
    n=int(dur*SR); t=np.arange(n)/SR
    f=300+(1800-300)*(t/dur)**2; ph=2*np.pi*np.cumsum(f)/SR
    x=(np.sin(ph)*0.55+np.random.default_rng(5).standard_normal(n)*0.1)*(t/dur)**1.3
    x*=np.minimum(1,(dur-t)/0.08); add(t0,x*0.6*amp)
def chime(t0,amp=1.0):
    n=int(0.7*SR); t=np.arange(n)/SR
    add(t0,(np.sin(2*np.pi*880*t)+0.6*np.sin(2*np.pi*1320*t))*env(n,6)*0.45*amp)
riser(0.3,1.6); click(7.4); chime(14.2)
buf*=10**(-18/20)/np.max(np.abs(buf))
with wave.open(sys.argv[1] if len(sys.argv)>1 else "sfx.wav","wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf*32767).astype(np.int16).tobytes())
print("OK peak dBFS",round(20*np.log10(np.max(np.abs(buf))),1))
