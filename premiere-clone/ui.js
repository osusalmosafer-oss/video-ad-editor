'use strict';
/* ============ استيراد الوسائط ============ */
function addFiles(files){
  for (const f of files){
    const type = f.type.startsWith('video') ? 'video' : f.type.startsWith('image') ? 'image' : f.type.startsWith('audio') ? 'audio' : null;
    if (!type) continue;
    const m = {id:'m' + uid++, name:f.name, type, url:URL.createObjectURL(f), dur:5, thumb:null, w:0, h:0};
    S.media.push(m);
    if (type === 'image'){
      const im = new Image(); im.onload = () => { m.w = im.naturalWidth; m.h = im.naturalHeight; m.thumb = m.url; renderMedia(); }; im.src = m.url;
    } else {
      const v = document.createElement(type === 'video' ? 'video' : 'audio'); v.preload = 'auto'; v.muted = true; v.src = m.url;
      computePeaks(m);
      v.onloadedmetadata = () => { m.dur = v.duration || 5; m.w = v.videoWidth; m.h = v.videoHeight; renderMedia(); };
      if (type === 'video') v.onloadeddata = () => { v.currentTime = Math.min(.2, (v.duration || 1) / 2); };
      v.onseeked = () => { if (type !== 'video' || m.thumb) return; const c = document.createElement('canvas'); c.width = 104; c.height = 76;
        c.getContext('2d').drawImage(v, 0, 0, 104, 76); m.thumb = c.toDataURL('image/jpeg', .7); renderMedia(); renderTimeline(); };
    }
  }
  renderMedia();
}
function renderMedia(){
  const l = $('#mlist'); l.innerHTML = '';
  if (!S.media.length){ l.innerHTML = '<div class="empty">لا توجد وسائط بعد</div>'; return; }
  for (const m of S.media){
    const d = document.createElement('div'); d.className = 'mi'; d.draggable = true;
    d.innerHTML = (m.thumb ? `<img src="${m.thumb}">` : `<div class="ic">${m.type === 'audio' ? '🎵' : '🎞'}</div>`) +
      `<div class="nm"><b></b><span>${m.type === 'image' ? 'صورة' : fmt(m.dur)}</span></div><button title="أضف للتايملاين">＋</button>`;
    d.querySelector('b').textContent = m.name;
    d.querySelector('button').onclick = () => addClip(m);
    d.ondblclick = () => addClip(m);
    d.ondragstart = e => e.dataTransfer.setData('text/mid', m.id);
    l.appendChild(d);
  }
}

/* ============ عمليات المقاطع ============ */
function freeStart(track, from, dur){
  const on = S.clips.filter(c => c.track === track);
  return on.some(c => from < c.start + c.dur && from + dur > c.start) ? on.reduce((m, c) => Math.max(m, c.start + c.dur), 0) : from;
}
function mk(type, track, start, dur, p){
  const c = {id:'c' + uid++, type, track, start, in:0, dur, p:{...defaults(type), ...(p || {})}};
  S.clips.push(c); return c;
}
function finish(c){ if (c) S.sel = c.id; syncEls(); commit(); }
function addClip(m, track, start){
  const kind = m.type === 'audio' ? 'audio' : 'video', tr = track || defTrack(kind), dur = m.type === 'image' ? 4 : m.dur;
  const c = mk(m.type, tr, freeStart(tr, start == null ? S.t : start, dur), dur); c.mediaId = m.id; finish(c);
}
const TEXT_STYLES = [
  {n:'كلاسيك', p:{}},
  {n:'أصفر عريض', p:{color:'#ffd23f', strokeW:7}},
  {n:'نيون', p:{strokeW:0, glow:60, glowColor:'#00d1b2'}},
  {n:'بخلفية', p:{bg:true, bgColor:'#7b61ff', bgOp:100, strokeW:0}},
  {n:'تدرّج', p:{grad:true, color:'#ff4d5e', color2:'#ffd23f', strokeW:3}},
  {n:'ظل ناعم', p:{strokeW:0, shadow:60}},
  {n:'آلة كاتبة', p:{aIn:'typewriter', aInDur:1.5, fadeIn:0, fadeOut:0, text:'تُكتب حرفاً حرفاً…'}},
  {n:'كاريوكي', p:{hl:'karaoke', bg:true, bgOp:60, strokeW:0, text:'كل كلمة تتلوّن مع الصوت', fadeIn:0, fadeOut:0}},
  {n:'كلمة كلمة', p:{aIn:'words', aInDur:1.2, text:'كلمة تلو الأخرى تظهر'}},
];
function addText(style, text){
  const d = (typeof style === 'number' ? TEXT_STYLES[style] : style) || TEXT_STYLES[0], tr = gfxTrack(0);
  const c = mk('text', tr, freeStart(tr, S.t, 3), 3, {...d.p, ...(text ? {text} : {})}); finish(c);
}
function addShape(shape){ const tr = gfxTrack(0); const c = mk('shape', tr, S.t, 3, {shape, ...(shape === 'line' ? {w:60, h:.6} : shape === 'bar' ? {w:80, h:2, y:5} : shape === 'circle' || shape === 'star' || shape === 'heart' ? {w:20, h:11} : {})}); finish(c); }
function addFx(kind){ const tr = gfxTrack(1); const p = {kind}; if (kind === 'snow') p.count = 80; if (kind === 'rain') p.count = 120;
  if (kind === 'emoji') p.emoji = '❤️'; if (kind === 'burst' || kind === 'burstEmoji'){ p.count = 70; p.speed = 60; if (kind === 'burstEmoji') p.emoji = '🎉'; } if (kind === 'flare') p.count = 0;
  finish(mk('fx', tr, S.t, kind === 'flare' ? 2.5 : 4, p)); }
function addAdjust(look){ finish(mk('adjust', gfxTrack(2), S.t, Math.max(3, total() - S.t) || 5, {look:look || 'cinematic'})); }
function addEmoji(e){ const tr = gfxTrack(0); finish(mk('text', tr, freeStart(tr, S.t, 3), 3, {text:e, size:18, strokeW:0, x:50, y:50, aIn:'pop', aInDur:.5})); }
function splitAt(){
  const t = S.t, ok = c => t > c.start + .05 && t < c.start + c.dur - .05, c = S.clips.find(c => c.id === S.sel && ok(c)) || S.clips.find(ok);
  if (!c) return;
  const sp = c.p.speed || 1, cut = t - c.start, b = JSON.parse(JSON.stringify(c)); b.id = 'c' + uid++;
  b.start = t; b.in = c.in + cut * sp; b.dur = c.dur - cut; c.dur = cut; c.p.fadeOut = 0; b.p.fadeIn = 0; c.p.aOut = 'none'; b.p.aIn = 'none';
  if (c.kf){
    for (const k in c.kf){
      const v = val(c, k), a = c.kf[k];
      c.kf[k] = a.filter(f => f.t < cut).concat([{t:cut, v}]);
      b.kf[k] = [{t:0, v}].concat(a.filter(f => f.t > cut).map(f => ({t:f.t - cut, v:f.v})));
    }
  }
  S.clips.push(b); finish(b);
}
function delClip(ripple){
  const c = selClip(); if (!c) return;
  S.clips = S.clips.filter(x => x !== c);
  if (ripple) for (const x of S.clips) if (x.track === c.track && x.start >= c.start + c.dur - 1e-6) x.start = Math.max(0, x.start - c.dur);
  S.sel = null; syncEls(); commit();
}
function dupClip(){ const c = selClip(); if (!c) return; const b = JSON.parse(JSON.stringify(c)); b.id = 'c' + uid++; b.start = c.start + c.dur; S.clips.push(b); finish(b); }
let clipboard = null;
function copyClip(){ const c = selClip(); if (c) clipboard = JSON.stringify(c); }
function pasteClip(){ if (!clipboard) return; const b = JSON.parse(clipboard); b.id = 'c' + uid++; b.start = S.t; if (!TRACKS.find(t => t.id === b.track)) b.track = defTrack(kindOf(b)); S.clips.push(b); finish(b); }
function freezeFrame(){
  const c = selClip(); if (!c || c.type !== 'video' || S.t <= c.start + .05 || S.t >= c.start + c.dur - .05) return alert('اختر مقطع فيديو وضع المؤشر داخله');
  const e = els.get(c.id), W = e.videoWidth, H = e.videoHeight, k = document.createElement('canvas'); k.width = W; k.height = H; k.getContext('2d').drawImage(e, 0, 0, W, H);
  k.toBlob(blob => {
    const url = URL.createObjectURL(blob), m = {id:'m' + uid++, name:'إطار مجمّد.png', type:'image', url, dur:2, thumb:url, w:W, h:H}; S.media.push(m);
    const t = S.t; splitAt(); const b = selClip(), len = 2;
    for (const x of S.clips) if (x.track === c.track && x.start >= b.start - 1e-6) x.start += len;
    const fr = mk('image', c.track, t, len); fr.mediaId = m.id; fr.p = {...c.p, speed:1, aIn:'none', aOut:'none', fadeIn:0, fadeOut:0}; finish(fr); renderMedia();
  });
}

