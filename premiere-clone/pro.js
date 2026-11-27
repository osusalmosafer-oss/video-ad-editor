'use strict';
/* ============ ميزات بديلة لكاب كات: سرعة متدرجة، ملصقات إعلانية، قوالب إعلان ============ */

/* ---------- 1) تغيير السرعة المتدرج (Speed Ramp) ----------
   يقسم مصدر المقطع إلى شرائح متساوية ويعطي كل شريحة سرعتها من المنحنى، فتتغير السرعة تدريجياً.
   المقطع يعاد ترتيبه بشرائح متلاصقة، وما بعده على نفس المسار يُزاح تلقائياً. */
const RAMPS = {
  slowfast: {n:'🐢→🐇 بطيء ثم سريع',        f: u => .45 + 2.4 * u * u},
  fastslow: {n:'🐇→🐢 سريع ثم بطيء',        f: u => .45 + 2.4 * (1 - u) * (1 - u)},
  pulse:    {n:'🎬 نبضة: بطيء–سريع–بطيء',    f: u => .5 + 2.2 * Math.pow(Math.sin(Math.PI * u), 2)},
  burst:    {n:'⚡ قفزة سريعة في الوسط',      f: u => 1 + 2.2 * Math.exp(-Math.pow((u - .5) / .14, 2))},
};
function speedRamp(key){
  const c = selClip(); if (!c || c.type !== 'video'){ alert('اختر مقطع فيديو في التايملاين أولاً'); return false; }
  const R = RAMPS[key]; if (!R) return false;
  const sp0 = c.p.speed || 1, srcLen = c.dur * sp0, N = srcLen >= 2 ? 8 : 4, seg = srcLen / N, startAt = c.start, oldEnd = c.start + c.dur;
  const speeds = Array.from({length:N}, (_, i) => clamp(R.f((i + .5) / N), .3, 3.5));
  const orig = JSON.parse(JSON.stringify(c)); delete c.kf;
  const pieces = []; let t = startAt;
  for (let i = 0; i < N; i++){
    const piece = i === 0 ? c : JSON.parse(JSON.stringify(orig));
    if (i) { piece.id = 'c' + uid++; delete piece.kf; }
    piece.start = t; piece.in = orig.in + i * seg; piece.p = {...orig.p, speed:+speeds[i].toFixed(3)};
    piece.dur = seg / speeds[i];
    if (i > 0){ piece.p.fadeIn = 0; piece.p.aIn = 'none'; }
    if (i < N - 1){ piece.p.fadeOut = 0; piece.p.aOut = 'none'; }
    t += piece.dur; pieces.push(piece);
  }
  for (const p of pieces.slice(1)) S.clips.push(p);
  const delta = t - oldEnd;
  for (const x of S.clips) if (x.track === c.track && !pieces.includes(x) && x.start >= oldEnd - 1e-6) x.start = Math.max(0, x.start + delta);
  S.sel = c.id; syncEls(); commit();
  return {n:N, from:srcLen / sp0, to:t - startAt};
}
function rampDialog(){
  const c = selClip();
  dlg(`<b>🚀 سرعة متدرجة</b>
    <p style="font-size:12px;color:var(--mut);line-height:1.8">${c && c.type === 'video' ? 'تُطبَّق على المقطع المحدد: يُقسَّم إلى شرائح بسرعات متدرجة، ويُزاح ما بعده تلقائياً. مفاتيح الحركة على المقطع تُحذف.' : '⚠ اختر مقطع فيديو في التايملاين أولاً.'}</p>
    <div class="grid" style="grid-template-columns:repeat(2,1fr)">${Object.entries(RAMPS).map(([k, r]) => `<button data-rk="${k}">${r.n}</button>`).join('')}</div>
    <button onclick="closeDlg()">إغلاق</button>`);
  $('#dlg').onclick = e => { const b = e.target.closest('[data-rk]'); if (!b) return; const r = speedRamp(b.dataset.rk); if (r){ closeDlg(); } };
}
(function addRampBtn(){
  const bar = $('#tlbar'), b = document.createElement('button'); b.id = 'bRamp'; b.title = 'سرعة متدرجة (Speed Ramp)'; b.textContent = '🚀 سرعة متدرجة';
  const ref = $('#bFreeze'); ref ? ref.after(b) : bar.appendChild(b); b.onclick = rampDialog;
})();

