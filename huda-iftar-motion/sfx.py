import numpy as np, wave, sys, json
SR=48000
def put(buf,t,x,g=1.0):
    i=int(t*SR); n=min(len(x),len(buf)-i)
    if n>0: buf[i:i+n]+=g*x[:n]
def env(n,a=.005,d=8): t=np.arange(n)/SR; return np.minimum(t/a,1)*np.exp(-d*t)
def tick(): n=int(.12*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*1900*t)*env(n,.001,40)*.5
def hit():  n=int(.5*SR); t=np.arange(n)/SR; f=110*np.exp(-6*t)+45; ph=2*np.pi*np.cumsum(f)/SR; r=np.random.RandomState(1).randn(n)*np.exp(-60*t)*.25; return (np.sin(ph)*env(n,.002,7)+r)*.9
def chime(): n=int(1.6*SR); t=np.arange(n)/SR; return sum(np.sin(2*np.pi*f*t)*a for f,a in [(784,.5),(1175,.35),(1568,.2),(2349,.1)])*env(n,.003,3.2)*.5
def whoosh(d=.7):
    n=int(d*SR); r=np.random.RandomState(2).randn(n); t=np.arange(n)/SR
    # sweep via cumulative filtering: moving average length shrinks over time
    out=np.zeros(n); k=np.cumsum(r); 
    for L,(a,b) in zip([400,150,60,20],[(0,.25),(.25,.5),(.5,.75),(.75,1)]):
        i0,i1=int(a*n),int(b*n); seg=(k[i0+L:i1+L]-k[i0:i1])/L if i1+L<=n else None
        if seg is not None: out[i0:i0+len(seg)]=r[i0:i0+len(seg)]-seg
    w=np.sin(np.pi*t/d)**2; return out*w*.35
proj=sys.argv[1]; dur=float(sys.argv[2]); ev=json.loads(sys.argv[3]); buf=np.zeros(int(dur*SR))
for typ,t in ev: put(buf,t,{'tick':tick(),'hit':hit(),'chime':chime(),'whoosh':whoosh()}[typ], 1.0)
buf=buf/ max(1e-6,np.abs(buf).max())*.8
with wave.open(proj,'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf*32767).astype('int16').tobytes())
