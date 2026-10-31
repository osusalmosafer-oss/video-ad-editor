#!/usr/bin/env python3
"""يركّب عدّاد المشي فوق فيديو المشي الحقيقي ثم يضيف النتيجة والباص (إن وُجد) والختام.
الاستعمال: python3 compose-clip.py <clip.mp4> <out.mp4> [--cta whatsapp|inbox] [--no-bus] [--walk-seconds N]
يحتاج: ffmpeg + محرّك الموشن (متغيرات ENGINE/CHROME/NODE_PATH)."""
import json, os, subprocess, sys, glob, argparse
ap = argparse.ArgumentParser()
ap.add_argument('clip'); ap.add_argument('out')
ap.add_argument('--cta', default='whatsapp'); ap.add_argument('--no-bus', action='store_true'); ap.add_argument('--walk-seconds', type=float)
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__))
engine = os.environ.get('ENGINE') or glob.glob(os.path.expanduser('~/.claude/plugins/synced/*/majed-video/video-ad-editor/motion'))[0]
def probe(f, entry):
    return subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', entry, '-of', 'default=nw=1:nk=1', f]).decode().split()
D = float(probe(a.clip, 'format=duration')[0])
has_audio = bool(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', a.clip], capture_output=True).stdout.strip())
pj = os.path.join(here, 'project.json'); cfgd = json.load(open(pj)); w = cfgd['walk']
w.update(clipSeconds=round(D, 3), cta=a.cta, sample=False, walkSeconds=a.walk_seconds or round(D, 3)); w['bus']['available'] = not a.no_bus
total = D + 5 + (5 if not a.no_bus else 0) + 4.2 + 5
cfgd['duration'] = round(total, 3); cfgd['scenes'][0]['minDur'] = round(total, 3)
json.dump(cfgd, open(pj, 'w'), ensure_ascii=False, indent=1)
subprocess.check_call(['node', 'render.js', here, 'all', '--fresh', '--workers', '3'], cwd=engine)
film = os.path.join(here, 'renders', 'video.mp4')
fc = (f"[1:v]fps=60,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,trim=0:{D},setpts=PTS-STARTPTS,"
      f"drawbox=x=0:y=0:w=1080:h=600:color=black@0.38:t=fill[c];"
      f"[0:v]split[a][b];[a]trim=0:{D},setpts=PTS-STARTPTS,colorkey=0x000000:0.22:0.18[ov];"
      f"[c][ov]overlay=format=auto[m];[b]trim=start={D},setpts=PTS-STARTPTS[rest];[m][rest]concat=n=2:v=1:a=0[v]")
cmd = ['ffmpeg', '-y', '-v', 'error', '-i', film, '-i', a.clip]
maps = ['-map', '[v]']
if has_audio:
    fc += f";[1:a]atrim=0:{D},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a1];anullsrc=r=48000:cl=stereo,atrim=0:{total - D}[a2];[a1][a2]concat=n=2:v=0:a=1[aout]"
    maps += ['-map', '[aout]', '-c:a', 'aac', '-b:a', '192k']
cmd += ['-filter_complex', fc] + maps + ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '60', '-movflags', '+faststart', a.out]
subprocess.check_call(cmd)
print('تم:', a.out)
