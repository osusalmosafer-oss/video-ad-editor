#!/usr/bin/env python3
"""python3 build.py preview|all [slug-prefix ...]  — يبني مشروع كل فيديو، ويعاين أو يرسم ويضيف أصوات انتقالات."""
import json, os, shutil, subprocess, sys, glob
from specs import SPECS
here = os.path.dirname(os.path.abspath(__file__))
engine = os.environ.get('ENGINE') or glob.glob(os.path.expanduser('~/.claude/plugins/synced/*/majed-video/video-ad-editor/motion'))[0]
mode = sys.argv[1]; only = sys.argv[2:]
for slug, title, scenes in SPECS:
    if only and not any(slug.startswith(o) for o in only): continue
    d = os.path.join(here, 'videos', slug); os.makedirs(os.path.join(d, 'scenes'), exist_ok=True); os.makedirs(os.path.join(d, 'assets'), exist_ok=True)
    shutil.copy(os.path.join(here, 'engine', 'main.js'), os.path.join(d, 'scenes', 'main.js'))
    shutil.copy(os.path.join(here, 'assets', 'logo.png'), os.path.join(d, 'assets', 'logo.png')); shutil.copy(os.path.join(here, 'assets', 'theme.json'), os.path.join(d, 'theme.json'))
    dur = round(sum(s['d'] for s in scenes) + 5, 2)
    proj = {"name": title + " — أسس المسافر", "fps": 60, "width": 1080, "height": 1920, "bpm": 96, "beatsPerBar": 4, "beatOffset": 0,
            "palette": {"bg": "#1F2449", "ink": "#FFFFFF", "acc": "#2884FF", "clay": "#1C6FE0", "hi": "#A9B1D6", "mut": "#A9B1D6", "onAcc": "#FFFFFF"},
            "fonts": {"display": "Cairo", "body": "Cairo", "num": "Cairo"}, "images": {"logo": "assets/logo.png"}, "post": {"grain": 0, "vignette": 0},
            "duration": dur, "spec": {"phone": "+966566403938", "scenes": scenes}, "scenes": [{"id": "main", "file": "scenes/main.js", "minDur": dur}]}
    json.dump(proj, open(os.path.join(d, 'project.json'), 'w'), ensure_ascii=False, indent=1)
    starts, acc = [], 0.0
    for s in scenes + [dict(d=5)]: starts.append(acc); acc += s['d']
    if mode == 'preview':
        times = [round(st + min(2.6, s_d * 0.55), 2) for st, s_d in zip(starts, [s['d'] for s in scenes] + [5])]
        subprocess.check_call(['node', 'render.js', d, 'preview'] + [str(x) for x in times] + ['--safe', '--scale', '0.4'], cwd=engine, stdout=subprocess.DEVNULL)
        shutil.copy(os.path.join(d, 'renders', 'preview', 'contact.png'), os.path.join(here, 'out', f'_contact-{slug}.png')); print('preview', slug, flush=True)
    else:
        subprocess.check_call(['node', 'render.js', d, 'all', '--fresh', '--workers', '3'], cwd=engine, stdout=subprocess.DEVNULL)
        out = os.path.join(here, 'out', slug + '.mp4')
        subprocess.check_call(['python3', os.path.join(here, 'sfx.py'), os.path.join(d, 'renders', 'video.mp4'), out] + [str(x) for x in starts[1:]])
        print('done', slug, dur, flush=True)
