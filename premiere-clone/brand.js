'use strict';
/* ============ نمط أسس المسافر (مأخوذ من تصميم المالك): شعار + كابشن نظيف مقطّع + بطاقة زجاجية ============ */
const ASAS_KEY = 'vedit-asas';
const ASAS = Object.assign({bug:'assets/asas/bug.png', wa:'assets/asas/wa.png', phone:'+966 56 640 3938', title:'للحجز والإستفسار', offer:'', bottom:'الرابط في البايو', blue:'#2884FF'},
  (() => { try { return JSON.parse(localStorage.getItem(ASAS_KEY) || '{}'); } catch (_) { return {}; } })());
const saveAsas = () => { try { localStorage.setItem(ASAS_KEY, JSON.stringify({phone:ASAS.phone, offer:ASAS.offer, title:ASAS.title, bottom:ASAS.bottom})); } catch (_) {} };

function assetMedia(url, name){
  let m = S.media.find(x => x.url === url);
  if (!m){ m = {id:'m' + uid++, name, type:'image', url, dur:5, thumb:url, w:0, h:0}; S.media.push(m); const im = new Image(); im.onload = () => { m.w = im.naturalWidth; m.h = im.naturalHeight; renderMedia(); }; im.src = url; }
  return m;
}
const imgClip = (m, tr, start, dur, p) => { const c = mk('image', tr, start, dur, {fit:'contain', ...p}); c.mediaId = m.id; return c; };
const isBrandCaption = c => c.type === 'text' && !c.p.counter && c.p.y >= 60 && !c._card;

/* كابشن نظيف: أبيض عريض بلا خلفية، ظل خفيف، مقاطع قصيرة (≤ n كلمات) */
function cleanCaptionStyle(c){
  Object.assign(c.p, {bg:false, hl:'none', color:'#ffffff', strokeW:0, glow:0, grad:false, shadow:60, shadowColor:'#000000', size:5.5, weight:'900', y:70, align:'center', aIn:'none', aOut:'none', fadeIn:.05, fadeOut:.05});
}
function chunkCaptions(n = 3){
  const caps = S.clips.filter(isBrandCaption).sort((a, b) => a.start - b.start), out = [];
  for (const c of caps){
    const words = c.p.text.replace(/\s*\n\s*/g, ' ').trim().split(/\s+/);
    if (words.length <= n){ out.push(c); continue; }
    const parts = Math.ceil(words.length / n), base = Math.floor(words.length / parts), extra = words.length % parts, groups = []; let k = 0;   // توزيع متوازن: 7 كلمات = 3+2+2
    for (let i = 0; i < parts; i++){ const sz = base + (i < extra ? 1 : 0); groups.push(words.slice(k, k + sz).join(' ')); k += sz; }
    const total_ = groups.reduce((a, g) => a + g.length, 0); let cum = 0;
    for (const g of groups){
      const s0 = c.start + c.dur * cum / total_, d = c.dur * g.length / total_; cum += g.length;
      const nc = clone(c); nc.id = newId(); nc.start = s0; nc.dur = d; nc.p.text = g; delete nc.kf; out.push(nc);
    }
    S.clips = S.clips.filter(x => x !== c);
  }
  S.clips.push(...out.filter(c => !S.clips.includes(c)));
}

/* شعار أسس في الزاوية (مربع أبيض مستدير) */
function addBugClip(from, to){
  const m = assetMedia(ASAS.bug, 'شعار أسس');
  const c = imgClip(m, topGfx(), from, Math.max(.5, to - from), {scale:17, x:32, y:-43, aIn:'pop', aInDur:.45, fadeOut:.3, shadow:30});
  c._bug = true; return c;
}

/* بطاقة ختامية زجاجية: طمس الخلفية، شعار كبير، «للحجز والإستفسار»، واتساب، العرض حتى… */
function addEndCard(T, dur = 3.4){
  const s = Math.max(0, T - dur), d = T - s, g1 = topGfx(), g2 = topGfx(), g3 = topGfx(), tag = c => { c._card = true; return c; };
  tag(mk('adjust', g1, s, d, {look:'none', blur:0, brightness:70, vignette:0, grain:0, opacity:100, fadeIn:.4}));      // تعتيم فقط؛ الطمس داخل الزجاج
  tag(mk('shape', g2, s + .08, d - .08, {shape:'rect', x:50, y:50, w:82, h:27, fill:'#ffffff', fillA:20, glass:true, glassBlur:45, radius:22, stroke:'#ffffff', strokeW:.2, aIn:'slideU', aInDur:.5, fadeIn:.2}));
  tag(mk('shape', g2, s + .2, d - .2, {shape:'rect', x:50, y:36.9, w:12, h:.55, fill:ASAS.blue, radius:100, aIn:'wipeR', aInDur:.4}));
  tag(mk('text', g3, s + .25, d - .25, {text:ASAS.title, size:7, y:42.3, strokeW:0, shadow:35, aIn:'fade', aInDur:.4, fadeIn:0}));
  tag(mk('shape', g2, s + .3, d - .3, {shape:'line', x:50, y:46.4, w:68, h:.12, fill:'#ffffff', fillA:45, aIn:'wipeR', aInDur:.4}));
  tag(imgClip(assetMedia(ASAS.wa, 'واتساب'), g3, s + .35, d - .35, {scale:10.5, x:-27.6, y:2, aIn:'pop', aInDur:.4, fadeIn:0}));
  tag(mk('text', g3, s + .35, d - .35, {text:ASAS.phone, size:7.3, x:56, y:52, strokeW:0, shadow:20, aIn:'fade', aInDur:.4, fadeIn:0}));
  if (ASAS.offer) tag(mk('text', g3, s + .45, d - .45, {text:'العرض حتى ' + ASAS.offer, size:3.7, weight:'700', y:59.9, strokeW:0, shadow:20, aIn:'fade', aInDur:.4, fadeIn:0}));
  tag(imgClip(assetMedia(ASAS.bug, 'شعار أسس'), g3, s + .1, d - .1, {scale:30, x:0, y:-24.3, opacity:94, aIn:'pop', aInDur:.55, fadeIn:0, shadow:35}));
  const lastCap = Math.max(s, ...S.clips.filter(c => isBrandCaption(c) && c.start < T).map(c => c.start + c.dur));
  if (ASAS.bottom && lastCap < T - .3){ const t = mk('text', g3, Math.min(lastCap, T - .4), T - Math.min(lastCap, T - .4), {text:ASAS.bottom}); cleanCaptionStyle(t); tag(t); }
}