/* ---------- 2) ملصقات إعلانية عربية ---------- */
const STICKERS = [
  {n:'جديد',          p:{text:'جديد', bgColor:'#e0344b', color:'#ffffff'}},
  {n:'عرض خاص',       p:{text:'عرض خاص', bgColor:'#ffd23f', color:'#1b1b1f'}},
  {n:'خصم',           p:{text:'خصم %', bgColor:'#e0344b', color:'#ffffff'}},
  {n:'مجاناً',         p:{text:'مجاناً', bgColor:'#16a34a', color:'#ffffff'}},
  {n:'حصري',          p:{text:'حصري', bgColor:'#2e2e6e', color:'#ffd23f'}},
  {n:'الأكثر طلباً',   p:{text:'الأكثر طلباً', bgColor:'#ff7a1a', color:'#ffffff'}},
  {n:'لفترة محدودة',   p:{text:'لفترة محدودة', bgColor:'#7b61ff', color:'#ffffff'}},
  {n:'احجز الآن',      p:{text:'احجز الآن', bgColor:'#00a88f', color:'#ffffff'}},
  {n:'👇 اضغط',        p:{text:'👇', bg:false, size:16, aLoop:'float', aLoopAmt:90}, plain:true},
  {n:'👆 للأعلى',       p:{text:'👆', bg:false, size:16, aLoop:'float', aLoopAmt:90}, plain:true},
  {n:'⬅ سهم',          p:{text:'⬅️', bg:false, size:16, aLoop:'float', aLoopAmt:90}, plain:true},
  {n:'✅ علامة',        p:{text:'✅', bg:false, size:16, aIn:'pop'}, plain:true},
];
function addSticker(i){
  const s = STICKERS[i], dur = 3;
  const base = s.plain ? {} : {bg:true, bgOp:100, strokeW:0, size:7, weight:'900', shadow:40, aIn:'pop', aInDur:.45, aLoop:'pulse', aLoopAmt:35, x:50, y:22, rotate:-6, fadeOut:.25};
  const c = mk('text', freeGfx(S.t, dur), S.t, dur, {...base, ...s.p}); finish(c);
}

