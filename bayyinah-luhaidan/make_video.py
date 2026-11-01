#!/usr/bin/env python3
"""python3 make_video.py recitation.mp3 [out.mp4] [--timings t.json]
يحتاج timings.json وwords.json (python3 align.py recitation.mp3)."""
import sys,json,re,subprocess,os,tempfile,shutil,http.server,threading,functools
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__));FPS=24
a=[x for x in sys.argv[1:] if not x.startswith('--')];audio=a[0];out=a[1] if len(a)>1 else 'bayyinah-luhaidan.mp4'
dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',audio]))
Wd=json.load(open('words.json'));SEG=[Wd['basmala']]+Wd['ayahs']   # 9 مقاطع: البسملة + 8 آيات
TS=json.load(open('timings.json'));ST=[TS['basmala'][0]]+[x[0] for x in TS['ayahs']]
fr=tempfile.mkdtemp()
h=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=HERE))
h.RequestHandlerClass.log_message=lambda *a:None;threading.Thread(target=h.serve_forever,daemon=True).start()
with sync_playwright() as p:
    pg=p.chromium.launch(executable_path=os.environ.get('CHROME','/opt/pw-browsers/chromium'),args=['--no-sandbox']).new_page(viewport={'width':1080,'height':1920})
    pg.goto(f'http://127.0.0.1:{h.server_port}/design.html');pg.wait_for_function('window.ready')
    n=int(dur*FPS)
    for f in range(n):
        t=f/FPS;i=0
        for k in range(9):
            if t>=ST[k]-0.05:i=k
        ws=SEG[i];w=-1
        for k,(s,e) in enumerate(ws):
            if t>=s:w=k
        if t>=ws[-1][1]:w=99 if i>=0 and t>ws[-1][1]+0.0 else w
        pg.evaluate(f'setState({i},{w},{t/dur},{t})')
        pg.screenshot(path=f'{fr}/{f:06d}.jpg',type='jpeg',quality=92)
subprocess.run(['ffmpeg','-y','-v','error','-framerate',str(FPS),'-i',f'{fr}/%06d.jpg','-i',audio,'-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-c:a','aac','-b:a','192k','-shortest',out],check=True)
shutil.rmtree(fr);print('تم:',out)
