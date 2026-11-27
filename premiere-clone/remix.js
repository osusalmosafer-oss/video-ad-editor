'use strict';
/* ============ إعادة النشر: متغيّرات، مكتبة ناجح، دمج المتشابه بالاسم ============ */
const clone = o => JSON.parse(JSON.stringify(o));
const newId = () => 'c' + uid++;
const isMediaClip = c => c.type === 'video' || c.type === 'audio';

/* ---------- أدوات تحويل المشروع ---------- */
// قصّ نطاق زمني [a,b] من كل المسارات كنسخ تبدأ من 0 (لاستخدامه كافتتاحية)
function extractRange(a, b){
  const out = [];
  for (const c of S.clips){
    if (c.type === 'shape' && c.p.shape === 'bar') continue;
    const e0 = c.start + c.dur; if (c.start >= b || e0 <= a) continue;
    const s = Math.max(a, c.start), e = Math.min(b, e0), n = clone(c), sp = c.p.speed || 1;
    n.id = newId(); n.start = s - a; n.dur = e - s; delete n.kf;
    if (c.type === 'video' || c.type === 'audio' || c.type === 'image') n.in = c.in + (s - c.start) * sp;
    n.p.aIn = 'none'; n.p.aOut = 'none'; n.p.fadeIn = 0; n.p.fadeOut = 0; out.push(n);
  }
  return out;
}
// أفضل نافذة طاقة صوتية داخل مقاطع الفيديو (لافتتاحية مشوّقة)
function bestHookWindow(len){
  let best = null;
  for (const c of S.clips){
    if (c.type !== 'video') continue; const m = mediaOf(c); if (!m || !m.peaks) continue;
    const sp = c.p.speed || 1, a0 = Math.floor(c.in * PPS), a1 = Math.min(m.peaks.length, Math.floor((c.in + c.dur * sp) * PPS)), w = Math.floor(len * sp * PPS);
    if (a1 - a0 < w) continue;
    let sum = 0; for (let i = a0; i < a0 + w; i++) sum += m.peaks[i];
    for (let i = a0; i + w < a1; i += 10){
      if (i > a0){ sum = 0; for (let j = i; j < i + w; j++) sum += m.peaks[j]; }
      if (!best || sum > best.sum) best = {sum, t:c.start + (i / PPS - c.in) / sp};
    }
  }
  return best ? best.t : 0;
}
const topGfx = () => { addTrack('gfx', true); return TRACKS[0].id; };