/* ---------- 3) قوالب إعلان جاهزة (النصوص بين [ ] أماكن تعبئة، عدّلها قبل النشر) ---------- */
const AD_TPL = [
  {n:'💰 سعر + ميزة', d:'سعر كبير وتحته وحدته وميزة. اكتب السعر الحقيقي.', f: () => {
    const t = S.t;
    mk('shape', gfxTrack(0), t, 4, {x:50, y:34, w:88, h:22, fill:'#000000', fillA:55, radius:28, aIn:'wipeR', aInDur:.4, aOut:'fade'});
    mk('text', freeGfx(t + .15, 3.8), t + .15, 3.8, {text:'[السعر] ريال', size:13, x:50, y:31, color:'#ffd23f', strokeW:0, aIn:'pop', aInDur:.5});
    mk('text', freeGfx(t + .4, 3.5), t + .4, 3.5, {text:'للغرفة — [الميزة]', size:6.5, x:50, y:39, strokeW:0, aIn:'slideU', aInDur:.4});
    return null; }},
  {n:'🚶 كم تمشي للحرم؟', d:'سؤال إرشادي (أقوى فكرة عندك). المدة تُكتب بعد قياسها فعلياً.', f: () => {
    const t = S.t;
    mk('text', freeGfx(t, 3), t, 3, {text:'كم تمشي من الفندق للحرم؟ ⏱', size:9, x:50, y:30, strokeW:7, aIn:'pop', aInDur:.5});
    mk('text', freeGfx(t + 1.6, 2.6), t + 1.6, 2.6, {text:'[المدة] دقائق مشياً', size:10, x:50, y:70, color:'#ffd23f', bg:true, bgColor:'#000000', bgOp:60, strokeW:0, aIn:'slideU', aInDur:.4});
    return null; }},
  {n:'🛏 غرفة بغرفة', d:'نوع الغرفة + السعة + السعر للغرفة.', f: () => {
    const t = S.t;
    mk('text', freeGfx(t, 3.5), t, 3.5, {text:'غرفة [النوع]', size:9, x:50, y:16, strokeW:7, aIn:'pop', aInDur:.5});
    mk('text', freeGfx(t + .3, 3.2), t + .3, 3.2, {text:'تتسع لـ [العدد] أشخاص', size:6.5, x:50, y:76, bg:true, bgColor:'#7b61ff', bgOp:100, strokeW:0, aIn:'slideU', aInDur:.4});
    mk('text', freeGfx(t + .6, 2.9), t + .6, 2.9, {text:'والسعر للغرفة', size:5.5, x:50, y:84, strokeW:5, aIn:'fade', aInDur:.4});
    return null; }},
  {n:'⏳ موعد انتهاء العرض', d:'شارة موعد حقيقي (اختبار الموعد). لا تستخدمه إلا إن كان العرض فعلاً بموعد.', f: () => {
    const t = S.t;
    mk('text', freeGfx(t, 4), t, 4, {text:'العرض حتى [التاريخ]', size:6.5, x:50, y:12, bg:true, bgColor:'#e0344b', bgOp:100, color:'#ffffff', strokeW:0, aIn:'pop', aInDur:.45, aLoop:'pulse', aLoopAmt:30, rotate:-3});
    return null; }},
  {n:'✨ خاتمة: للحجز', d:'نص ختام بسيط (للبطاقة الزجاجية الكاملة استخدم قسم نمط أسس).', f: () => {
    const t = S.t;
    mk('text', freeGfx(t, 3), t, 3, {text:'للحجز والاستفسار', size:8, x:50, y:62, strokeW:6, aIn:'pop', aInDur:.5});
    mk('text', freeGfx(t + .3, 2.7), t + .3, 2.7, {text:'[رقم الواتساب]', size:7, x:50, y:70, color:'#ffd23f', strokeW:5, aIn:'slideU', aInDur:.4});
    return null; }},
];
function applyAdTpl(i){ AD_TPL[i].f(); syncEls(); commit(); }

(function buildProUi(){
  const t2 = $('#t2'), t3 = $('#t3'); if (!t2 || !t3) return;
  const st = document.createElement('div');
  st.innerHTML = `<div class="sec">🏷 ملصقات إعلانية</div><div class="grid">${STICKERS.map((s, i) => `<button data-stk="${i}">${s.n}</button>`).join('')}</div>`;
  st.onclick = e => { const b = e.target.closest('[data-stk]'); if (b) addSticker(+b.dataset.stk); };
  t2.prepend(st);
  const tp = document.createElement('div');
  tp.innerHTML = `<div class="sec">🧩 قوالب إعلان جاهزة</div><p style="color:var(--mut);font-size:12px;margin:0 0 6px">تُضاف عند المؤشر الحالي. النصوص بين [ ] أماكن تعبئة؛ عدّلها بالسعر والموعد الحقيقيين قبل النشر.</p>
    <div class="grid" style="grid-template-columns:repeat(2,1fr)">${AD_TPL.map((t, i) => `<button data-atp="${i}" title="${t.d}">${t.n}</button>`).join('')}</div>`;
  tp.onclick = e => { const b = e.target.closest('[data-atp]'); if (b) applyAdTpl(+b.dataset.atp); };
  t3.prepend(tp);
})();