/* تطبيق النمط على المشروع الحالي */
function applyAsasStyle(o = {}){
  if (!S.clips.length) return;
  const T0 = total();
  if (o.clean){                                           // نمط نظيف مثل تصميمك: بلا وسوم ولا عدّاد ولا شريط تقدّم
    S.clips = S.clips.filter(c => !(c.type === 'shape' && c.p.shape === 'bar') && !(c.type === 'text' && (c.p.counter || (c.p.y < 30 && c.p.color === '#ffd23f'))));
  }
  chunkCaptions(o.chunk || 3);
  for (const c of S.clips.filter(isBrandCaption)) cleanCaptionStyle(c);
  const dur = Math.min(3.4, T0 * .5);
  if (o.bug !== false && !S.clips.some(c => c._bug)) addBugClip(0, T0 - dur);
  if (o.card !== false && !S.clips.some(c => c._card)) addEndCard(T0, dur);
  S.sel = null; S.multi.clear(); syncEls(); commit(); seek(0);
}

/* نسخة فيسبوك: بلا بطاقة الرقم (قرار المالك: لا هاتف ولا واتساب في فيسبوك) */
function tNoCard(){
  const cards = S.clips.filter(c => c._card); if (!cards.length) return;
  const s = Math.min(...cards.map(c => c.start)), T = total();
  S.clips = S.clips.filter(c => !c._card);
  const t = mk('text', topGfx(), s, T - s, {text:'للاستفسار والحجز راسلنا على الخاص 🤍'}); cleanCaptionStyle(t);
}

/* ---------- واجهة: قسم «نمط أسس» أعلى تبويب القوالب ---------- */
(function buildBrandUi(){
  const t3 = $('#t3'); if (!t3) return;
  const box = document.createElement('div');
  box.innerHTML = `<div class="sec">🎨 نمط أسس المسافر (من تصميمك)</div>
  <p style="color:var(--mut);font-size:12px;margin:0 0 6px">كابشن أبيض نظيف مقطّع، شعار في الزاوية، وبطاقة ختامية زجاجية. يُطبَّق على المشروع الحالي ويمكنك التراجع.</p>
  <div class="fld"><label>عنوان البطاقة</label><input type="text" id="bdTitle" value="${ASAS.title}"></div>
  <div class="fld"><label>رقم الواتساب (لا يُستخدم في فيسبوك)</label><input type="text" id="bdPhone" value="${ASAS.phone}"></div>
  <div class="fld"><label>«العرض حتى» (اتركه فارغاً لعدم إظهاره)</label><input type="text" id="bdOffer" value="${ASAS.offer}" placeholder="مثال: 15/12"></div>
  <div class="fld"><label>سطر الختام تحت البطاقة</label><input type="text" id="bdBottom" value="${ASAS.bottom}"></div>
  <div class="fld"><label><input type="checkbox" id="bdClean" checked> نظّف: احذف الوسوم والعدّاد وشريط التقدّم</label></div>
  <button id="bdApply" class="pri" style="width:100%">🎨 طبّق نمط أسس على المشروع</button>
  <div class="grid" style="grid-template-columns:repeat(2,1fr);margin-top:6px"><button id="bdBug">شعار الزاوية فقط</button><button id="bdCard">البطاقة الختامية فقط</button></div><hr style="border-color:var(--line)">`;
  box.addEventListener('click', e => e.stopPropagation());
  t3.insertBefore(box, t3.firstChild);
  const read = () => { ASAS.title = $('#bdTitle').value; ASAS.phone = $('#bdPhone').value; ASAS.offer = $('#bdOffer').value.trim(); ASAS.bottom = $('#bdBottom').value; saveAsas(); };
  ['#bdTitle', '#bdPhone', '#bdOffer', '#bdBottom'].forEach(id => $(id).addEventListener('input', read));
  $('#bdApply').onclick = () => { read(); applyAsasStyle({clean:$('#bdClean').checked}); };
  $('#bdBug').onclick = () => { read(); addBugClip(0, Math.max(1, total())); S.sel = null; syncEls(); commit(); };
  $('#bdCard').onclick = () => { read(); addEndCard(Math.max(3.4, total())); S.sel = null; syncEls(); commit(); };
})();
