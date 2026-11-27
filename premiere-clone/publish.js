'use strict';
/* ============ حزمة النشر لكل منصة (عنوان/نص/موعد مختلف لكل منصة) + ملف publish_manifest.json ============ */
// قواعد منصات تقريبية ومحافظة — راجعها دائماً قبل النشر لأنها تتغيّر.
const PLATFORMS = {
  youtube:   {n:'يوتيوب Shorts',  icon:'▶️', titleMax:100, textMax:5000, durMax:180, route:'Metricool'},
  tiktok:    {n:'تيك توك',        icon:'🎵', textMax:2200, durMax:600, route:'Metricool'},
  instagram: {n:'إنستجرام Reels', icon:'📸', textMax:2200, durMax:900, tagMax:30, soft:90, route:'Windsor'},
  facebook:  {n:'فيسبوك Reels',   icon:'📘', textMax:2200, durMax:90,  route:'غير متصل حالياً'},
};
// صياغات العناوين تختلف بزاوية كل منصة (لا تحتوي أسعاراً ولا وعوداً)
const HEADLINES = {
  youtube:   ['{t} | جولة سريعة', '{t} — شاهد قبل الحجز', 'كل ما تحتاج معرفته عن {t}'],
  tiktok:    ['{t} 👀', 'شوف بنفسك: {t} 🕋', 'وش رأيك في {t}؟'],
  instagram: ['{t} 🕋', '{t} ✨', 'من قلب مكة: {t} 🤍'],
  facebook:  ['{t}', 'نشارككم: {t}', '{t} — تفاصيل أكثر على الخاص'],
};
const PUB_KEY = 'vedit-pub';
const pubDefault = () => ({topic:'', details:'', confirmPrice:false, file:'', platforms:{
  youtube:   {on:true,  hi:0, title:'', text:'', cta:'للحجز والاستفسار: [رابط الحجز]', tags:'#Shorts #مكة #العمرة', when:''},
  tiktok:    {on:true,  hi:0, title:'', text:'', cta:'للحجز والاستفسار: الرابط في البايو 🔗', tags:'#مكة #عمرة #فنادق_مكة #أسس_المسافر', when:''},
  instagram: {on:true,  hi:0, title:'', text:'', cta:'للحجز والاستفسار: الرابط في البايو 🔗', tags:'#مكة #العمرة #فنادق_مكة #أسس_المسافر', when:''},
  facebook:  {on:false, hi:0, title:'', text:'', cta:'للاستفسار والحجز راسلنا على الخاص 🤍', tags:'', when:''},
}});
let PUB = (() => { try { const d = JSON.parse(localStorage.getItem(PUB_KEY) || 'null'), b = pubDefault(); return d ? {...b, ...d, platforms:Object.fromEntries(Object.keys(b.platforms).map(k => [k, {...b.platforms[k], ...(d.platforms || {})[k]}]))} : b; } catch (_) { return pubDefault(); } })();
const savePub = () => { try { localStorage.setItem(PUB_KEY, JSON.stringify(PUB)); } catch (_) {} };

/* ---------- نصوص الفيديو (للكشف عن الأسعار وللتفاصيل) ---------- */
const PRICE_RE = /(\d[\d,٬.٠-٩]*)\s*(ريال|ر\.?\s?س|SAR|دولار|\$|﷼)/i;
function videoTexts(){
  return S.clips.filter(c => c.type === 'text' && c.p.text !== undefined).map(c => c.p.counter ? (c.p.cPrefix + c.p.cTo + c.p.cSuffix) : c.p.text);
}
function priceMentions(extra){
  const hits = new Set();
  for (const t of [...videoTexts(), ...(extra || [])]){ const m = String(t).match(PRICE_RE); if (m) hits.add(m[0].trim()); }
  return [...hits];
}
function captionLines(n = 3){
  const c = S.clips.filter(x => x.type === 'text' && !x.p.counter && x.p.y >= 60 && x.p.text.trim()).sort((a, b) => a.start - b.start);
  const seen = new Set(), out = [];
  for (const x of c){ const t = x.p.text.replace(/\s*\n\s*/g, ' ').trim(); if (!seen.has(t)){ seen.add(t); out.push(t); } if (out.length >= n) break; }
  return out;
}

