// فحص دخان: يتأكد أن كل دوال الواجهة موجودة وأن الصفحة تُحمَّل بلا أخطاء.
// الاستعمال:  node tests/smoke.js   (يحتاج playwright، ويخدم المجلد على منفذ محلي)
const {chromium} = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css'};
const srv = http.createServer((q, r) => { const f = path.join(root, q.url === '/' ? 'index.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e){ r.writeHead(404); return r.end(); } r.writeHead(200, {'content-type':types[path.extname(f)] || 'text/plain'}); r.end(d); }); }).listen(0);
const FUNCS = ['speedRamp','rampDialog','addSticker','applyAdTpl','addFiles','addClip','addText','addShape','addFx','addAdjust','addEmoji','splitAt','delClip','dupClip','freezeFrame','importSrt','exportSrt','silenceDialog','removeSilence','detectBeats','transitionDialog','applyTransition','captionDialog','runWhisper','curveDialog','addMarker','startExport','renderInspector','renderTimeline','applyTemplate','transcribeClip','transcribeWords','translateClips','dubClips','renderRemix','exportPlans','buildCompilation','nameGroups','renderPublish','buildManifest','validate','applyProject','autosave','relink','toggleKf','bezierY','val','setVal'];
(async () => {
  const b = await chromium.launch(), p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`); await p.waitForTimeout(800);
  const missing = await p.evaluate(f => f.filter(n => { try { return typeof eval(n) !== 'function'; } catch (_) { return true; } }), FUNCS);
  await b.close(); srv.close();
  if (missing.length || errs.length){ console.error('FAIL', {missing, errs}); process.exit(1); }
  console.log('OK: كل الدوال موجودة ولا أخطاء عند التحميل');
})();
