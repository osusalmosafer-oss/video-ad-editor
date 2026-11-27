'use strict';
/* ============ تثبيت التطبيق (PWA) + شريط التنقل على الجوال ============ */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register(window.SW_URL || 'sw.js').catch(() => {});
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let deferredInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (!isStandalone()) $('#bInstall').hidden = false; });
addEventListener('appinstalled', () => { $('#bInstall').hidden = true; deferredInstall = null; });
if (isIOS && !isStandalone()) $('#bInstall').hidden = false;
$('#bInstall').onclick = async () => {
  if (deferredInstall){ deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#bInstall').hidden = true; return; }
  dlg(`<b>📲 تثبيت «مونتاج أبو صهيب»</b>
    <p style="font-size:13px;line-height:1.9"><b>آيفون / آيباد (Safari):</b> اضغط زر المشاركة <b>⬆︎</b> ثم «إضافة إلى الشاشة الرئيسية».<br><b>أندرويد (Chrome):</b> القائمة ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».<br><b>الكمبيوتر (Chrome/Edge):</b> أيقونة التثبيت في شريط العنوان.</p>
    <p style="color:var(--mut);font-size:12px">يلزم فتح التطبيق من رابط https (استضافة)، لا من ملف على الجهاز.</p><button class="pri" onclick="closeDlg()">حسناً</button>`);
};
/* الجوال: لوحتا المكتبة والخصائص تُفتحان كورقة سفلية */
const sheets = {media:$('#media'), insp:$('#insp')};
function toggleSheet(k){ for (const [n, el] of Object.entries(sheets)) el.classList.toggle('open', n === k && !el.classList.contains('open')); document.querySelectorAll('#nav [data-sheet]').forEach(b => b.classList.toggle('on', sheets[b.dataset.sheet].classList.contains('open'))); }
document.querySelectorAll('#nav [data-sheet]').forEach(b => b.onclick = () => toggleSheet(b.dataset.sheet));
$('#nSplit').onclick = () => splitAt();
$('#nPlay').onclick = () => { S.playing ? pause() : play(); $('#nPlay').innerHTML = S.playing ? '⏸<span>إيقاف</span>' : '▶<span>تشغيل</span>'; };
$('#bPlay').addEventListener('click', () => { $('#nPlay').innerHTML = S.playing ? '⏸<span>إيقاف</span>' : '▶<span>تشغيل</span>'; });
/* اختيار مقطع على الجوال يفتح الخصائص تلقائياً */
document.addEventListener('pointerup', e => { if (matchMedia('(max-width:820px)').matches && e.target.closest && e.target.closest('.clip') && selClip() && !sheets.insp.classList.contains('open') && !sheets.media.classList.contains('open')) setTimeout(() => toggleSheet('insp'), 120); });

/* ============ تحديث التطبيق المثبَّت: يفحص version.json ويعرض زر «تحديث الآن» ============ */
(function(){
  const CUR = window.APP_VERSION; if (!CUR || !/^https?:$/.test(location.protocol)) return;
  let shown = false;
  function showUpdate(v){
    if (shown) return; shown = true;
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;top:8px;left:8px;right:8px;z-index:200;background:#2e2e6e;color:#fff;border:1px solid #7b61ff;border-radius:10px;padding:10px 12px;display:flex;gap:8px;align-items:center;box-shadow:0 8px 30px #000a;font-size:13px';
    d.innerHTML = '<span style="flex:1">🔄 يتوفر تحديث جديد للتطبيق</span><button id="updNow" class="pri" style="padding:5px 12px">تحديث الآن</button><button id="updLater" style="padding:5px 10px">لاحقاً</button>';
    document.body.appendChild(d);
    d.querySelector('#updLater').onclick = () => { d.remove(); setTimeout(() => { shown = false; }, 10 * 60e3); };
    d.querySelector('#updNow').onclick = async () => { try { for (const k of await caches.keys()) await caches.delete(k); const rg = await navigator.serviceWorker.getRegistration(); if (rg) await rg.update(); } catch (_) {} location.reload(); };
  }
  async function check(){ try { const r = await fetch('version.json?t=' + Date.now(), {cache:'no-store'}); const v = (await r.json()).version; if (v && v !== CUR) showUpdate(v); } catch (_) {} }
  setTimeout(check, 4000); setInterval(check, 30 * 60e3); document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
