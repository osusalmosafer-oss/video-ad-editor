#!/usr/bin/env python3
# يقسّم تسجيل المستخدم (ملف واحد) إلى 7 مقاطع بحسب الجمل، وينظّف الصوت، ويكتب voice.json (مدة + زمن الكلمات)
import json, os, subprocess, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); A = f'{D}/assets'; SRC = f'{A}/myvoice.mp3'
tr = json.load(open(f'{D}/myvoice.json', encoding='utf8'))
W = [(w[2].strip(), w[0], w[1]) for s in tr for w in s['w']]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32); h = 320; n = len(x) // h
e = 20 * np.log10(np.sqrt((x[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-6)
def lowest(b, r=0.22):
    i0, i1 = int(max(0, (b - r) * 50)), int(min(n - 1, (b + r) * 50)); return (i0 + int(np.argmin(e[i0:i1 + 1]))) / 50
# أول كلمة لكل مقطع (فهرس في W) ← حسب الجمل المنطوقة
first = ['التدخين', 'ومن', 'أما', 'والشيشة', 'وفحمها_x', 'وما', 'ودينيا', 'الإقلاع']
starts_idx = [0, 4, 8, 17, None, None, None, None]
# الأسهل: تعريف المقاطع بحدود زمنية اسمية داخل الصمت/بين الجمل
cuts = [0.0, 2.58, lowest(5.72), 14.07, 24.47, lowest(29.65), lowest(37.9), W[-1][2] + 0.5]
out = {}
for i in range(7):
    a, b = cuts[i], cuts[i + 1]
    ws = [w for w in W if a - 0.35 <= w[1] < b - 0.1]
    s0 = a; s1 = min(b + 0.03, ws[-1][2] + 0.45) if i == 6 else b + 0.03
    d = s1 - s0; wav = f'{A}/m{i+1}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s0:.3f}', '-t', f'{d:.3f}', '-i', SRC,
        '-af', f'highpass=f=70,afftdn=nr=10:nf=-38,acompressor=threshold=0.1:ratio=3:attack=5:release=80,afade=t=in:d=0.03,afade=t=out:st={d-0.1:.3f}:d=0.1,loudnorm=I=-15:TP=-1.5',
        '-ac', '1', '-ar', '48000', wav], check=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
    out[f'm{i+1}'] = {'wav': f'assets/m{i+1}.wav', 'dur': round(dur, 2), 'src': round(s0, 2), 'words': [[w[0], round(max(0, w[1] - s0), 2)] for w in ws]}
    print(f'm{i+1}', round(s0, 2), '→', round(s1, 2), round(dur, 2), ' '.join(w[0] for w in ws))
json.dump(out, open(f'{D}/voice.json', 'w'), ensure_ascii=False, indent=1)