/* ============ SRT ============ */
function importSrt(txt){
  const ts = x => { const m = x.trim().replace(',', '.').match(/(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)/); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) : NaN; };
  let n = 0; const tr = gfxTrack(0);
  for (const blk of txt.replace(/\r/g, '').replace(/^WEBVTT.*\n/, '').split(/\n\s*\n/)){
    const ln = blk.split('\n').map(l => l.trim()).filter(Boolean), i = ln.findIndex(l => l.includes('-->'));
    if (i < 0) continue;
    const [a, b] = ln[i].split('-->'), st = ts(a), en = ts(b.trim().split(/\s/)[0]), text = ln.slice(i + 1).join('\n');
    if (isNaN(st) || isNaN(en) || en <= st || !text) continue;
    mk('text', tr, st, en - st, {text, size:6.5, bg:true, fadeIn:0, fadeOut:0}); n++;
  }
  if (!n) return alert('لم أجد ترجمات صالحة في الملف');
  commit();
}
function exportSrt(){
  const T = x => { const h = Math.floor(x / 3600), m = Math.floor(x % 3600 / 60), s = Math.floor(x % 60), ms = Math.round((x % 1) * 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`; };
  const tx = S.clips.filter(c => c.type === 'text' && !c.p.counter).sort((a, b) => a.start - b.start);
  if (!tx.length) return alert('لا توجد نصوص');
  const out = tx.map((c, i) => `${i + 1}\n${T(c.start)} --> ${T(c.start + c.dur)}\n${c.p.text}\n`).join('\n');
  dl(new Blob([out], {type:'text/plain'}), 'subtitles.srt');
}
const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); };

/* ============ إزالة السكتات والإيقاع والعلامات ============ */
function dlg(html){ $('#dlg').innerHTML = html; $('#dlgw').style.display = 'grid'; }
const closeDlg = () => { $('#dlgw').style.display = 'none'; };
function silenceDialog(){
  const c = selClip(), m = c && mediaOf(c);
  if (!c || !(c.type === 'video' || c.type === 'audio')) return alert('اختر مقطع فيديو أو صوت أولاً');
  if (!m || !m.peaks) return alert('الصوت لم يُحلَّل بعد أو المقطع بلا صوت');
  dlg(`<b>🔇 إزالة السكتات تلقائياً</b>
    <div class="fld"><label><span>عتبة السكوت (dB)</span><b id="dv1">-35</b></label><input type="range" id="thr" min="-60" max="-15" value="-35" oninput="dv1.textContent=this.value"></div>
    <div class="fld"><label><span>أقل مدة سكتة تُحذف (ث)</span><b id="dv2">0.35</b></label><input type="range" id="mns" min=".1" max="1.5" step=".05" value=".35" oninput="dv2.textContent=this.value"></div>
    <div class="fld"><label><span>هامش حول الكلام (ث)</span><b id="dv3">0.08</b></label><input type="range" id="pad" min="0" max=".3" step=".01" value=".08" oninput="dv3.textContent=this.value"></div>
    <div class="fld"><label><input type="checkbox" id="rip" checked> سدّ الفراغ في كل المسارات</label></div>
    <button class="pri" id="goSil">تطبيق</button> <button onclick="closeDlg()">إلغاء</button>`);
  $('#goSil').onclick = () => { removeSilence(c, m, +$('#thr').value, +$('#mns').value, +$('#pad').value, $('#rip').checked); closeDlg(); };
}
function removeSilence(c, m, thr, minS, pad, rippleAll){
  const sp = c.p.speed || 1, a = Math.floor(c.in * PPS), b = Math.min(m.peaks.length, Math.ceil((c.in + c.dur * sp) * PPS)), T = Math.pow(10, thr / 20);
  let ranges = [], start = null, quiet = 0;
  for (let i = a; i < b; i++){
    if (m.peaks[i] > T){ if (start == null) start = i; quiet = 0; }
    else if (start != null){ quiet++; if (quiet >= minS * PPS){ ranges.push([start, i - quiet + 1]); start = null; quiet = 0; } }
  }
  if (start != null) ranges.push([start, b]);
  ranges = ranges.map(([s, e]) => [Math.max(a, s - pad * PPS), Math.min(b, e + pad * PPS)]);
  const merged = []; for (const r of ranges){ const L = merged[merged.length - 1]; if (L && r[0] <= L[1]) L[1] = Math.max(L[1], r[1]); else merged.push([...r]); }
  if (!merged.length) return alert('لم أجد كلاماً فوق العتبة المحددة');
  const oldEnd = c.start + c.dur; let pos = c.start; const parts = [];
  merged.forEach(([s, e], i) => {
    const n = JSON.parse(JSON.stringify(c)); n.id = 'c' + uid++; delete n.kf; n.in = s / PPS; n.dur = (e - s) / PPS / sp; n.start = pos; pos += n.dur;
    n.p.fadeIn = i === 0 ? c.p.fadeIn : 0; n.p.fadeOut = i === merged.length - 1 ? c.p.fadeOut : 0; parts.push(n);
  });
  const delta = oldEnd - pos;
  S.clips = S.clips.filter(x => x !== c);
  for (const x of S.clips) if ((rippleAll || x.track === c.track) && x.start >= oldEnd - 1e-6) x.start = Math.max(0, x.start - delta);
  S.clips.push(...parts); S.sel = parts[0].id; syncEls(); commit();
  setTimeout(() => alert(`تم حذف ${delta.toFixed(1)} ثانية من السكتات (${merged.length} مقطع)`), 50);
}
function detectBeats(){
  const c = selClip(), m = c && mediaOf(c);
  if (!c || !m || !m.peaks) return alert('اختر مقطع موسيقى أو فيديو بصوت');
  const sp = c.p.speed || 1, a = Math.floor(c.in * PPS), b = Math.min(m.peaks.length - 1, Math.ceil((c.in + c.dur * sp) * PPS)), pk = m.peaks; let last = -1e9, n = 0;
  for (let i = a + 5; i < b - 5; i++){
    let mean = 0; for (let j = i - 40; j < i; j++) mean += pk[Math.max(0, j)] || 0; mean /= 40;
    if (pk[i] > Math.max(.08, mean * 1.6) && pk[i] >= pk[i-1] && pk[i] >= pk[i+1] && i - last > .28 * PPS){
      S.markers.push({t:+(c.start + (i / PPS - c.in) / sp).toFixed(3), label:'beat'}); last = i; n++;
    }
  }
  S.markers.sort((x, y) => x.t - y.t); commit(); alert(`أُضيفت ${n} علامة إيقاع`);
}
const TRANS = [['fade','تلاشي متقاطع (Cross Dissolve)'],['slideR','انزلاق من اليمين'],['slideL','انزلاق من اليسار'],['zoomIn','تكبير'],['wipeR','مسح'],['spin','دوران'],['blur','ضبابية'],['glitch','غليتش'],['flip','قلب']];
function transitionDialog(){
  const c = selClip(); if (!c || kindOf(c) !== 'video') return alert('اختر المقطع الذي تريد الانتقال إليه (يجب أن يلاصق مقطعاً قبله)');
  dlg(`<b>🔀 انتقال إلى هذا المقطع</b>
    <div class="fld"><label>النوع</label><select id="trT">${TRANS.map(([a, b]) => `<option value="${a}">${b}</option>`).join('')}</select></div>
    <div class="fld"><label><span>المدة (ث)</span><b id="dvT">0.6</b></label><input type="range" id="trD" min=".2" max="2" step=".1" value=".6" oninput="dvT.textContent=this.value"></div>
    <button class="pri" id="goTr">تطبيق</button> <button onclick="closeDlg()">إلغاء</button>`);
  $('#goTr').onclick = () => { applyTransition(c, $('#trT').value, +$('#trD').value); closeDlg(); };
}
function applyTransition(c, type, d){
  const prev = S.clips.filter(x => x !== c && x.track === c.track && Math.abs(x.start + x.dur - c.start) < .06).sort((a, b) => b.start - a.start)[0];
  if (!prev) return alert('لا يوجد مقطع ملاصق قبل المقطع المحدد على نفس المسار');
  d = Math.min(d, prev.dur - .1, c.dur - .1); const sp = c.p.speed || 1;
  if ((c.type === 'video') && c.in >= d * sp - 1e-6){ c.in -= d * sp; c.dur += d; c.start -= d; } else c.start -= d;
  c.p.aIn = type; c.p.aInDur = d; prev.p.fadeOut = Math.max(prev.p.fadeOut || 0, d); syncEls(); commit();
}
function addMarker(){ if (S.markers.some(x => Math.abs(x.t - S.t) < .05)) return; S.markers.push({t:+S.t.toFixed(3), label:''}); S.markers.sort((a, b) => a.t - b.t); commit(); }

/* ============ قوالب جاهزة ============ */
function T0(){ return S.t; }
const TEMPLATES = [
  {n:'🏷 عنوان رئيسي', f:() => { const t = T0(), g = gfxTrack(0), g1 = gfxTrack(1);
    mk('shape', g, t, 3.5, {x:50, y:42, w:92, h:13, fill:'#7b61ff', grad:true, fill2:'#00d1b2', gradAngle:0, radius:30, aIn:'wipeR', aInDur:.5, aOut:'fade', shadow:40});
    return mk('text', g1, t + .2, 3.3, {text:'عنوان قوي هنا', size:9.5, x:50, y:42, strokeW:0, aIn:'pop', aInDur:.6}); }},
  {n:'📛 ثلث سفلي', f:() => { const t = T0(), g = gfxTrack(0), g1 = gfxTrack(1);
    mk('shape', g, t, 4, {x:42, y:80, w:78, h:10, fill:'#000000', opacity:75, radius:18, aIn:'slideL', aOut:'slideL'});
    mk('shape', g, t, 4, {x:5, y:80, w:1.6, h:10, fill:'#ffd23f', radius:0, aIn:'slideL', aOut:'slideL'});
    mk('text', g1, t + .15, 3.8, {text:'الاسم الكامل', size:5.5, x:11, y:78, align:'left', strokeW:0, aIn:'slideL', aOut:'fade'});
    return mk('text', g1, t + .3, 3.7, {text:'المسمى الوظيفي', size:3.6, x:11, y:82.5, align:'left', strokeW:0, color:'#ffd23f', weight:'700', aIn:'slideL', aOut:'fade'}); }},
  {n:'🔴 زر CTA', f:() => { const t = T0(), g = gfxTrack(0), g1 = gfxTrack(1);
    mk('shape', g, t, 4, {x:50, y:86, w:62, h:7, fill:'#ff4d5e', grad:true, fill2:'#ff8a3c', gradAngle:0, radius:100, shadow:60, aIn:'pop', aLoop:'pulse', aLoopAmt:40});
    return mk('text', g1, t, 4, {text:'اطلب الآن 👆', size:5.2, x:50, y:86, strokeW:0, aIn:'pop', aLoop:'pulse', aLoopAmt:40}); }},
  {n:'🔢 عدّاد أرقام', f:() => mk('text', gfxTrack(0), T0(), 3.5, {text:'', counter:true, cFrom:0, cTo:10000, cSuffix:'+', cDur:2, size:20, x:50, y:45, color:'#ffd23f', aIn:'pop'})},
  {n:'⭐ تقييم نجوم', f:() => mk('text', gfxTrack(0), T0(), 3.5, {text:'★★★★★', size:13, x:50, y:35, color:'#ffd23f', strokeW:4, aIn:'typewriter', aInDur:1, fadeIn:0})},
  {n:'💥 شارة خصم', f:() => { const t = T0(), g = gfxTrack(0), g1 = gfxTrack(1);
    mk('shape', g, t, 3.5, {shape:'star', x:78, y:25, w:34, h:19, fill:'#ff4d5e', stroke:'#ffffff', strokeW:3, aIn:'elastic', aInDur:.9, aLoop:'wiggle', shadow:50});
    return mk('text', g1, t, 3.5, {text:'-50%', size:8.5, x:78, y:25, strokeW:0, aIn:'elastic', aInDur:.9, aLoop:'wiggle'}); }},
  {n:'🎉 احتفال', f:() => { addFx('burst'); }},
  {n:'❄️ ثلج', f:() => { addFx('snow'); }},
  {n:'❤️ قلوب صاعدة', f:() => { addFx('emoji'); }},
  {n:'📊 شريط تقدّم', f:() => mk('shape', gfxTrack(0), T0(), 5, {shape:'bar', x:50, y:4, w:90, h:1.4, fill:'#00d1b2', fill2:'#ffffff', radius:100})},
  {n:'🎬 سينمائي (أشرطة)', f:() => { const t = T0(), g = gfxTrack(0), d = Math.max(4, total() - t) || 5;
    mk('shape', g, t, d, {x:50, y:5, w:100, h:10, fill:'#000000', radius:0, aIn:'slideD', aInDur:.7});
    mk('shape', g, t, d, {x:50, y:95, w:100, h:10, fill:'#000000', radius:0, aIn:'slideU', aInDur:.7});
    return mk('adjust', gfxTrack(2), t, d, {look:'cinematic', vignette:40, grain:18}); }},
  {n:'⚡ عنوان غليتش', f:() => mk('text', gfxTrack(0), T0(), 3, {text:'GLITCH', font:'impact', size:16, x:50, y:45, strokeW:0, glow:40, glowColor:'#ff2bd6', aIn:'glitch', aInDur:.8, aLoop:'shake', aLoopAmt:40})},
  {n:'📺 صندوق صورة (PiP)', f:() => { const c = selClip(); if (!c || kindOf(c) !== 'video') return alert('اختر مقطع فيديو/صورة أولاً'); Object.assign(c.p, {scale:38, x:28, y:-28, mask:'rounded', maskR:30, borderW:3, shadow:60, aIn:'zoomIn'}); return c; }},
];
function applyTemplate(i){ const c = TEMPLATES[i].f(); if (c){ S.sel = c.id; syncEls(); commit(); } else commit(); }

function buildSidebar(){
  const SH = [['rect','▭ مستطيل'],['circle','◯ دائرة'],['triangle','△ مثلث'],['star','★ نجمة'],['arrow','➜ سهم'],['heart','♥ قلب'],['line','— خط'],['bar','▬ تقدّم']];
  const FX = [['confetti','🎊 قصاصات'],['snow','❄ ثلج'],['rain','🌧 مطر'],['bubbles','🫧 فقاعات'],['emoji','💖 إيموجي صاعد'],['sparkles','✨ بريق'],['burst','💥 انفجار'],['burstEmoji','🎉 انفجار إيموجي'],['flare','🔆 وهج ضوئي']];
  const EM = '😀😂🥰😍😎🤩😮😱🔥💯✅❌⭐💥🎉🎁💰📈📉👍👏🙏💪👀❤️🧡💛💚💙💜⚡🚀🎯📞📍🛒⏰✨🏆🆓';
  const t2 = $('#t2'); t2.innerHTML = '';
  const sec = (title, html) => t2.insertAdjacentHTML('beforeend', `<div class="sec">${title}</div>${html}`);
  sec('أنماط النص', `<div class="grid">${TEXT_STYLES.map((s, i) => `<button data-ts="${i}">${s.n}</button>`).join('')}</div>`);
  sec('أشكال', `<div class="grid">${SH.map(([k, n]) => `<button data-sh="${k}">${n}</button>`).join('')}</div>`);
  sec('جسيمات ومؤثرات', `<div class="grid">${FX.map(([k, n]) => `<button data-fx="${k}">${n}</button>`).join('')}</div>`);
  sec('طبقات تعديل الألوان', `<div class="grid">${Object.entries(LOOKS).filter(([k]) => k !== 'none').map(([k, v]) => `<button data-adj="${k}">${v.n}</button>`).join('')}</div>`);
  sec('إيموجي', `<div class="grid e">${[...EM].filter(x => x.trim()).reduce((a, ch) => { if (/[\uD800-\uDBFF]/.test(ch) || !a.length) a.push(ch); else a[a.length - 1] += ch; return a; }, []).map(e => `<button data-em="${e}">${e}</button>`).join('')}</div>`);
  t2.onclick = e => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.ts != null) addText(+d.ts); else if (d.sh) addShape(d.sh); else if (d.fx) addFx(d.fx); else if (d.adj) addAdjust(d.adj); else if (d.em) addEmoji(d.em); };
  $('#t3').innerHTML = `<p class="ph">يُضاف القالب عند المؤشر الحالي. عدّل أي عنصر بعدها.</p><div class="grid" style="grid-template-columns:repeat(2,1fr)">${TEMPLATES.map((t, i) => `<button data-tp="${i}">${t.n}</button>`).join('')}</div>`;
  $('#t3').onclick = e => { const b = e.target.closest('button'); if (b) applyTemplate(+b.dataset.tp); };
}
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('act', x === b));
  document.querySelectorAll('.tabc').forEach(t => t.hidden = t.id !== b.dataset.tab);
});

/* ============ التشغيل ============ */
let raf = 0, t0 = 0, tStart = 0;
function play(){
  if (S.playing) return;
  if (S.t >= total() - .02) S.t = 0;
  ensureAudio(); if (actx.state === 'suspended') actx.resume();
  S.playing = true; tStart = S.t; t0 = performance.now(); $('#bPlay').textContent = '⏸ إيقاف';
  const loop = now => {
    if (!S.playing) return;
    S.t = tStart + (now - t0) / 1000;
    const end = total();
    if (S.t >= end){
      if (S.loop && !S.exporting){ S.t = 0; tStart = 0; t0 = now; for (const e of els.values()) e.pause && e.pause(); }
      else { S.t = end; pause(); if (S.exporting) finishExport(); return; }
    }
    syncPlayback(); render(); followPlayhead(); raf = requestAnimationFrame(loop);
  };
  syncPlayback(); raf = requestAnimationFrame(loop);
}
function pause(){ S.playing = false; cancelAnimationFrame(raf); $('#bPlay').textContent = '▶ تشغيل'; for (const e of els.values()) e.pause && e.pause(); render(); }
function seek(t){ S.t = clamp(t, 0, Math.max(total(), 0)); syncPlayback(); if (S.playing){ tStart = S.t; t0 = performance.now(); } render(); }
function followPlayhead(){ const sc = $('#scroll'), x = S.t * S.zoom; if (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft) sc.scrollLeft = Math.max(0, x - 80); }

/* ============ التايملاين ============ */
const clipLabel = c => c.type === 'text' ? (c.p.counter ? '🔢 ' + textOf(c) : c.p.text) : c.type === 'shape' ? '◼ ' + c.p.shape : c.type === 'fx' ? '✨ ' + c.p.kind : c.type === 'adjust' ? '🎨 تعديل: ' + (LOOKS[c.p.look]?.n || '') : (mediaOf(c)?.name || '');
function waveCanvas(c, m, w, h){
  const cvs = document.createElement('canvas'), W = Math.min(4000, Math.max(1, Math.round(w)));
  cvs.width = W; cvs.height = h; cvs.style.cssText = `position:absolute;left:0;bottom:0;width:${w}px;height:${h}px;pointer-events:none`;
  const g = cvs.getContext('2d'), sp = c.p.speed || 1, vol = (c.p.volume ?? 100) / 100;
  g.fillStyle = c.type === 'audio' ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.7)';
  for (let x = 0; x < W; x++){
    const a = Math.floor((c.in + (x / W * c.dur) * sp) * PPS), b = Math.max(a + 1, Math.floor((c.in + ((x + 1) / W * c.dur) * sp) * PPS));
    let mx = 0; for (let i = a; i < b && i < m.peaks.length; i++) if (m.peaks[i] > mx) mx = m.peaks[i];
    const bh = Math.min(h, Math.max(1, mx * vol * h * 1.2)); g.fillRect(x, (h - bh) / 2, 1, bh);
  }
  return cvs;
}
function renderTimeline(){
  const tot = total(), sc = $('#scroll'), width = Math.max(sc.clientWidth, (tot + 10) * S.zoom);
  $('#inner').style.width = width + 'px';
  const lab = $('#labels'); lab.innerHTML = '';
  for (const t of TRACKS){
    const empty = !S.clips.some(c => c.track === t.id) && TRACKS.filter(x => x.kind === t.kind).length > 1;
    const d = document.createElement('div'); d.className = 'lab';
    d.innerHTML = `<span>${t.label}</span><span>` +
      (t.kind !== 'audio' ? `<button data-h="${t.id}" title="إخفاء">${S.hidden[t.id] ? '🚫' : '👁'}</button>` : '') +
      (t.kind !== 'gfx' ? `<button data-m="${t.id}" title="كتم">${S.muted[t.id] ? '🔇' : '🔊'}</button>` : '') +
      (empty ? `<button data-x="${t.id}" title="حذف المسار">✕</button>` : '') + `</span>`;
    lab.appendChild(d);
  }
  lab.onclick = e => {
    const h = e.target.dataset.h, m = e.target.dataset.m, x = e.target.dataset.x;
    if (h) S.hidden[h] = !S.hidden[h]; if (m) S.muted[m] = !S.muted[m];
    if (x){ TRACKS = TRACKS.filter(t => t.id !== x); commit(); return; }
    if (h || m){ syncPlayback(); renderTimeline(); render(); }
  };
  const ru = $('#ruler'); ru.innerHTML = '';
  const step = S.zoom >= 120 ? 1 : S.zoom >= 50 ? 2 : S.zoom >= 30 ? 5 : S.zoom >= 15 ? 10 : 30;
  for (let s = 0; s * S.zoom < width; s += step){
    const k = document.createElement('div'); k.className = 'tick'; k.style.left = s * S.zoom + 'px'; k.textContent = s + 's'; ru.appendChild(k);
  }
  S.markers.forEach((mk_, i) => {
    const d = document.createElement('div'); d.className = 'mk'; d.style.left = mk_.t * S.zoom + 'px'; d.title = 'علامة — انقر للانتقال، كليك يمين للحذف';
    d.onpointerdown = e => { e.stopPropagation(); seek(mk_.t); };
    d.oncontextmenu = e => { e.preventDefault(); S.markers.splice(i, 1); commit(); };
    ru.appendChild(d);
  });
  const rows = $('#rows'); rows.innerHTML = '';
  for (const t of TRACKS){
    const r = document.createElement('div'); r.className = 'row'; r.dataset.track = t.id;
    r.ondragover = e => { e.preventDefault(); r.classList.add('over'); };
    r.ondragleave = () => r.classList.remove('over');
    r.ondrop = e => {
      e.preventDefault(); r.classList.remove('over');
      const m = S.media.find(x => x.id === e.dataTransfer.getData('text/mid')); if (!m) return;
      if (t.kind !== (m.type === 'audio' ? 'audio' : 'video')) return;
      addClip(m, t.id, Math.max(0, (e.clientX - r.getBoundingClientRect().left) / S.zoom));
    };
    for (const c of S.clips.filter(c => c.track === t.id)){
      const d = document.createElement('div'); d.className = 'clip ' + (kindOf(c) === 'audio' ? 'audio' : c.type) + (c.id === S.sel ? ' sel' : '');
      d.style.left = c.start * S.zoom + 'px'; d.style.width = Math.max(6, c.dur * S.zoom) + 'px';
      const m = mediaOf(c); if (m && m.thumb && c.type !== 'audio') d.style.backgroundImage = `url(${m.thumb})`;
      d.innerHTML = '<div class="h l"></div><div class="h r"></div><div class="lb"></div>';
      if (m && m.peaks && c.type !== 'image') d.insertBefore(waveCanvas(c, m, c.dur * S.zoom, c.type === 'audio' ? 36 : 14), d.querySelector('.lb'));
      d.querySelector('.lb').textContent = clipLabel(c);
      const times = new Set(); for (const k in (c.kf || {})) for (const f of c.kf[k]) if (f.t >= 0 && f.t <= c.dur) times.add(+f.t.toFixed(3));
      for (const tm of times){
        const kd = document.createElement('div'); kd.className = 'kf'; kd.style.left = tm * S.zoom + 'px';
        kd.onpointerdown = e => { e.stopPropagation(); e.preventDefault(); S.sel = c.id; seek(c.start + tm); renderTimeline(); renderInspector(); };
        d.appendChild(kd);
      }
      d.onpointerdown = e => clipDown(e, c, d);
      r.appendChild(d);
    }
    rows.appendChild(r);
  }
  render();
}
$('#scroll').addEventListener('scroll', () => { $('#labels').scrollTop = $('#scroll').scrollTop; });
function snapT(t, c, edgeLen){
  if (!$('#snap').checked) return t;
  const th = 8 / S.zoom, pts = [0, S.t, ...S.markers.map(m => m.t)];
  for (const x of S.clips) if (x !== c) pts.push(x.start, x.start + x.dur);
  let best = t, bd = th;
  for (const p of pts) for (const off of [0, edgeLen]){ const d = Math.abs(t + off - p); if (d < bd){ bd = d; best = p - off; } }
  return Math.max(0, best);
}
function clipDown(e, c, d){
  e.stopPropagation(); e.preventDefault(); S.sel = c.id;
  const mode = e.target.classList.contains('l') ? 'l' : e.target.classList.contains('r') ? 'r' : 'move';
  const x0 = e.clientX, o = {start:c.start, in:c.in, dur:c.dur, kf:JSON.parse(JSON.stringify(c.kf || {}))}, m = mediaOf(c), sp = c.p.speed || 1;
  const maxSrc = (c.type === 'video' || c.type === 'audio') && m ? m.dur : Infinity;
  let moved = false;
  renderInspector(); document.querySelectorAll('.clip.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel');
  const mv = ev => {
    const dt = (ev.clientX - x0) / S.zoom; if (Math.abs(ev.clientX - x0) > 2) moved = true;
    if (mode === 'move'){
      c.start = snapT(o.start + dt, c, c.dur);
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.row');
      if (row && row.dataset.track !== c.track && trackKind(row.dataset.track) === kindOf(c)) c.track = row.dataset.track;
    } else if (mode === 'l'){
      let ns = snapT(o.start + dt, c, 0); ns = clamp(ns, Math.max(0, o.start - o.in / sp), o.start + o.dur - .1);
      const delta = ns - o.start; for (const k in o.kf) c.kf[k] = o.kf[k].map(f => ({t:f.t - delta, v:f.v}));
      c.start = ns; c.in = o.in + delta * sp; c.dur = o.dur - delta;
    } else {
      let nd = snapT(o.start + o.dur + dt, c, 0) - o.start; nd = Math.max(.1, nd); c.dur = Math.min(nd, (maxSrc - c.in) / sp);
    }
    renderTimeline();
  };
  const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); syncPlayback(); if (moved) commit(); else renderTimeline(); renderInspector(); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
}
$('#scroll').addEventListener('pointerdown', e => {
  if (e.target.closest('.clip') || e.target.closest('.mk')) return;
  const sc = $('#scroll');
  if (!e.target.closest('#ruler')){ S.sel = null; renderInspector(); renderTimeline(); }
  const set = ev => seek((ev.clientX - sc.getBoundingClientRect().left + sc.scrollLeft) / S.zoom);
  set(e);
  const mv = ev => set(ev), up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
});

/* ============ لوحة الخصائص (مبنية من مواصفات) ============ */
const R = (k, l, mn, mx, st = 1, o = {}) => ({t:'r', k, l, mn, mx, st, ...o});
const SEL = (k, l, opts, o = {}) => ({t:'s', k, l, opts, ...o});
const COL = (k, l, o = {}) => ({t:'c', k, l, ...o});
const CHK = (k, l, o = {}) => ({t:'k', k, l, ...o});
const TXT = (k, l, o = {}) => ({t:'x', k, l, ...o});
const NUM = (k, l, o = {}) => ({t:'n', k, l, ...o});
const BLEND = [['source-over','عادي'],['multiply','ضرب'],['screen','سكرين'],['overlay','أوفرلاي'],['soft-light','ضوء ناعم'],['lighten','أفتح'],['darken','أغمق'],['lighter','إضافة (Add)'],['difference','فرق']];
const ANIMS = [['none','بدون'],['fade','تلاشي'],['slideR','انزلاق من اليمين'],['slideL','انزلاق من اليسار'],['slideU','انزلاق من الأعلى'],['slideD','انزلاق من الأسفل'],
  ['zoomIn','تكبير'],['zoomOut','تصغير'],['pop','نبض'],['bounce','ارتداد'],['elastic','مطاطي'],['spin','دوران'],['flip','قلب'],['blur','ضبابية'],['rise','صعود'],['drop','هبوط'],
  ['wipeR','مسح لليمين'],['wipeL','مسح لليسار'],['wipeD','مسح للأسفل'],['wipeU','مسح للأعلى'],['glitch','غليتش']];
const ANIMS_T = [...ANIMS, ['typewriter','آلة كاتبة'],['words','كلمة كلمة']];
const LOOPS = [['none','بدون'],['pulse','نبض مستمر'],['heartbeat','نبض قلب'],['float','طفو'],['sway','تأرجح'],['wiggle','اهتزاز دوراني'],['shake','رجّة'],['spin','دوران مستمر'],['flicker','وميض'],['kenburns','Ken Burns (تقريب بطيء)'],['panL','حركة بطيئة لليسار'],['panR','حركة بطيئة لليمين']];
const LOOKOPTS = Object.entries(LOOKS).map(([k, v]) => [k, v.n]);
const animSec = (T) => ({t:'الحركة والانتقالات', items:[
  SEL('aIn', 'حركة الدخول', T === 'text' ? ANIMS_T : ANIMS), R('aInDur', 'مدة الدخول (ث)', .1, 3, .1, {nokf:true, if:p => p.aIn !== 'none'}),
  SEL('aOut', 'حركة الخروج', ANIMS), R('aOutDur', 'مدة الخروج (ث)', .1, 3, .1, {nokf:true, if:p => p.aOut !== 'none'}),
  SEL('aLoop', 'حركة مستمرة', LOOPS), R('aLoopAmt', 'شدة الحركة المستمرة', 5, 200, 1, {nokf:true, if:p => p.aLoop !== 'none'}),
  R('fadeIn', 'ظهور تدريجي (ث)', 0, 3, .1, {nokf:true}), R('fadeOut', 'اختفاء تدريجي (ث)', 0, 3, .1, {nokf:true}),
  SEL('ease', 'منحنى مفاتيح الحركة', [['smooth','سلس'],['linear','خطي']])]});
const colorSec = (t = 'الألوان والمؤثرات') => ({t, items:[
  SEL('look', 'نمط ألوان جاهز', LOOKOPTS),
  R('brightness', 'السطوع', 0, 200), R('contrast', 'التباين', 0, 200), R('saturate', 'التشبّع', 0, 300), R('hue', 'تدوير اللون', -180, 180), R('temp', 'حرارة اللون (بارد ↔ دافئ)', -100, 100),
  R('sepia', 'سيبيا', 0, 100), R('gray', 'رمادي', 0, 100), R('blur', 'ضبابية', 0, 100),
  R('vignette', 'تعتيم الأطراف (Vignette)', 0, 100), R('grain', 'حبيبات فيلم', 0, 100), R('rgb', 'غليتش RGB', 0, 100), R('pixel', 'بكسلة', 0, 100)]});
function specFor(c){
  const T = c.type, S_ = [];
  if (T === 'audio'){
    S_.push({t:'الصوت', open:true, items:[R('volume', 'مستوى الصوت', 0, 100), R('duck', 'خفض تلقائي عند وجود كلام (Ducking)', 0, 95, 1, {nokf:true}), R('fadeIn', 'ظهور تدريجي (ث)', 0, 5, .1, {nokf:true}), R('fadeOut', 'اختفاء تدريجي (ث)', 0, 5, .1, {nokf:true})]});
    return S_;
  }
  if (T === 'text'){
    S_.push({t:'النص', open:true, items:[TXT('text', 'المحتوى'),
      SEL('font', 'الخط', [['Cairo','Cairo'],['Tajawal','Tajawal'],['Lalezar','Lalezar'],['sans','Sans'],['serif','Serif'],['mono','Mono'],['impact','Impact']]),
      SEL('weight', 'السماكة', [['400','عادي'],['700','عريض'],['900','عريض جداً']]), SEL('align', 'المحاذاة', [['center','وسط'],['right','يمين'],['left','يسار']]),
      R('size', 'حجم الخط', 2, 40, .5), R('ls', 'تباعد الحروف', -5, 40, .5, {nokf:true}), R('lh', 'ارتفاع السطر', .8, 2.5, .05, {nokf:true})]});
    S_.push({t:'التلوين', items:[COL('color', 'اللون'), CHK('grad', 'تدرّج لوني'), COL('color2', 'لون التدرّج', {if:p => p.grad}), COL('stroke', 'لون الحدود'), R('strokeW', 'سماكة الحدود', 0, 20, .5),
      R('shadow', 'ظل', 0, 100), COL('shadowColor', 'لون الظل', {if:p => p.shadow > 0}), R('glow', 'توهّج', 0, 100), COL('glowColor', 'لون التوهّج', {if:p => p.glow > 0}),
      CHK('bg', 'خلفية خلف النص'), COL('bgColor', 'لون الخلفية', {if:p => p.bg}), R('bgOp', 'شفافية الخلفية', 0, 100, 1, {nokf:true, if:p => p.bg}),
      SEL('hl', 'تمييز الكلمات (كاريوكي)', [['none','بدون'],['karaoke','كاريوكي (تلوين تراكمي)'],['wordpop','كلمة نابضة']]), COL('hlColor', 'لون التمييز', {if:p => p.hl !== 'none'})]});
    S_.push({t:'عدّاد أرقام', items:[CHK('counter', 'تفعيل العدّاد'), NUM('cFrom', 'من', {if:p => p.counter}), NUM('cTo', 'إلى', {if:p => p.counter}), TXT('cPrefix', 'قبل الرقم', {one:true, if:p => p.counter}),
      TXT('cSuffix', 'بعد الرقم', {one:true, if:p => p.counter}), R('cDec', 'خانات عشرية', 0, 3, 1, {nokf:true, if:p => p.counter}), R('cDur', 'مدة العدّ (ث)', .5, 8, .1, {nokf:true, if:p => p.counter})]});
    S_.push({t:'الموضع والدمج', items:[R('x', 'الموضع أفقي %', 0, 100), R('y', 'الموضع رأسي %', 0, 100), R('rotate', 'دوران°', -180, 180), R('opacity', 'الشفافية', 0, 100), SEL('blend', 'نمط الدمج', BLEND)]});
    S_.push(animSec('text')); return S_;
  }
  if (T === 'shape'){
    S_.push({t:'الشكل', open:true, items:[SEL('shape', 'نوع الشكل', [['rect','مستطيل'],['circle','دائرة'],['triangle','مثلث'],['star','نجمة'],['arrow','سهم'],['heart','قلب'],['line','خط'],['bar','شريط تقدّم']]),
      R('w', 'العرض %', .5, 150), R('h', 'الارتفاع %', .3, 150), R('radius', 'استدارة الزوايا', 0, 100), COL('fill', 'اللون'), CHK('grad', 'تدرّج'), COL('fill2', 'اللون الثاني', {if:p => p.grad || p.shape === 'bar'}),
      R('gradAngle', 'زاوية التدرّج', 0, 360, 1, {nokf:true, if:p => p.grad}), COL('stroke', 'لون الحدود'), R('strokeW', 'سماكة الحدود', 0, 20, .5), R('shadow', 'ظل', 0, 100)]});
    S_.push({t:'الموضع والدمج', open:true, items:[R('x', 'الموضع أفقي %', -20, 120), R('y', 'الموضع رأسي %', -20, 120), R('rotate', 'دوران°', -180, 180), R('opacity', 'الشفافية', 0, 100), SEL('blend', 'نمط الدمج', BLEND)]});
    S_.push(animSec('shape')); return S_;
  }
  if (T === 'fx'){
    S_.push({t:'المؤثر', open:true, items:[SEL('kind', 'النوع', [['confetti','قصاصات'],['snow','ثلج'],['rain','مطر'],['bubbles','فقاعات'],['emoji','إيموجي صاعد'],['sparkles','بريق'],['burst','انفجار'],['burstEmoji','انفجار إيموجي'],['flare','وهج ضوئي']]),
      R('count', 'الكمية', 0, 300, 1, {nokf:true}), R('speed', 'السرعة', 5, 200, 1, {nokf:true}), R('size', 'الحجم', 10, 200, 1, {nokf:true}),
      SEL('palette', 'الألوان', [['rainbow','متعدد'],['single','لون واحد']]), COL('color', 'اللون', {if:p => p.palette === 'single'}), TXT('emoji', 'الإيموجي', {one:true, if:p => p.kind === 'emoji' || p.kind === 'burstEmoji'}),
      R('x', 'نقطة الانطلاق أفقي %', 0, 100, 1, {nokf:true, if:p => p.kind.startsWith('burst')}), R('y', 'نقطة الانطلاق رأسي %', 0, 100, 1, {nokf:true, if:p => p.kind.startsWith('burst') || p.kind === 'flare'}),
      NUM('seed', 'بذرة العشوائية', {nokf:true}), R('opacity', 'الشفافية', 0, 100), SEL('blend', 'نمط الدمج', BLEND), R('fadeIn', 'ظهور تدريجي', 0, 3, .1, {nokf:true}), R('fadeOut', 'اختفاء تدريجي', 0, 3, .1, {nokf:true})]});
    return S_;
  }
  if (T === 'adjust'){
    S_.push(colorSec('طبقة تعديل (تؤثر على كل ما تحتها)')); S_[0].open = true;
    S_.push({t:'الشفافية والحركة', items:[R('opacity', 'قوة التأثير', 0, 100), R('fadeIn', 'ظهور تدريجي', 0, 3, .1, {nokf:true}), R('fadeOut', 'اختفاء تدريجي', 0, 3, .1, {nokf:true})]});
    return S_;
  }
  // فيديو / صورة
  S_.push({t:'التحويل', open:true, items:[SEL('fit', 'الملاءمة', [['cover','ملء الإطار'],['contain','احتواء']]), CHK('bgBlur', 'خلفية ضبابية خلف الفيديو', {if:p => p.fit === 'contain'}), R('scale', 'الحجم %', 5, 500), R('x', 'إزاحة أفقية', -150, 150), R('y', 'إزاحة رأسية', -150, 150), R('rotate', 'دوران°', -180, 180),
    CHK('flipH', 'قلب أفقي'), CHK('flipV', 'قلب رأسي'), R('opacity', 'الشفافية', 0, 100), SEL('blend', 'نمط الدمج', BLEND)]});
  S_.push({t:'القصّ والإطار', items:[SEL('mask', 'القناع', [['none','بدون'],['rounded','زوايا مستديرة'],['circle','دائرة']]), R('maskR', 'استدارة الزوايا', 0, 100, 1, {nokf:true, if:p => p.mask === 'rounded'}),
    R('cl', 'قصّ يسار %', 0, 90, 1, {nokf:true}), R('cr', 'قصّ يمين %', 0, 90, 1, {nokf:true}), R('ct', 'قصّ أعلى %', 0, 90, 1, {nokf:true}), R('cb', 'قصّ أسفل %', 0, 90, 1, {nokf:true}),
    R('borderW', 'سماكة الإطار', 0, 20, .5, {nokf:true}), COL('borderColor', 'لون الإطار', {if:p => p.borderW > 0}), R('shadow', 'ظل', 0, 100)]});
  S_.push(colorSec());
  S_.push({t:'إزالة الخلفية الخضراء', items:[CHK('chroma', 'تفعيل Chroma Key'), COL('chromaColor', 'اللون المراد إزالته', {if:p => p.chroma}), R('chromaTol', 'التسامح', 1, 100, 1, {nokf:true, if:p => p.chroma}), R('chromaSoft', 'نعومة الحواف', 0, 60, 1, {nokf:true, if:p => p.chroma})]});
  if (T === 'video') S_.push({t:'السرعة والصوت', items:[SEL('speed', 'السرعة', [[.25,'0.25x'],[.5,'0.5x'],[.75,'0.75x'],[1,'1x'],[1.25,'1.25x'],[1.5,'1.5x'],[2,'2x'],[3,'3x']], {num:true}), R('volume', 'مستوى الصوت', 0, 100)]});
  S_.push(animSec('visual')); return S_;
}
const openSecs = new Set(['التحويل', 'النص', 'الشكل', 'المؤثر']);
function fieldHTML(c, it){
  const v = it.t === 'r' ? val(c, it.k) : c.p[it.k];
  if (it.if && !it.if(c.p)) return '';
  if (it.t === 'r'){
    const kb = KF.has(it.k) && !it.nokf ? `<button class="kb" data-kb="${it.k}" title="مفتاح حركة عند المؤشر">◇</button>` : '';
    return `<div class="fld"><label><span>${it.l}</span><span>${kb}<b data-v="${it.k}">${(+v).toFixed(it.st < 1 ? 1 : 0)}</b></span></label><input type="range" data-k="${it.k}" min="${it.mn}" max="${it.mx}" step="${it.st}" value="${v}"></div>`;
  }
  if (it.t === 's') return `<div class="fld"><label>${it.l}</label><select data-k="${it.k}" ${it.num ? 'data-num="1"' : ''}>${it.opts.map(([a, b]) => `<option value="${a}">${b}</option>`).join('')}</select></div>`;
  if (it.t === 'c') return `<div class="fld"><label>${it.l}</label><input type="color" data-k="${it.k}" value="${v}"></div>`;
  if (it.t === 'k') return `<div class="fld"><label><span><input type="checkbox" data-k="${it.k}" ${v ? 'checked' : ''}> ${it.l}</span></label></div>`;
  if (it.t === 'n') return `<div class="fld"><label>${it.l}</label><input type="number" data-k="${it.k}" value="${v}" step="any"></div>`;
  return `<div class="fld"><label>${it.l}</label>${it.one ? `<input type="text" data-k="${it.k}">` : `<textarea data-k="${it.k}" rows="3"></textarea>`}</div>`;
}
function renderInspector(){
  const b = $('#ibody'), c = selClip();
  if (!c){ b.innerHTML = '<div class="empty">اختر مقطعاً من التايملاين أو من المعاينة</div>'; return; }
  const sc = b.parentElement.scrollTop;
  let h = `<div class="fld"><label><span>${clipLabel(c).slice(0, 30)}</span><b>${fmt(c.start)} → ${fmt(c.start + c.dur)}</b></label></div>`;
  for (const sec of specFor(c)){
    const body = sec.items.map(it => fieldHTML(c, it)).join('');
    h += `<details data-s="${sec.t}" ${openSecs.has(sec.t) || sec.open ? 'open' : ''}><summary>${sec.t}</summary>${body}</details>`;
  }
  b.innerHTML = h; b.parentElement.scrollTop = sc;
  b.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => { d.open ? openSecs.add(d.dataset.s) : openSecs.delete(d.dataset.s); }));
  b.querySelectorAll('[data-kb]').forEach(btn => btn.onclick = () => { toggleKf(c, btn.dataset.kb); commit(); renderInspector(); });
  b.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k, v = c.p[k];
    if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) el.value = v;
    const read = () => el.type === 'checkbox' ? el.checked : (el.type === 'range' || el.type === 'number' || el.dataset.num) ? +el.value : el.value;
    el.addEventListener('input', () => {
      setVal(c, k, read());
      if (k === 'speed') c.dur = Math.min(c.dur, (mediaOf(c).dur - c.in) / c.p.speed);
      const lbl = b.querySelector(`[data-v="${k}"]`); if (lbl) lbl.textContent = (+val(c, k)).toFixed(1).replace(/\.0$/, '');
      syncPlayback(); render(); if (k === 'text') renderTimeline();
    });
    el.addEventListener('change', () => { commit(); renderInspector(); });
  });
}
function syncInspector(){
  const c = selClip(); if (!c) return;
  document.querySelectorAll('#ibody input[type=range]').forEach(el => {
    const k = el.dataset.k; if (!KF.has(k)) return;
    const has = c.kf && c.kf[k] && c.kf[k].length, kb = document.querySelector(`#ibody [data-kb="${k}"]`);
    if (kb){ kb.textContent = kfAt(c, k) >= 0 ? '◆' : '◇'; kb.style.color = has ? '#ffd23f' : ''; }
    if (document.activeElement === el) return;
    const v = val(c, k); el.value = v; const l = document.querySelector(`#ibody [data-v="${k}"]`); if (l) l.textContent = (+v).toFixed(1).replace(/\.0$/, '');
  });
}
function refresh(){ renderTimeline(); renderInspector(); renderMedia(); $('#bUndo').disabled = !S.undo.length; $('#bRedo').disabled = !S.redo.length; }

