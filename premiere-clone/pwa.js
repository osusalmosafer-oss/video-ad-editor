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

/* ============ الاستديو: زر يفتح معرض الجوال ويضيف الفيديو/الصور/الصوت ============ */
let fromGallery = false;
function openGallery(){ fromGallery = true; $('#file').click(); }
$('#bGallery').onclick = openGallery; $('#nGallery').onclick = openGallery;
$('#file').addEventListener('change', () => {
  if (!fromGallery) return; fromGallery = false;
  if (matchMedia('(max-width:820px)').matches){ $('#t1').hidden = false; document.querySelectorAll('#media .tabs button').forEach(b => b.classList.toggle('act', b.dataset.tab === 't1')); document.querySelectorAll('#media .tabc').forEach(t => t.hidden = t.id !== 't1'); if (!sheets.media.classList.contains('open')) toggleSheet('media'); }
});

/* ============ نسخة احتياطية: مشروعك + ما تعلّمه المستشار ============ */
const BK = 'vedit-lastbackup', isMobile = () => matchMedia('(max-width:820px)').matches;
const lsGet = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
function makeBackup(){
  return {app:'abu-backup', v:1, date:new Date().toISOString(), project:projectData(), learn:lsGet('vedit-learn'), baseline:lsGet('vedit-baseline')};
}
async function saveFile(blob, name){
  try {
    const f = new File([blob], name, {type:blob.type});
    if (navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:name}); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  dl(blob, name);
}
function backupDialog(){
  const last = lsGet(BK), when = last ? new Date(+last).toLocaleString('ar') : 'لم تُؤخذ بعد';
  dlg(`<b>🛟 نسخة احتياطية</b>
    <p style="font-size:13px;line-height:1.9">تحفظ: <b>تركيب المشروع</b> (المقاطع والنصوص والحركات) + <b>ما تعلّمه المستشار</b> من مقاطعك.<br>
    <span style="color:var(--mut)">لا تحفظ ملفات الفيديو نفسها؛ تبقى في استديو جهازك، وعند الاستعادة أضفها وستُربط تلقائياً بالاسم.</span></p>
    <p style="font-size:12px;color:var(--mut)">آخر نسخة: ${when}</p>
    <button class="pri" id="bkSave">⬇ حفظ نسخة الآن</button>
    <button id="bkRest">📂 استعادة من نسخة</button>
    <input type="file" id="bkFile" accept=".json,application/json" hidden>
    <button onclick="closeDlg()">إغلاق</button>`);
  $('#bkSave').onclick = async () => {
    const d = new Date(), name = `abu-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    await saveFile(new Blob([JSON.stringify(makeBackup())], {type:'application/json'}), name);
    try { localStorage.setItem(BK, String(Date.now())); } catch (_) {}
    closeDlg();
  };
  $('#bkRest').onclick = () => $('#bkFile').click();
  $('#bkFile').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text()); if (j.app !== 'abu-backup' || !j.project) throw 0;
      if (!confirm('ستحل هذه النسخة محل مشروعك الحالي. متابعة؟')) return;
      try { if (j.learn) localStorage.setItem('vedit-learn', j.learn); if (j.baseline) localStorage.setItem('vedit-baseline', j.baseline); } catch (_) {}
      const miss = applyProject(j.project); closeDlg();
      if (miss.length) setTimeout(() => alert('أضف هذه الملفات من الاستديو وستُربط تلقائياً:\n' + miss.join('\n')), 50);
    } catch (_) { alert('هذا ليس ملف نسخة احتياطية صالحاً'); }
    e.target.value = '';
  };
}
$('#bBackup').onclick = backupDialog;
/* تذكير لطيف بعد 7 أيام إن كان عندك مشروع */
setTimeout(() => { const l = +lsGet(BK) || 0; if (S.clips.length && Date.now() - l > 7 * 864e5 && !$('#bBackup').classList.contains('due')) $('#bBackup').classList.add('due'), $('#bBackup').textContent = '🛟 خذ نسخة ●'; }, 6000);

/* ============ التصدير على الجوال: تنبيه الدقة + إبقاء الشاشة مفتوحة + حفظ/مشاركة ============ */
const _startExport = startExport;
let wake = null, hiddenDuringExport = false;
async function keepAwake(){ try { if (navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); } catch (_) {} }
function releaseAwake(){ try { wake && wake.release(); } catch (_) {} wake = null; }
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.exporting) hiddenDuringExport = true;
  if (!document.hidden && S.exporting) keepAwake();
  if (!document.hidden && hiddenDuringExport && !S.exporting){ hiddenDuringExport = false; }
});
startExport = function(name){
  if (!isMobile()) return _startExport(name);
  const go = () => { hiddenDuringExport = false; keepAwake(); const p = _startExport(name); $('#ov p').textContent = 'ابقَ داخل التطبيق ولا تقفل الشاشة حتى ينتهي'; return Promise.resolve(p).then(r => { releaseAwake(); return r; }); };
  const long = total() > 90, hi = S.res >= 1080;
  if (!hi && !long) return go();
  return new Promise(res => {
    dlg(`<b>⚠ تصدير على الجوال</b>
      <p style="font-size:13px;line-height:1.9">${hi ? 'دقة 1080p ثقيلة وقد يتقطع التصدير أو يتوقف على بعض الجوالات.<br>' : ''}${long ? `المشروع طويل (${Math.round(total())} ثانية) والتصدير بزمن حقيقي، أي سينتظر بنفس المدة.<br>` : ''}ابقَ داخل التطبيق ولا تقفل الشاشة أثناء التصدير.</p>
      ${hi ? '<button class="pri" id="exLow">صدّر بدقة 720p (موصى به)</button>' : ''}
      <button ${hi ? '' : 'class="pri"'} id="exGo">${hi ? 'تابع بـ1080p' : 'ابدأ التصدير'}</button>
      <button id="exNo">إلغاء</button>`);
    if (hi) $('#exLow').onclick = () => { S.res = 720; $('#res').value = '720'; applyCanvas(); closeDlg(); res(go()); };
    $('#exGo').onclick = () => { closeDlg(); res(go()); };
    $('#exNo').onclick = () => { closeDlg(); res(false); };
  });
};
/* بعد انتهاء التصدير على الجوال: زر حفظ/مشاركة (للصور أو الملفات أو واتساب) بدل التنزيل الصامت */
window.onExportDone = (blob, name) => {
  if (!isMobile()){ dl(blob, name); return; }
  const mb = (blob.size / 1048576).toFixed(1);
  dlg(`<b>✅ انتهى التصدير</b>
    <p style="font-size:13px;line-height:1.9">${name} — ${mb} ميجابايت${hiddenDuringExport ? '<br><span style="color:#ffb44d">لاحظتُ أنك خرجت من التطبيق أثناء التصدير؛ إن وجدت الفيديو متقطعاً أعد التصدير وابقَ داخل التطبيق.</span>' : ''}</p>
    <button class="pri" id="exSave">💾 حفظ / مشاركة</button>
    <button onclick="closeDlg()">إغلاق</button>`);
  $('#exSave').onclick = async () => { await saveFile(blob, name); };
};
