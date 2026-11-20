const fs = require('fs'); const r = (p) => fs.readFileSync(__dirname + '/' + p, 'utf8');
const css = r('../public/style.css'), app = r('../public/app.js').replace("navigator.serviceWorker.register('/sw.js').catch(() => {});", ''), mock = r('mock.js');
const html = `<title>تجربة نظام استلام التبرعات</title>
<style>
${css}
html{background:#f4f7f6}
.demobar{background:#1f2d2b;color:#fff;padding:.5rem 1rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;font-size:.85rem;padding-right:max(16px,env(safe-area-inset-right,0px));padding-left:max(16px,env(safe-area-inset-left,0px))}
.demobar b{flex:1 1 100%}.demobar button{flex:1;min-height:42px;border-radius:10px;border:2px solid #7fc4bd;background:transparent;color:#fff;font-weight:700;cursor:pointer;font-family:inherit}
.demobar button.on{background:#2f7f79;border-color:#2f7f79}
.demobar .pill{background:#c0392b;border-radius:9px;padding:0 6px;font-size:.75rem;margin-inline-start:.3rem}
.frame{max-width:520px;margin:0 auto;background:var(--bg);min-height:80vh;position:relative}
.frame .nav{position:sticky;bottom:0}
</style>
<div class="demobar"><b>نسخة تجريبية تعمل بالكامل داخل الصفحة (البيانات تعود لوضعها الأول عند إعادة التحميل)</b>
<button id="rEmp" class="on">👤 حساب الموظف</button><button id="rDrv">🚚 حساب السائق <span id="pend" class="pill hidden"></span></button></div>
<div class="frame"><div id="app"><div class="splash">جارٍ التحميل…</div></div></div>
<div id="toasts" aria-live="polite"></div>
<script>${mock}<\/script>
<script>${app}<\/script>
<script>
(function(){
  const bE=document.getElementById('rEmp'), bD=document.getElementById('rDrv'), pend=document.getElementById('pend');
  function upd(){ const n=MOCK.notifs.filter(x=>!x.is_read&&x.user_id===(MOCK.uid===1?2:1)).length; pend.textContent=n; pend.classList.toggle('hidden',!n); }
  window.MOCK_onNotify=upd;
  function sw(id){ if(MOCK.uid===id) return; MOCK.uid=id; closeStream(); me=null; location.hash=''; bE.classList.toggle('on',id===1); bD.classList.toggle('on',id===2); boot(); upd(); }
  bE.onclick=()=>sw(1); bD.onclick=()=>sw(2);
  document.querySelector('.demobar b').insertAdjacentHTML('afterend','');
})();
<\/script>`;
fs.writeFileSync(process.argv[2], html);