/* ============ التحريك المباشر من المعاينة ============ */
function updateGizmo(){
  const gz = $('#gz'), c = selClip(), bb = c && BB.get(c.id);
  if (!bb || S.exporting){ gz.style.display = 'none'; return; }
  const k = cv.clientWidth / cv.width;
  gz.style.display = 'block'; gz.style.left = bb.cx * k + 'px'; gz.style.top = bb.cy * k + 'px';
  gz.style.width = Math.max(10, bb.w * k) + 'px'; gz.style.height = Math.max(10, bb.h * k) + 'px'; gz.style.transform = `translate(-50%,-50%) rotate(${bb.rot}deg)`;
}
const toCv = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
function hitTest(px, py){
  for (const tr of drawOrder().reverse()){
    for (let i = S.clips.length - 1; i >= 0; i--){
      const c = S.clips[i], bb = BB.get(c.id); if (c.track !== tr.id || !bb) continue;
      const a = -bb.rot * Math.PI / 180, dx = px - bb.cx, dy = py - bb.cy, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(lx) <= bb.w / 2 && Math.abs(ly) <= bb.h / 2) return c;
    }
  }
  return null;
}
function dragLoop(onMove){
  let moved = false;
  const mv = ev => { moved = true; onMove(ev); render(); }, up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (moved) commit(); else { renderInspector(); renderTimeline(); } };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
}
function startMove(e, c){
  const [sx, sy] = toCv(e), x0 = val(c, 'x'), y0 = val(c, 'y'); if (c.type === 'audio') return;
  dragLoop(ev => { const [px, py] = toCv(ev); setVal(c, 'x', x0 + (px - sx) / cv.width * 100); setVal(c, 'y', y0 + (py - sy) / cv.height * 100); });
}
function startHandle(e, c, h){
  const bb = BB.get(c.id); if (!bb) return;
  const [sx, sy] = toCv(e), d0 = Math.max(5, Math.hypot(sx - bb.cx, sy - bb.cy)), a0 = Math.atan2(sy - bb.cy, sx - bb.cx), r0 = val(c, 'rotate');
  const s0 = {scale:c.p.scale && val(c, 'scale'), size:c.type === 'text' && val(c, 'size'), w:c.type === 'shape' && val(c, 'w'), hh:c.type === 'shape' && val(c, 'h')};
  dragLoop(ev => {
    const [px, py] = toCv(ev);
    if (h === 'rot'){ setVal(c, 'rotate', Math.round(r0 + (Math.atan2(py - bb.cy, px - bb.cx) - a0) * 180 / Math.PI)); return; }
    const r = clamp(Math.hypot(px - bb.cx, py - bb.cy) / d0, .05, 20);
    if (c.type === 'text') setVal(c, 'size', clamp(s0.size * r, 1, 60)); else if (c.type === 'shape'){ setVal(c, 'w', clamp(s0.w * r, .5, 300)); setVal(c, 'h', clamp(s0.hh * r, .3, 300)); }
    else if (s0.scale) setVal(c, 'scale', clamp(s0.scale * r, 5, 800));
  });
}
cv.addEventListener('pointerdown', e => {
  const [px, py] = toCv(e), c = hitTest(px, py);
  if (!c){ S.sel = null; renderInspector(); renderTimeline(); return; }
  S.sel = c.id; renderInspector(); document.querySelectorAll('.clip').forEach(x => x.classList.remove('sel')); startMove(e, c);
});
$('#gz').addEventListener('pointerdown', e => { const c = selClip(); if (!c) return; e.preventDefault(); e.stopPropagation(); const h = e.target.dataset.h; h ? startHandle(e, c, h) : startMove(e, c); });

