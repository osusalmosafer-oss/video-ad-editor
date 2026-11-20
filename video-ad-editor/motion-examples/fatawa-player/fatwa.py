#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fatwa.py — مشهد «فتوى مسموعة» تفاعلي: صورة الشيخ + موجة صوت تتحرك مع صوته + نص يُضاء كلمة كلمة + شريط تشغيل.
  python3 fatwa.py build   → يقصّ الصوت ويحسب منحنى الصوت ويولّد scenes/ و timeline.json و project.json
  python3 fatwa.py mix     → (بعد node motion/render.js ... all) يركّب صوت الشيخ على الفيديو → renders/final.mp4
الإعداد كله بـ fatawa.json. الصوت والصورة ملفاتك أنت (لا يُولَّد صوت أي شيخ أبدًا).
"""
import json, os, subprocess, sys, wave
import numpy as np
D = os.path.dirname(os.path.abspath(__file__)); SR = 48000; LEAD = 1.1; TAIL = 1.8; INTRO = 3.0
cfg = json.load(open(f'{D}/fatawa.json', encoding='utf-8'))

def run(c): return subprocess.run(c, check=True, capture_output=True)

def cut(c):
    out = f'{D}/assets/{c["id"]}.clip.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(c.get('from', 0)), '-to', str(c['to']), '-i', f'{D}/{c["audio"]}', '-ac', '1', '-ar', str(SR),
         '-af', 'highpass=f=70,loudnorm=I=-16:TP=-1.5', out])
    w = wave.open(out); n = w.getnframes(); x = np.frombuffer(w.readframes(n), '<i2').astype(np.float32) / 32768; dur = n / SR
    hop = SR // 50; k = len(x) // hop
    e = np.sqrt((x[:k * hop].reshape(k, hop) ** 2).mean(1)); e = e / (np.percentile(e, 95) + 1e-9); e = np.clip(e, 0, 1.2)
    return out, dur, [round(float(v), 3) for v in e]

def build():
    BH = open(f'{D}/helpers.js', encoding='utf-8').read()
    scenes = []; t = 0.0; tl = []
    intro = BH + f"""
MOTION.scene({{ id: 'intro', draw(t, lt, ctx) {{ const {{ X, at }} = ctx; FP.bg(ctx, t);
  FP.wave(ctx, t, 540, 760, 230, .35 + .25 * Math.sin(lt * 3), lt);
  NG_text(ctx, {json.dumps(cfg.get('title', 'فتاوى أهل العلم'), ensure_ascii=False)}, 540, 1000, lt, .3);
  NG_text2(ctx, {json.dumps(cfg.get('subtitle', 'بصوتهم'), ensure_ascii=False)}, 540, 1150, lt, 1.1); }} }});
"""
    open(f'{D}/scenes/intro.js', 'w', encoding='utf-8').write(intro)
    tl.append({'id': 'intro', 'file': 'scenes/intro.js', 'start': 0, 'end': INTRO, 'lines': [], 'transition': {'type': 'cut', 'dur': .5}}); t = INTRO
    clips = []; images = {}
    for c in cfg['clips']:
        wav, dur, env = cut(c); total = LEAD + dur + TAIL
        data = {'name': c['name'], 'role': c.get('role', ''), 'source': c.get('source', ''), 'dur': round(dur, 3), 'lead': LEAD, 'env': env,
                'lines': c['lines'], 'photo': c.get('photo') and f'p_{c["id"]}'}
        js = BH + f"\nconst CLIP = {json.dumps(data, ensure_ascii=False)};\nMOTION.scene({{ id: '{c['id']}', draw(t, lt, ctx) {{ FP.clip(ctx, t, lt, CLIP); }} }});\n"
        open(f'{D}/scenes/{c["id"]}.js', 'w', encoding='utf-8').write(js)
        if c.get('photo') and os.path.exists(f'{D}/{c["photo"]}'): images[f'p_{c["id"]}'] = c['photo']
        tl.append({'id': c['id'], 'file': f'scenes/{c["id"]}.js', 'start': round(t, 3), 'end': round(t + total, 3), 'lines': [], 'transition': {'type': 'crossfade', 'dur': .6}})
        clips.append({'wav': wav, 'at': round(t + LEAD, 3)}); t += total
    beats = [round(i * .8333, 4) for i in range(int(t / .8333) + 1)]
    json.dump({'duration': round(t, 3), 'bpm': 72, 'beats': beats, 'bars': beats[::4], 'sections': [{'name': 'intro', 'start': 0, 'end': t}], 'scenes': tl, 'vo': [], 'clips': clips}, open(f'{D}/timeline.json', 'w'), ensure_ascii=False)
    json.dump({'name': cfg.get('title', 'فتاوى'), 'fps': 60, 'width': 1080, 'height': 1920, 'bpm': 72, 'beatsPerBar': 4, 'beatOffset': 0,
               'palette': {'bg': '#07120F', 'ink': '#F4EFE3', 'acc': '#D9B25B', 'clay': '#A8812F', 'hi': '#F3DDA0', 'mut': '#8FA79B'},
               'fonts': {'display': 'Lalezar', 'body': 'IBM Plex Sans Arabic', 'num': 'Inter'}, 'images': images, 'post': {'grain': .03, 'vignette': .35},
               'scenes': [{'id': s['id'], 'file': s['file'], 'minDur': round(s['end'] - s['start'], 2)} for s in tl]}, open(f'{D}/project.json', 'w'), ensure_ascii=False, indent=1)
    json.dump([], open(f'{D}/sfx.json', 'w'))
    print('built', round(t, 1), 's ·', len(clips), 'clips')

def mix():
    tl = json.load(open(f'{D}/timeline.json')); v = f'{D}/renders/video.mp4'; out = f'{D}/renders/final.mp4'
    ins = ['-i', v]; fl = []; labs = []
    for i, c in enumerate(tl['clips']):
        ins += ['-i', c['wav']]; ms = int(c['at'] * 1000); fl.append(f'[{i+1}:a]adelay={ms}|{ms}[a{i}]'); labs.append(f'[a{i}]')
    fl.append(''.join(labs) + f'amix=inputs={len(labs)}:normalize=0,loudnorm=I=-16:TP=-1.5[a]')
    run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out])
    print('✅', out)

{'build': build, 'mix': mix}[sys.argv[1]]()
