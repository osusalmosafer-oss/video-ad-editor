#!/usr/bin/env python3
"""align.py audio.mp3  -> words.json  (توقيت كل كلمة من غلاف الطاقة الصوتية + أوزان مقاطع الكلمات)
المدخل: timings.json = {"basmala":[s,e],"ayahs":[[s,e]x8]}  (حدود تقريبية للأقسام)"""
import sys,json,re,subprocess,wave,tempfile,os,numpy as np
audio=sys.argv[1];T=json.load(open('timings.json'))
wav=tempfile.mktemp(suffix='.wav');subprocess.run(['ffmpeg','-v','error','-y','-i',audio,'-ac','1','-ar','8000',wav],check=True)
w=wave.open(wav);x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float);sr=8000;os.remove(wav)
H=.01;hop=int(H*sr)
e=20*np.log10(np.sqrt([np.mean(x[i:i+hop*2]**2) for i in range(0,len(x)-hop*2,hop)])+1)
e=np.convolve(e,np.ones(5)/5,'same')
S=json.load(open('surah98.json'));B=json.load(open('basmala.json'))['text']
def weight(word):
    syl=len(re.findall('[ً-َُِٰ]',word))                    # حركات (مقاطع)
    madd=len(re.findall('[َ][اى]|[ُ]و|[ِ]ي|ٰ|[اوي](?=[ءّْ])',word))
    gem=len(re.findall('ّ',word))
    return max(1.0,syl+0.7*madd+0.5*gem+0.3*len(re.sub('[ً-ٰٟۖ-ۭ]','',word))*0.5)
def speech_range(s,end):
    st=s;thr=66
    while st<end and e[int(st/H)]<thr and st<s+1.5:st+=H
    en=end
    for t in np.arange(end-1.0,end+0.3,H):
        i=int(t/H)
        if i+15<len(e) and (e[i:i+15]<thr).all(): en=t;break
    return st,en
def split(text,s,end):
    words=text.split(' ');n=len(words)
    if n==1:return [[s,end]]
    st,en=speech_range(s,end);wt=np.array([weight(v) for v in words]);cum=np.cumsum(wt)/wt.sum()
    exp=st+cum[:-1]*(en-st)
    lo,hi=int(st/H),int(en/H);seg=e[lo:hi]
    cand=[j for j in range(3,len(seg)-3) if seg[j]<=seg[j-3:j+4].min()+1e-9]
    cand=np.array(cand);ct=(lo+cand)*H;depth=np.array([np.median(seg[max(0,j-60):j+60])-seg[j] for j in cand])
    sig=max(.25,.12*(en-st))
    def cost(k,c):return ((ct[c]-exp[k])/sig)**2-0.12*depth[c]
    K=n-1;C=len(cand)
    if C<K:b=list(exp)
    else:
        D=np.full((K,C),1e9);P=np.zeros((K,C),int)
        for c in range(C):D[0,c]=cost(0,c)
        for k in range(1,K):
            best=1e9;bi=-1
            for c in range(C):
                # min over previous c' with ct[c']<ct[c]-0.12
                m=ct<ct[c]-0.12
                if m.any():
                    pi=np.argmin(np.where(m,D[k-1],1e9));D[k,c]=D[k-1,pi]+cost(k,c);P[k,c]=pi
        c=int(np.argmin(D[K-1]));path=[c]
        for k in range(K-1,0,-1):c=P[k,c];path.append(c)
        b=[ct[c] for c in reversed(path)]
    edges=[st]+[float(v) for v in b]+[en]
    return [[round(edges[i],3),round(edges[i+1],3)] for i in range(n)]
out={'basmala':split(B,*T['basmala']),'ayahs':[split(S['verses'][i],*T['ayahs'][i]) for i in range(8)]}
json.dump(out,open('words.json','w'));print('words.json ok',[len(a) for a in out['ayahs']])