/* ============ التسجيل الصوتي ============ */
let mrec = null;
async function toggleRec(){
  if (mrec){ mrec.stop(); return; }
  try {
    const st = await navigator.mediaDevices.getUserMedia({audio:true}), ch = []; mrec = new MediaRecorder(st); $('#bRec').classList.add('rec'); $('#bRec').textContent = '⏹ إيقاف التسجيل';
    const at = S.t; mrec.ondataavailable = e => ch.push(e.data);
    mrec.onstop = () => { st.getTracks().forEach(t => t.stop()); $('#bRec').classList.remove('rec'); $('#bRec').textContent = '🎙 تسجيل'; mrec = null;
      const f = new File(ch, 'تعليق صوتي.webm', {type:'audio/webm'}); addFiles([f]); setTimeout(() => { const m = S.media[S.media.length - 1]; if (m) addClip(m, defTrack('audio'), at); }, 900); };
    mrec.start();
  } catch (_) { alert('تعذّر الوصول للميكروفون'); }
}

/* ============ التصدير والمشاريع ============ */
let recorder = null, chunks = [], exportCancel = false, exTimer = 0;
function startExport(){
  if (!S.clips.length) return alert('أضف مقاطع للتايملاين أولاً');
  pause(); ensureAudio(); actx.resume();
  const stream = cv.captureStream(+S.fps);
  recDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  const mime = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || '';
  recorder = new MediaRecorder(stream, {mimeType:mime, videoBitsPerSecond:S.res >= 1080 ? 12e6 : 6e6});
  chunks = []; exportCancel = false;
  recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    $('#ov').style.display = 'none'; S.exporting = false; clearInterval(exTimer);
    if (exportCancel) return;
    dl(new Blob(chunks, {type:recorder.mimeType || mime}), 'video.' + ((recorder.mimeType || mime).includes('mp4') ? 'mp4' : 'webm'));
  };
  S.exporting = true; $('#ov').style.display = 'grid'; seek(0);
  setTimeout(() => { recorder.start(250); play(); }, 400);
  exTimer = setInterval(() => { $('#bar i').style.width = (S.t / total() * 100) + '%'; }, 200);
}
function finishExport(){ setTimeout(() => recorder && recorder.state !== 'inactive' && recorder.stop(), 300); }
$('#ovc').onclick = () => { exportCancel = true; pause(); if (recorder && recorder.state !== 'inactive') recorder.stop(); };

