import http.server,threading,functools,os
from playwright.sync_api import sync_playwright
H=os.path.dirname(os.path.abspath(__file__))
h=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=H));h.RequestHandlerClass.log_message=lambda *a:None
threading.Thread(target=h.serve_forever,daemon=True).start()
with sync_playwright() as p:
    pg=p.chromium.launch(executable_path=os.environ.get('CHROME','/opt/pw-browsers/chromium'),args=['--no-sandbox']).new_page(viewport={'width':1080,'height':1920});pg.goto(f'http://127.0.0.1:{h.server_port}/design.html');pg.wait_for_function('window.ready')
    pg.evaluate('setState(1,3,0.1,6)');pg.screenshot(path='design-preview.png')