/* ---------- توليد النصوص ---------- */
function tagList(s){ return (s || '').split(/[\s,،]+/).map(x => x.trim()).filter(Boolean).map(x => x.startsWith('#') ? x : '#' + x); }
function genPlatform(pid){
  const p = PUB.platforms[pid], t = PUB.topic.trim() || '[موضوع الفيديو]', tpl = HEADLINES[pid][p.hi % HEADLINES[pid].length];
  let head = tpl.replace('{t}', t);
  if (pid === 'youtube'){ p.title = head.slice(0, PLATFORMS.youtube.titleMax); head = t; }
  else p.title = head;
  const parts = [pid === 'youtube' ? head : p.title];
  if (PUB.details.trim()) parts.push(PUB.details.trim());
  if (p.cta.trim()) parts.push(p.cta.trim());
  const tags = tagList(p.tags).join(' '); if (tags) parts.push(tags);
  p.text = parts.join('\n\n');
}

/* ---------- الفحوصات ---------- */
function validate(pid){
  const p = PUB.platforms[pid], P = PLATFORMS[pid], blockers = [], warns = [], T = total();
  if (!p.on) return {blockers, warns};
  if (T > P.durMax) blockers.push(`مدة الفيديو ${T.toFixed(0)} ث أطول من حد المنصة (${P.durMax} ث)`);
  else if (P.soft && T > P.soft) warns.push(`المدة أطول من ${P.soft} ث — الأقصر أفضل للوصول`);
  if (S.aspect !== '9:16') warns.push('المقاس ليس 9:16 — المنصات العمودية تفضّله');
  if (pid === 'youtube'){ if (!p.title.trim()) blockers.push('عنوان يوتيوب فارغ'); if (p.title.length > P.titleMax) blockers.push(`العنوان ${p.title.length} حرفاً (الحد ${P.titleMax})`); }
  if (!p.text.trim() && pid !== 'instagram') blockers.push('نص المنشور فارغ');
  if (p.text.length > P.textMax) blockers.push(`النص ${p.text.length} حرفاً (الحد ${P.textMax})`);
  if (/\[[^\]]+\]/.test(p.title + p.text)) blockers.push('يوجد نص بين [ ] لم يُستبدل (مثل [رابط الحجز] أو [موضوع الفيديو])');
  if (P.tagMax && tagList(p.text.match(/#\S+/g) ? p.text.match(/#\S+/g).join(' ') : '').length > P.tagMax) blockers.push(`الهاشتاقات أكثر من ${P.tagMax}`);
  if (pid === 'facebook' && /wa\.me|whatsapp|واتس|\+?966[\s\d-]{7,}|\b05\d{8}\b/i.test(p.title + p.text)) blockers.push('سياسة فيسبوك (قرار المالك): لا رقم هاتف ولا رابط واتساب — وجّه للخاص');
  if (/مكارم/.test(p.title + p.text + videoTexts().join(' '))) warns.push('تنبيه: سكل الوكالة يقول لا نروّج لفندق مكارم أجياد');
  if (p.when && new Date(p.when).getTime() < Date.now() + 60000) blockers.push('موعد النشر في الماضي');
  return {blockers, warns};
}
function globalChecks(){
  const prices = priceMentions(Object.values(PUB.platforms).filter(p => p.on).map(p => p.title + ' ' + p.text)), blockers = [], warns = [];
  if (prices.length){ (PUB.confirmPrice ? warns : blockers).push(`يُذكر سعر في الفيديو أو النص: «${prices.join('» «')}» — ${PUB.confirmPrice ? 'أكّده المالك' : 'أكّد صحته وصلاحيته (سكل الوكالة: لا أسعار غير مؤكدة)'}`); }
  return {blockers, warns, prices};
}

/* ---------- ملف الحزمة ---------- */
function buildManifest(){
  const g = globalChecks(), [w, h] = canvasSize();
  const plats = {};
  for (const [pid, p] of Object.entries(PUB.platforms)){
    const base = {enabled:p.on, text:p.text, hashtags:tagList(p.text.match(/#\S+/g) ? p.text.match(/#\S+/g).join(' ') : ''), scheduleLocal:p.when || null, scheduleTimezone:'Asia/Riyadh', ownerApproved:false};
    if (pid === 'youtube') plats[pid] = {...base, type:'short', title:p.title, description:p.text, privacy:null, madeForKids:null};
    else if (pid === 'tiktok') plats[pid] = {...base, title:p.title, caption:p.text, privacy:null, disableComment:null};
    else if (pid === 'instagram') plats[pid] = {...base, type:'REEL', caption:p.text, shareToFeed:null};
    else plats[pid] = {...base, type:'REEL', caption:p.text, note:'فيسبوك: لا رقم ولا رابط واتساب؛ التوجيه للخاص'};
  }
  return {schema:'asas-publish/1', brand:'أسس المسافر', createdAt:new Date().toISOString(), requiresOwnerApproval:true,
    video:{file:PUB.file || window.lastExportFile || 'video.mp4', durationSec:+total().toFixed(2), aspect:S.aspect, width:w, height:h},
    checks:{priceMentions:g.prices, priceConfirmedByOwner:!!PUB.confirmPrice, blockers:g.blockers.concat(...Object.keys(PUB.platforms).map(k => validate(k).blockers.map(b => `${k}: ${b}`)))},
    platforms:plats};
}
function manifestTxt(){
  return Object.entries(PUB.platforms).filter(([, p]) => p.on).map(([pid, p]) => `===== ${PLATFORMS[pid].n} =====\n${pid === 'youtube' ? 'العنوان: ' + p.title + '\n\n' : ''}${p.text}\n${p.when ? '\nالموعد: ' + p.when : ''}`).join('\n\n');
}

/* ---------- الواجهة ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function renderPublish(box){
  if (!box) return;
  const g = globalChecks();
  let h = `<div class="sec">🌐 حزمة النشر لكل منصة</div>
  <p style="color:var(--mut);font-size:12px;margin:0 0 6px">عنوان ونص وموعد مختلف لكل منصة. لا يُنشر شيء من هنا: تصدّر الحزمة ثم يتولى سكل «asas-publisher» النشر بعد موافقتك.</p>
  <div class="fld"><label>موضوع الفيديو (بكلماتك)</label><input type="text" id="pbTopic" value="${esc(PUB.topic)}" placeholder="مثال: فندق قريب من الحرم بإطلالة"></div>
  <div class="fld"><label>تفاصيل مشتركة (اختياري — لا أسعار إلا بعد تأكيدك)</label><textarea id="pbDet" rows="3">${esc(PUB.details)}</textarea></div>
  <div style="display:flex;gap:6px;margin-bottom:6px"><button id="pbCap">⇩ من الكابشن</button><button id="pbGenAll" class="pri" style="flex:1">✨ ولّد لكل المنصات</button></div>`;
  for (const [pid, P] of Object.entries(PLATFORMS)){
    const p = PUB.platforms[pid], v = validate(pid);
    h += `<details data-pid="${pid}" ${p.on ? 'open' : ''}><summary>${P.icon} ${P.n} <span style="color:var(--mut);font-weight:400">· ${P.route}</span></summary>
      <div class="fld"><label><span><input type="checkbox" data-f="on" ${p.on ? 'checked' : ''}> انشر هنا</span><button data-gen style="padding:0 6px">🔄 صياغة أخرى</button></label></div>
      ${pid === 'youtube' ? `<div class="fld"><label><span>العنوان</span><b>${p.title.length}/${P.titleMax}</b></label><input type="text" data-f="title" value="${esc(p.title)}"></div>` : ''}
      <div class="fld"><label><span>${pid === 'youtube' ? 'الوصف' : 'النص'}</span><b>${p.text.length}/${P.textMax}</b></label><textarea data-f="text" rows="6">${esc(p.text)}</textarea></div>
      <div class="fld"><label>الدعوة للتواصل (CTA)</label><input type="text" data-f="cta" value="${esc(p.cta)}"></div>
      <div class="fld"><label>الهاشتاقات</label><input type="text" data-f="tags" value="${esc(p.tags)}"></div>
      <div class="fld"><label>موعد النشر (توقيت الرياض — فارغ = بعد موافقتك)</label><input type="datetime-local" data-f="when" value="${esc(p.when)}"></div>
      <div style="display:flex;gap:6px"><button data-copy>نسخ النص</button></div>
      ${v.blockers.map(b => `<div style="color:var(--red);font-size:12px;margin-top:4px">⛔ ${esc(b)}</div>`).join('')}${v.warns.map(b => `<div style="color:var(--gold);font-size:12px;margin-top:4px">⚠ ${esc(b)}</div>`).join('')}
    </details>`;
  }
  h += `<div class="sec">فحوصات عامة</div>`;
  h += g.blockers.map(b => `<div style="color:var(--red);font-size:12px">⛔ ${esc(b)}</div>`).join('') + g.warns.map(b => `<div style="color:var(--gold);font-size:12px">⚠ ${esc(b)}</div>`).join('') || '';
  if (g.prices.length) h += `<div class="fld"><label><span><input type="checkbox" id="pbPrice" ${PUB.confirmPrice ? 'checked' : ''}> أؤكد أن السعر المذكور صحيح وساري</span></label></div>`;
  h += `<div class="fld"><label>اسم ملف الفيديو في الحزمة</label><input type="text" id="pbFile" value="${esc(PUB.file)}" placeholder="مثال: asas_ad_v1.mp4"></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap"><button id="pbJson" class="pri" style="flex:1">⬇ حزمة النشر (JSON)</button><button id="pbTxt">📄 النصوص</button></div>
  <button id="pbVid" style="width:100%;margin-top:6px">🎬 صدّر الفيديو ثم الحزمة</button>
  <div id="pbSt" style="min-height:20px;margin:8px 0;font-size:12px;color:var(--acc2)"></div>`;
  const holder = document.createElement('div'); holder.id = 'pubBox'; holder.innerHTML = h;
  const old = $('#pubBox'); if (old) old.remove(); box.appendChild(holder);
  const st = t => { const e = $('#pbSt'); if (e) e.textContent = t; };
  const refresh2 = () => { savePub(); renderPublish(box); };
  $('#pbTopic').oninput = e => { PUB.topic = e.target.value; savePub(); };
  $('#pbDet').oninput = e => { PUB.details = e.target.value; savePub(); };
  $('#pbCap').onclick = () => { const l = captionLines(3); if (!l.length) return st('لا توجد نصوص كابشن في المشروع'); PUB.details = l.join('\n'); refresh2(); };
  $('#pbGenAll').onclick = () => { for (const pid of Object.keys(PLATFORMS)) genPlatform(pid); refresh2(); };
  $('#pbFile').oninput = e => { PUB.file = e.target.value; savePub(); };
  if ($('#pbPrice')) $('#pbPrice').onchange = e => { PUB.confirmPrice = e.target.checked; refresh2(); };
  holder.querySelectorAll('details[data-pid]').forEach(d => {
    const pid = d.dataset.pid, p = PUB.platforms[pid];
    d.querySelector('[data-gen]').onclick = ev => { ev.preventDefault(); p.hi++; genPlatform(pid); refresh2(); };
    d.querySelector('[data-copy]').onclick = () => navigator.clipboard && navigator.clipboard.writeText((pid === 'youtube' ? p.title + '\n\n' : '') + p.text).then(() => st('تم النسخ'));
    d.querySelectorAll('[data-f]').forEach(el => {
      const f = el.dataset.f;
      el.addEventListener(el.type === 'checkbox' || el.type === 'datetime-local' ? 'change' : 'input', () => { p[f] = el.type === 'checkbox' ? el.checked : el.value; savePub(); if (el.type === 'checkbox' || f === 'when') renderPublish(box); });
      if (el.tagName === 'TEXTAREA' || f === 'title') el.addEventListener('change', () => renderPublish(box));
    });
  });
  $('#pbJson').onclick = () => { const m = buildManifest(); dl(new Blob([JSON.stringify(m, null, 2)], {type:'application/json'}), 'publish_manifest.json'); st(m.checks.blockers.length ? `صُدِّرت الحزمة وفيها ${m.checks.blockers.length} ملاحظة تمنع النشر حتى تُعالج` : 'صُدِّرت الحزمة — سلّمها لسكل asas-publisher'); };
  $('#pbTxt').onclick = () => dl(new Blob([manifestTxt()], {type:'text/plain'}), 'publish_texts.txt');
  $('#pbVid').onclick = async () => { $('#pbVid').disabled = true; st('جارٍ تصدير الفيديو بزمن حقيقي…'); const ok = await startExport(PUB.file ? PUB.file.replace(/\.\w+$/, '') : 'asas_video'); $('#pbVid').disabled = false;
    if (!ok) return st('أُلغي التصدير'); if (!PUB.file) PUB.file = window.lastExportFile; savePub(); const m = buildManifest(); dl(new Blob([JSON.stringify(m, null, 2)], {type:'application/json'}), 'publish_manifest.json'); st('صُدِّر الفيديو والحزمة'); renderPublish(box); };
}