$('#bSave').onclick = () => dl(new Blob([JSON.stringify({v:2, aspect:S.aspect, res:S.res, fps:S.fps, tracks:TRACKS, markers:S.markers,
  media:S.media.map(m => ({id:m.id, name:m.name, type:m.type, dur:m.dur})), clips:S.clips})], {type:'application/json'}), 'project.json');
$('#bLoad').onclick = () => $('#projFile').click();
$('#projFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    S.aspect = d.aspect; S.res = d.res; S.fps = d.fps; $('#aspect').value = S.aspect; $('#res').value = S.res; $('#fps').value = S.fps;
    if (d.tracks) TRACKS = d.tracks; S.markers = d.markers || [];
    const have = new Map(S.media.map(m => [m.name, m])), idMap = {}, missing = [];
    for (const m of d.media){ const h = have.get(m.name); if (h) idMap[m.id] = h.id; else missing.push(m.name); }
    S.clips = d.clips.filter(c => NOEL.has(c.type) || idMap[c.mediaId]).map(c => NOEL.has(c.type) ? c : {...c, mediaId:idMap[c.mediaId]});
    S.sel = null; syncEls(); applyCanvas(); commit();
    if (missing.length) alert('استورد هذه الملفات أولاً ثم افتح المشروع مرة ثانية:\n' + missing.join('\n'));
  } catch (_) { alert('ملف مشروع غير صالح'); }
  e.target.value = '';
};