const tHook = text => () => {
  const T = total(), len = Math.min(2.6, Math.max(1.4, T * .1)), a = bestHookWindow(len), piece = extractRange(a, a + len);
  for (const c of S.clips) c.start += len;
  S.markers = S.markers.map(m => ({...m, t:m.t + len}));
  S.clips.push(...piece);
  const first = piece.find(c => c.type === 'video'); if (first){ first.p.aIn = 'zoomIn'; first.p.aInDur = .35; }
  mk('text', topGfx(), 0, len, {text:text || '🔥 شاهد حتى النهاية', size:8, y:22, color:'#ffd23f', bg:true, bgOp:70, strokeW:0, aIn:'pop', aInDur:.4, aLoop:'pulse', aLoopAmt:40, fadeOut:.15});
};
const tScale = f => () => {
  for (const c of S.clips){
    c.start /= f; c.dur /= f; if (isMediaClip(c)) c.p.speed = (c.p.speed || 1) * f;
    if (c.kf) for (const k in c.kf) c.kf[k] = c.kf[k].map(x => ({...x, t:x.t / f}));
  }
  S.markers = S.markers.map(m => ({...m, t:m.t / f}));
};
const tLook = look => () => {
  let adj = S.clips.find(c => c.type === 'adjust' && c._remix);
  if (!adj){ adj = mk('adjust', topGfx(), 0, total(), {vignette:20, grain:6, opacity:75}); adj._remix = true; }
  adj.p.look = look; adj.dur = total();
};
const CAP_STYLES = [
  {hlColor:'#ffd23f', bgColor:'#000000', bgOp:60, bg:true, strokeW:0, hl:'karaoke'},
  {bg:false, strokeW:5, stroke:'#000000', glow:55, glowColor:'#00d1b2', hl:'karaoke', hlColor:'#5ff5dc', color:'#ffffff'},
  {bg:true, bgColor:'#7b61ff', bgOp:92, strokeW:0, hl:'karaoke', hlColor:'#ffffff', color:'#ddd6ff'},
  {bg:false, hl:'none', strokeW:7, stroke:'#000000', color:'#ffffff', glow:0},
];
const captionClips = () => S.clips.filter(c => c.type === 'text' && !c.p.counter && c.p.y >= 60 && (c.p.bg || c.p.hl !== 'none'));
const tCaption = i => () => { for (const c of captionClips()) Object.assign(c.p, CAP_STYLES[i % CAP_STYLES.length]); };
const tAspect = a => () => {
  const old = S.aspect, wide = a === '16:9'; S.aspect = a; const sel = $('#aspect'); if (sel) sel.value = a;
  for (const c of S.clips){
    if (c.type === 'video' || c.type === 'image'){ if (wide){ c.p.fit = 'contain'; c.p.bgBlur = true; } }
    if (c.type === 'text' && wide){ c.p.size = Math.max(2, c.p.size * .56); c.p.y = Math.min(88, Math.max(12, c.p.y)); }
  }
  void old;
};
const tEnd = text => () => {
  const T = total(), g = topGfx(), g2 = topGfx();
  mk('shape', g, T, 2.4, {shape:'rect', x:50, y:50, w:100, h:100, fill:'#0b0b10', grad:true, fill2:'#24244a', gradAngle:90, radius:0, aIn:'fade', aInDur:.3});
  mk('text', g2, T + .1, 2.3, {text:text || 'احجز الآن — الرابط في البايو', size:7.5, y:44, strokeW:0, glow:35, glowColor:'#7b61ff', aIn:'pop', aInDur:.5});
  mk('fx', g2, T, 2.4, {kind:'confetti', count:50, fadeOut:.3});
};

const RM_HOOKS = ['🔥 شاهد حتى النهاية', 'لا تفوّت هذا العرض!', 'هل تعلم؟', 'انتبه لهذا قبل الحجز'];
const RM_ENDS = ['احجز الآن — الرابط في البايو', 'تواصل معنا الآن', 'لا تفوّت العرض'];
let RM_PLANS = [];
function basePlans(){
  const hook = () => ($('#rmHook') && $('#rmHook').value.trim()) || RM_HOOKS[0], end = () => ($('#rmEnd') && $('#rmEnd').value.trim()) || RM_ENDS[0];
  return [
    {k:'hook-warm', n:'افتتاحية مشوّقة + ألوان دافئة', t:[() => tHook(hook())(), tLook('warm')]},
    {k:'fast-cinematic-neon', n:'إيقاع أسرع 1.12x + سينمائي + كابشن نيون', t:[tScale(1.12), tLook('cinematic'), tCaption(1)]},
    {k:'purple-vivid-endcard', n:'كابشن بنفسجي + ألوان نابضة + خاتمة جديدة', t:[tCaption(2), tLook('vivid'), () => tEnd(end())()]},
    {k:'square-1x1', n:'نسخة مربعة 1:1', t:[tAspect('1:1')]},
    {k:'post-4x5-tealorange', n:'نسخة 4:5 للبوست + تيل وبرتقالي', t:[tAspect('4:5'), tLook('tealorange')]},
    {k:'wide-16x9-blurbg', n:'نسخة أفقية 16:9 بخلفية ضبابية', t:[tAspect('16:9')]},
    {k:'facebook-no-phone', n:'نسخة فيسبوك بلا بطاقة الرقم (توجيه للخاص)', t:[() => typeof tNoCard === 'function' && tNoCard()]},
  ];
}
// مزيج عشوائي: تغييرات بسيطة بتركيبات مختلفة
function randomPlans(n){
  const R = (a) => a[Math.floor(Math.random() * a.length)], plans = [];
  for (let i = 0; i < n; i++){
    const t = [], desc = [], hk = R(RM_HOOKS), looks = ['warm', 'cinematic', 'vivid', 'tealorange', 'cool'], look = R(looks), f = R([1, 1.06, 1.1, 1.15]), cs = Math.floor(Math.random() * CAP_STYLES.length);
    if (Math.random() < .6){ t.push(() => tHook(hk)()); desc.push('افتتاحية'); }
    if (f > 1){ t.push(tScale(f)); desc.push(f + 'x'); }
    t.push(tLook(look)); desc.push(look); t.push(tCaption(cs)); desc.push('كابشن ' + (cs + 1));
    if (Math.random() < .5){ const e = R(RM_ENDS); t.push(() => tEnd(e)()); desc.push('خاتمة'); }
    plans.push({k:'mix' + (i + 1), n:'مزيج ' + (i + 1) + ': ' + desc.join(' + '), t});
  }
  return plans;
}

