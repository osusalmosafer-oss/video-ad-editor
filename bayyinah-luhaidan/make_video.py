#!/usr/bin/env python3
"""python3 make_video.py recitation.mp3 [out.mp4] [--timings t.json]
timings.json = [[start,end],...] لكل آية (ثوانٍ) — وإلا تُكتشف الفواصل تلقائياً من سكتات التلاوة."""
import sys,json,re,subprocess,os,tempfile,shutil,http.server,threading,functools
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__));FPS=24
a=[x for x in sys.argv[1:] if not x.startswith('--')];audio=a[0];out=a[1] if len(a)>1 else 'bayyinah-luhaidan.mp4'
dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',audio]))
if '--timings' in sys.argv: T=json.load(open(sys.argv[sys.argv.index('--timings')+1]))
else:
    log=subprocess.run(['ffmpeg','-i',audio,'-af','silencedetect=noise=-35dB:d=0.25','-f','null','-'],capture_output=True,text=True).stderr
    st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)];en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
    gaps=sorted(zip(st,en),key=lambda g:g[1]-g[0],reverse=True)
    inner=[g for g in gaps if 0.5<g[0]<dur-0.5][:7]
    if len(inner)<7: sys.exit(f'وجدت {len(inner)} فواصل فقط من 7 — مرّر --timings')
    cuts=sorted((g[0]+g[1])/2 for g in inner);b=[0]+cuts+[dur];T=[[b[i],b[i+1]] for i in range(8)]
    json.dump(T,open('timings.json','w'));print('timings.json',T)
fr=tempfile.mkdtemp()
h=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=HERE))
h.RequestHandlerClass.log_message=lambda *a:None;threading.Thread(target=h.serve_forever,daemon=True).start()
with sync_playwright() as p:
    pg=p.chromium.launch(executable_path=os.environ.get('CHROME','/opt/pw-browsers/chromium'),args=['--no-sandbox']).new_page(viewport={'width':1080,'height':1920})
    pg.goto(f'http://127.0.0.1:{h.server_port}/design.html');pg.wait_for_function('window.ready')
    n=int(dur*FPS)
    for f in range(n):
        t=f/FPS;i=next((k for k,(s,e) in enumerate(T) if t<e),7);s,e=T[i]
        pg.evaluate(f'setState({i},{min(1,max(0,(t-s)/(e-s)))},{t/dur})')
        pg.screenshot(path=f'{fr}/{f:06d}.jpg',type='jpeg',quality=92)
subprocess.run(['ffmpeg','-y','-v','error','-framerate',str(FPS),'-i',f'{fr}/%06d.jpg','-i',audio,'-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-c:a','aac','-b:a','192k','-shortest',out],check=True)
shutil.rmtree(fr);print('تم:',out)