/* ============ ربط الأزرار والاختصارات ============ */
$('#file').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
const dz = $('#drop');
dz.onclick = () => $('#file').click();
['dragenter', 'dragover'].forEach(n => addEventListener(n, e => { if (e.dataTransfer?.types?.includes('Files')){ e.preventDefault(); dz.classList.add('over'); } }));
['dragleave', 'drop'].forEach(n => addEventListener(n, () => dz.classList.remove('over')));
addEventListener('drop', e => { if (e.dataTransfer?.files?.length){ e.preventDefault(); addFiles(e.dataTransfer.files); } });
$('#bPlay').onclick = () => S.playing ? pause() : play();
$('#bStart').onclick = () => seek(0); $('#bEnd').onclick = () => seek(total());
$('#bBack').onclick = () => seek(S.t - 1 / S.fps); $('#bFwd').onclick = () => seek(S.t + 1 / S.fps);
$('#bLoop').onclick = () => { S.loop = !S.loop; $('#bLoop').classList.toggle('on', S.loop); };
$('#bSplit').onclick = splitAt; $('#bDel').onclick = () => delClip(false); $('#bRipple').onclick = () => delClip(true);
$('#bDup').onclick = dupClip; $('#bText').onclick = () => addText(0); $('#bFreeze').onclick = freezeFrame;
$('#bSilence').onclick = silenceDialog; $('#bTrans').onclick = transitionDialog; $('#bBeats').onclick = detectBeats; $('#bMark').onclick = addMarker;
$('#bSrt').onclick = () => $('#srtFile').click(); $('#srtFile').onchange = async e => { const f = e.target.files[0]; if (f) importSrt(await f.text()); e.target.value = ''; };
$('#bSrtOut').onclick = exportSrt; $('#bRec').onclick = toggleRec;
$('#bShot').onclick = () => { const was = S.sel; render(); cv.toBlob(b => dl(b, 'frame.png')); };
$('#bSafe').onclick = () => { $('#safe').classList.toggle('on'); $('#bSafe').classList.toggle('on'); };
$('#addTrack').onchange = e => { if (e.target.value) addTrack(e.target.value); e.target.value = ''; };
$('#bUndo').onclick = undo; $('#bRedo').onclick = redo; $('#bExport').onclick = startExport;
$('#aspect').onchange = e => { S.aspect = e.target.value; applyCanvas(); };
$('#res').onchange = e => { S.res = +e.target.value; applyCanvas(); };
$('#fps').onchange = e => { S.fps = +e.target.value; };
$('#zoom').oninput = e => { S.zoom = +e.target.value; renderTimeline(); };
$('#bFit').onclick = () => { const z = clamp(($('#scroll').clientWidth - 40) / Math.max(1, total()), 10, 300); S.zoom = z; $('#zoom').value = z; renderTimeline(); };
addEventListener('resize', () => { fitStage(); render(); });
addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (/INPUT|TEXTAREA|SELECT/.test(tag) && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox') return;
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (e.code === 'Space'){ e.preventDefault(); S.playing ? pause() : play(); }
  else if (k === 's' && !mod) splitAt();
  else if (k === 'm' && !mod) addMarker();
  else if (k === 'delete' || k === 'backspace'){ e.preventDefault(); delClip(e.shiftKey); }
  else if (k === 'z' && mod){ e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (k === 'y' && mod){ e.preventDefault(); redo(); }
  else if (k === 'd' && mod){ e.preventDefault(); dupClip(); }
  else if (k === 'c' && mod){ e.preventDefault(); copyClip(); }
  else if (k === 'v' && mod){ e.preventDefault(); pasteClip(); }
  else if (k === 'arrowleft'){ e.preventDefault(); seek(S.t - (e.shiftKey ? 1 : 1 / S.fps)); }
  else if (k === 'arrowright'){ e.preventDefault(); seek(S.t + (e.shiftKey ? 1 : 1 / S.fps)); }
  else if (k === 'home') seek(0); else if (k === 'end') seek(total());
});
window.__S = S; window.__T = () => TRACKS;
lastSnap = snapshot(); buildSidebar(); applyCanvas(); refresh();