/* ---------- تطبيق المتغيّر / معاينة / تصدير دفعة ---------- */
function applyPlan(pl){
  for (const f of pl.t) f();
  S.sel = null; S.multi.clear(); syncEls(); applyCanvas(); S.t = 0; commit(); seek(0);
}
const rmSt = (t, err) => { const e = $('#rmSt'); if (e){ e.style.color = err ? 'var(--red)' : 'var(--acc2)'; e.textContent = t; } };
const slug = s => s.replace(/[^\w؀-ۿ]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
async function exportPlans(plans, prefix){
  if (!S.clips.length) return rmSt('المشروع فارغ', true);
  const base = snapshot(); let n = 0;
  for (let i = 0; i < plans.length; i++){
    rmSt(`المتغيّر ${i + 1} / ${plans.length}: ${plans[i].n}`);
    restore(base);
    for (const f of plans[i].t) f();
    S.sel = null; S.multi.clear(); syncEls(); applyCanvas(); render(); seek(0);
    await new Promise(r => setTimeout(r, 500));
    const ok = await startExport(`${prefix}_v${i + 1}_${plans[i].k || 'variant'}`); if (!ok) break; n++;
  }
  restore(base); syncEls(); render(); rmSt(`تمّ تصدير ${n} متغيّر — تحقق من مجلد التنزيلات (قد يطلب المتصفح السماح بتنزيلات متعددة)`);
  return n;
}

/* ---------- مكتبة المقاطع الناجحة ---------- */
const HITS_KEY = 'vedit-hits';
const loadHits = () => { try { return JSON.parse(localStorage.getItem(HITS_KEY) || '[]'); } catch (_) { return []; } };
const saveHits = h => { try { localStorage.setItem(HITS_KEY, JSON.stringify(h.slice(0, 30))); } catch (_) { rmSt('تعذّر الحفظ (مساحة التخزين ممتلئة)', true); } };
function markHit(name, note){
  if (!S.clips.length && !S.pending.length) return rmSt('المشروع فارغ', true);
  const h = loadHits(); h.unshift({name:name || 'مشروع ناجح', note:note || '', date:new Date().toISOString().slice(0, 10), data:projectData()}); saveHits(h); renderRemix();
  rmSt('حُفظ كمشروع ناجح ⭐ — يمكنك إعادة فتحه وإنتاج متغيّراته في أي وقت');
}
function openHit(i){
  const h = loadHits()[i]; if (!h) return;
  const miss = applyProject(h.data); renderRemix();
  rmSt(miss.length ? 'استورد هذه الملفات وسيُربط المشروع تلقائياً: ' + miss.join('، ') : 'فُتح المشروع');
}

/* ---------- المتشابه بالاسم ---------- */
function normName(n){
  return n.replace(/\.[^.]+$/, '').toLowerCase().replace(/[ً-ٟـ]/g, '').replace(/[_\-.()[\]]+/g, ' ')
    .replace(/\b(copy|final|new|edit|v\d+|نسخة|جديد)\b/g, ' ').replace(/[0-9٠-٩]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function nameGroups(){
  const items = S.media.filter(m => m.type === 'video' || m.type === 'image').map(m => ({m, toks:new Set(normName(m.name).split(' ').filter(Boolean))}));
  const groups = [];
  for (const it of items){
    let best = null, bs = 0;
    for (const g of groups) for (const mt of g.members){            // أقرب عضو في المجموعة
      const inter = [...it.toks].filter(t => mt.has(t)).length, uni = new Set([...it.toks, ...mt]).size, j = uni ? inter / uni : (mt.size === 0 ? 1 : 0);
      if (j > bs){ bs = j; best = g; }
    }
    if (best && bs >= .3){ best.items.push(it.m); best.members.push(it.toks); }
    else groups.push({key:[...it.toks].join(' '), members:[it.toks], items:[it.m]});
  }
  for (const g of groups){
    g.key = (() => { const c = {}; g.members.forEach(s => s.forEach(t => c[t] = (c[t] || 0) + 1)); const common = Object.keys(c).filter(t => c[t] === g.members.length); return (common.length ? common : Object.keys(c).slice(0, 2)).join(' '); })();
    const num = n => { const x = n.replace(/\.[^.]+$/, '').match(/(\d+)\D*$/); return x ? +x[1] : null; };
    g.items.sort((a, b) => { const na = num(a.name), nb = num(b.name); return na != null && nb != null && na !== nb ? na - nb : a.name.localeCompare(b.name, 'ar', {numeric:true}); });
  }
  return groups;
}
function bestWindow(m, len){
  if (!m.peaks || m.type === 'image') return 0;
  const w = Math.floor(len * PPS), n = m.peaks.length; if (n <= w) return 0;
  let sum = 0, best = -1, bt = 0; for (let i = 0; i < w; i++) sum += m.peaks[i]; best = sum;
  for (let i = 1; i + w < n; i++){ sum += m.peaks[i + w - 1] - m.peaks[i - 1]; if (sum > best){ best = sum; bt = i; } }
  return bt / PPS;
}
function buildCompilation(medias, o){
  if (!medias.length) return rmSt('اختر مجموعة فيها مقاطع', true);
  if (S.clips.length && !confirm('سيُستبدل التايملاين الحالي بالسلسلة (يمكنك التراجع بـ Ctrl+Z). متابعة؟')) return;
  S.clips = []; S.markers = []; S.sel = null; S.multi.clear(); let t = 0; const made = [];
  const tr = defTrack('video');
  const useTr = o.trans && o.trans !== 'none';
  medias.forEach((m, i) => {
    const len = Math.max(.8, Math.min(m.type === 'image' ? 3 : m.dur, o.maxLen || m.dur)), prev = made[i - 1];
    const d = useTr && prev ? Math.min(.4, len * .4, prev.c.dur * .4) : 0;       // تداخل مصمَّم في الحساب نفسه (لا يحتاج مادة إضافية)
    t -= d;
    const c = mk(m.type, tr, t, len); c.mediaId = m.id;
    c.in = m.type === 'image' ? 0 : Math.min(bestWindow(m, len), Math.max(0, m.dur - len)); c.p.speed = 1;
    if (d){ c.p.aIn = o.trans; c.p.aInDur = d; prev.c.p.fadeOut = d; }
    t += len; made.push({c, m});
  });
  syncEls();
  if (o.titles) for (const {c, m} of made){
    mk('text', freeGfx(c.start, c.dur), c.start + .2, Math.max(.6, c.dur - .4), {text:normName(m.name) || m.name.replace(/\.[^.]+$/, ''), size:5.6, y:18, color:'#ffd23f', bg:true, bgOp:62, strokeW:0, aIn:'pop', aInDur:.35, fadeIn:0, fadeOut:.15});
  }
  if (o.number) made.forEach(({c}, i) => mk('text', freeGfx(c.start, c.dur), c.start + .1, Math.max(.6, c.dur - .3), {text:`${i + 1}/${made.length}`, size:4, x:88, y:6, strokeW:0, bg:true, bgOp:55, fadeIn:0, fadeOut:.1}));
  if (o.cta){
    const T = total();
    mk('shape', freeGfx(Math.max(0, T - 2.4), 2.4), Math.max(0, T - 2.4), 2.4, {x:50, y:86, w:62, h:7, fill:'#ff4d5e', grad:true, fill2:'#ff8a3c', gradAngle:0, radius:100, shadow:60, aIn:'pop', aLoop:'pulse', aLoopAmt:40});
    mk('text', freeGfx(Math.max(0, T - 2.4), 2.4), Math.max(0, T - 2.4), 2.4, {text:o.cta, size:5.2, y:86, strokeW:0, aIn:'pop', aLoop:'pulse', aLoopAmt:40});
  }
  S.t = 0; syncEls(); commit(); seek(0); rmSt(`تمّ دمج ${made.length} مقطع في سلسلة (${fmt(total())})`);
}

/* ---------- الواجهة ---------- */
const ckd = id => $(id) && $(id).checked;
function renderRemix(){
  const box = $('#t5'); if (!box || box.hidden) return;
  const keep = {hook:$('#rmHook') && $('#rmHook').value, end:$('#rmEnd') && $('#rmEnd').value, pick:[...document.querySelectorAll('.rmPick')].map(x => x.checked)};
  if (!RM_PLANS.length) RM_PLANS = basePlans();
  const hits = loadHits(), groups = nameGroups();
  box.innerHTML = `
  <div class="sec">⭐ مقاطع ناجحة (ضربت)</div>
  <div class="fld"><input type="text" id="hitName" placeholder="اسم المشروع الناجح"></div>
  <div class="fld"><input type="text" id="hitNote" placeholder="ملاحظة (مثلاً: ٣٠٠ ألف مشاهدة)"></div>
  <button id="hitSave" class="pri" style="width:100%">⭐ علّم المشروع الحالي كناجح</button>
  <div id="hitList" style="margin-top:8px">${hits.length ? '' : '<div class="empty" style="padding:8px">لا توجد مشاريع ناجحة محفوظة</div>'}</div>

  <div class="sec">♻ إعادة نشر المشروع الحالي بصيغ مختلفة</div>
  <p style="color:var(--mut);font-size:12px;margin:0 0 6px">كل متغيّر يعدّل الافتتاحية أو الإيقاع أو الألوان أو الكابشن أو المقاس أو الخاتمة، لاختبار ما يعمل أفضل مع جمهورك.</p>
  <div class="fld"><label>نص الافتتاحية (Hook)</label><input type="text" id="rmHook" value="${keep.hook ?? RM_HOOKS[0]}"></div>
  <div class="fld"><label>نص الخاتمة</label><input type="text" id="rmEnd" value="${keep.end ?? RM_ENDS[0]}"></div>
  <div id="rmPlans"></div>
  <div style="display:flex;gap:6px;margin:6px 0"><button id="rmPrev" style="flex:1">👁 معاينة أول المحدد</button><button id="rmExp" class="pri" style="flex:1">⬇ تصدير المحدد</button></div>
  <div style="display:flex;gap:6px;align-items:center"><select id="rmN" style="width:auto"><option>3</option><option selected>5</option><option>8</option></select><button id="rmRand" style="flex:1">🎲 ركّب مزيجاً عشوائياً</button></div>

  <div class="sec">🔗 دمج المقاطع المتشابهة بالاسم</div>
  <div id="rmGroups">${groups.length ? '' : '<div class="empty" style="padding:8px">استورد عدة مقاطع في تبويب «الوسائط»</div>'}</div>
  <div class="fld row2"><div><label>أقصى مدة للمقطع (ث)</label><input type="number" id="cpLen" value="3" min="1" max="30" step=".5"></div>
    <div><label>الانتقال</label><select id="cpTr"><option value="fade">تلاشي</option><option value="slideR">انزلاق</option><option value="zoomIn">تكبير</option><option value="wipeR">مسح</option><option value="glitch">غليتش</option><option value="none">بدون</option></select></div></div>
  <div class="fld"><label><input type="checkbox" id="cpTit" checked> اسم المقطع كعنوان</label></div>
  <div class="fld"><label><input type="checkbox" id="cpNum" checked> ترقيم (1/5)</label></div>
  <div class="fld"><label><input type="checkbox" id="cpCta" checked> زر ختامي</label><input type="text" id="cpCtaT" value="احجز الآن 👆"></div>

  <div id="rmSt" style="min-height:22px;margin:10px 0;font-size:12px"></div>
  <p style="color:var(--mut);font-size:11px">ملاحظة: منصات النشر قد تقلّل ظهور المحتوى المكرر؛ التغيير الحقيقي في الافتتاحية والصياغة والإيقاع أفضل من التعديلات الشكلية.</p>`;
  $('#hitSave').onclick = () => markHit($('#hitName').value.trim(), $('#hitNote').value.trim());
  const hl = $('#hitList');
  hits.forEach((h, i) => { const d = document.createElement('div'); d.className = 'mi'; d.style.cursor = 'default';
    d.innerHTML = `<div class="nm"><b></b><span>${h.date}${h.note ? ' — ' + h.note.replace(/</g, '&lt;') : ''} · ${h.data.clips.length} عنصر</span></div><button data-o title="فتح">↗</button><button data-d title="حذف" class="danger">✕</button>`;
    d.querySelector('b').textContent = '⭐ ' + h.name; d.querySelector('[data-o]').onclick = () => openHit(i);
    d.querySelector('[data-d]').onclick = () => { const a = loadHits(); a.splice(i, 1); saveHits(a); renderRemix(); }; hl.appendChild(d); });
  const pl = $('#rmPlans');
  RM_PLANS.forEach((p, i) => { const d = document.createElement('div'); d.className = 'fld'; d.innerHTML = `<label><span><input type="checkbox" class="rmPick" ${keep.pick[i] === false ? '' : 'checked'}> ${p.n.replace(/</g, '&lt;')}</span></label>`; pl.appendChild(d); });
  const picked = () => RM_PLANS.filter((_, i) => document.querySelectorAll('.rmPick')[i].checked);
  $('#rmPrev').onclick = () => { const p = picked()[0]; if (!p) return rmSt('اختر متغيّراً', true); applyPlan(p); rmSt('طُبّق المتغيّر في المحرر — Ctrl+Z للتراجع'); };
  $('#rmExp').onclick = async () => { const ps = picked(); if (!ps.length) return rmSt('اختر متغيّراً واحداً على الأقل', true); $('#rmExp').disabled = true; try { await exportPlans(ps, 'remix'); } catch (e) { rmSt('تعذّر: ' + (e.message || e), true); } $('#rmExp').disabled = false; };
  $('#rmRand').onclick = () => { RM_PLANS = [...basePlans(), ...randomPlans(+$('#rmN').value)]; renderRemix(); };
  const gb = $('#rmGroups');
  groups.forEach((g, gi) => { const d = document.createElement('div'); d.className = 'mi'; d.style.cursor = 'default';
    d.innerHTML = `<div class="nm"><b></b><span>${g.items.length} مقطع · ${fmt(g.items.reduce((a, m) => a + (m.dur || 0), 0))}</span></div><button data-m class="pri">دمج</button>`;
    d.querySelector('b').textContent = '🔗 ' + (g.key || 'بدون اسم مميّز');
    d.querySelector('[data-m]').onclick = () => buildCompilation(g.items, {maxLen:+$('#cpLen').value, trans:$('#cpTr').value, titles:ckd('#cpTit'), number:ckd('#cpNum'), cta:ckd('#cpCta') ? $('#cpCtaT').value : ''});
    gb.appendChild(d); });
  if (typeof renderPublish === 'function') renderPublish(box);
}
const _renderMedia = renderMedia; renderMedia = function(){ _renderMedia(); if ($('#t5') && !$('#t5').hidden) renderRemix(); };
