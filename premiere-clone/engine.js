'use strict';
/* ============ الحالة العامة ============ */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let uid = 1;
let TRACKS = [
  {id:'G1', kind:'gfx',   label:'جرافيك 1'},
  {id:'V2', kind:'video', label:'فيديو 2'},
  {id:'V1', kind:'video', label:'فيديو 1'},
  {id:'A1', kind:'audio', label:'صوت 1'},
  {id:'A2', kind:'audio', label:'صوت 2'},
];
const S = {media:[], clips:[], markers:[], sel:null, t:0, playing:false, zoom:80, aspect:'9:16', res:720, fps:30,
           undo:[], redo:[], exporting:false, muted:{}, hidden:{}, loop:false, multi:new Set(), pending:[]};
const cv = $('#cv'), ctx = cv.getContext('2d');
const els = new Map();                  // clip.id -> عنصر الوسائط
const BB = new Map();                   // clip.id -> صندوق الإحاطة (للتحريك من المعاينة)
const NOEL = new Set(['text', 'shape', 'fx', 'adjust']);
let actx, recDest;

const fmt = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + s.toFixed(2).padStart(5, '0'); };
const total = () => S.clips.reduce((m, c) => Math.max(m, c.start + c.dur), 0);
const mediaOf = c => S.media.find(m => m.id === c.mediaId);
const kindOf = c => c.type === 'audio' ? 'audio' : (c.type === 'video' || c.type === 'image') ? 'video' : 'gfx';
const trackKind = id => (TRACKS.find(t => t.id === id) || {}).kind;
const selClip = () => S.clips.find(c => c.id === S.sel);
const drawOrder = () => [...TRACKS].reverse().filter(t => t.kind !== 'audio');
function defTrack(kind){
  const l = TRACKS.filter(t => t.kind === kind);
  return (kind === 'audio' ? l[0] : l[l.length - 1]).id;
}
function gfxTrack(i){                   // i = 0 الأدنى
  let l = TRACKS.filter(t => t.kind === 'gfx');
  while (l.length <= i){ addTrack('gfx', true); l = TRACKS.filter(t => t.kind === 'gfx'); }
  return l[l.length - 1 - i].id;
}
function addTrack(kind, silent){
  const n = TRACKS.filter(t => t.kind === kind).length + 1;
  const tr = {id:(kind === 'video' ? 'V' : kind === 'gfx' ? 'G' : 'A') + (uid++), kind, label:({video:'فيديو', gfx:'جرافيك', audio:'صوت'})[kind] + ' ' + n};
  if (kind === 'audio') TRACKS.push(tr);
  else TRACKS.splice(kind === 'gfx' ? 0 : Math.max(0, TRACKS.findIndex(t => t.kind === 'video')), 0, tr);
  if (!silent) commit();
}

/* ============ لوحات رسم داخلية ============ */
const LY = document.createElement('canvas'), lg = LY.getContext('2d', {willReadFrequently:true});
const TM = document.createElement('canvas'), tg = TM.getContext('2d', {willReadFrequently:true});
const SN = document.createElement('canvas'), sg = SN.getContext('2d');
const NOISE = [0, 1, 2, 3].map(() => { const n = document.createElement('canvas'); n.width = n.height = 192; const g = n.getContext('2d'), d = g.createImageData(192, 192);
  for (let i = 0; i < d.data.length; i += 4){ const v = Math.random() * 255; d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255; } g.putImageData(d, 0, 0); return n; });
function canvasSize(){
  const [a, b] = S.aspect.split(':').map(Number), r = +S.res;
  return a < b ? [Math.round(r), Math.round(r * b / a)] : a > b ? [Math.round(r * a / b), Math.round(r)] : [r, r];
}
function applyCanvas(){
  const [w, h] = canvasSize();
  for (const c of [cv, LY, TM, SN]){ c.width = w; c.height = h; }
  fitStage(); render();
}
function fitStage(){
  const st = $('#stage'), [w, h] = canvasSize(), r = w / h, wr = $('#wrap');
  const aw = st.clientWidth - 20, ah = st.clientHeight - 20;
  let cw = aw, ch = aw / r; if (ch > ah){ ch = ah; cw = ah * r; }
  wr.style.width = cw + 'px'; wr.style.height = ch + 'px';
}

/* ============ تراجع/إعادة ============ */
let lastSnap = '';
const snapshot = () => JSON.stringify({clips:S.clips, tracks:TRACKS, markers:S.markers});
function commit(){
  const snap = snapshot();
  if (snap === lastSnap) return;
  S.undo.push(lastSnap); if (S.undo.length > 100) S.undo.shift();
  S.redo = []; lastSnap = snap; refresh();
  if (typeof autosave === 'function') autosave();
}
function restore(snap){
  const d = JSON.parse(snap); S.clips = d.clips; TRACKS = d.tracks; S.markers = d.markers || []; lastSnap = snap;
  if (!S.clips.find(c => c.id === S.sel)) S.sel = null; syncEls(); refresh();
}
function undo(){ if (!S.undo.length) return; S.redo.push(lastSnap); restore(S.undo.pop()); }
function redo(){ if (!S.redo.length) return; S.undo.push(lastSnap); restore(S.redo.pop()); }

/* ============ مفاتيح الحركة ============ */
const KF = new Set(['scale','x','y','rotate','size','opacity','w','h','volume','brightness','contrast','saturate','hue','blur','vignette','grain','rgb','pixel','temp','sepia','gray','radius','strokeW','glow','shadow']);
function val(c, k){
  const a = c.kf && c.kf[k];
  if (!a || !a.length) return c.p[k];
  const t = S.t - c.start;
  if (t <= a[0].t) return a[0].v;
  const L = a[a.length - 1]; if (t >= L.t) return L.v;
  let i = 1; while (a[i].t < t) i++;
  const A = a[i-1], B = a[i]; let u = (t - A.t) / (B.t - A.t);
  const ez = c.p.ease;
  if (A.b) u = bezierY(A.b, u);
  else if (ez === 'linear'){} else if (ez === 'in') u = u * u * u; else if (ez === 'out') u = 1 - Math.pow(1 - u, 3);
  else if (ez === 'bounce') u = E.bounce(u); else if (ez === 'elastic') u = E.elastic(u); else if (ez === 'hold') u = u < 1 ? 0 : 1; else u = u * u * (3 - 2 * u);
  return A.v + (B.v - A.v) * u;
}
const CURVES = {linear:[0, 0, 1, 1], ease:[.25, .1, .25, 1], in:[.42, 0, 1, 1], out:[0, 0, .58, 1], inout:[.42, 0, .58, 1], back:[.34, 1.56, .64, 1], snap:[.9, 0, .1, 1]};
function bezierY(b, x){
  if (x <= 0) return 0; if (x >= 1) return 1;
  const [x1, y1, x2, y2] = b, bx = t => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t, by = t => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let lo = 0, hi = 1, t = x; for (let i = 0; i < 24; i++){ t = (lo + hi) / 2; bx(t) < x ? lo = t : hi = t; }
  return by(t);
}
const kfAt = (c, k) => (c.kf && c.kf[k] || []).findIndex(f => Math.abs(f.t - (S.t - c.start)) < .04);
function setKf(c, k, v){
  c.kf = c.kf || {}; const a = c.kf[k] = c.kf[k] || [], t = clamp(S.t - c.start, 0, c.dur), i = kfAt(c, k);
  if (i >= 0) a[i].v = v; else { a.push({t, v}); a.sort((x, y) => x.t - y.t); }
}
function setVal(c, k, v){ KF.has(k) && c.kf && c.kf[k] && c.kf[k].length ? setKf(c, k, v) : (c.p[k] = v); }
function toggleKf(c, k){
  const i = kfAt(c, k);
  if (i >= 0){ const a = c.kf[k]; c.p[k] = a[i].v; a.splice(i, 1); if (!a.length) delete c.kf[k]; }
  else setKf(c, k, val(c, k));
}

/* ============ القيم الافتراضية ============ */
const EFFECT_DEF = {look:'none', brightness:100, contrast:100, saturate:100, hue:0, sepia:0, gray:0, temp:0, blur:0, vignette:0, grain:0, rgb:0, pixel:0,
                    chroma:false, chromaColor:'#00ff00', chromaTol:40, chromaSoft:15};
const ANIM_DEF = {aIn:'none', aInDur:.6, aOut:'none', aOutDur:.6, aLoop:'none', aLoopAmt:50, ease:'smooth', fadeIn:0, fadeOut:0, opacity:100, blend:'source-over'};
function defaults(type){
  switch (type){
    case 'audio': return {volume:100, duck:0, bass:0, treble:0, echo:0, fadeIn:0, fadeOut:0, ease:'smooth'};
    case 'text': return {...ANIM_DEF, text:'نص جديد', font:'Cairo', weight:'900', size:8, align:'center', color:'#ffffff', grad:false, color2:'#ffd23f',
      stroke:'#000000', strokeW:6, shadow:0, shadowColor:'#000000', glow:0, glowColor:'#7b61ff', ls:0, lh:1.35, bg:false, bgColor:'#000000', bgOp:60,
      hl:'none', hlColor:'#ffd23f', counter:false, cFrom:0, cTo:100, cPrefix:'', cSuffix:'', cDec:0, cDur:2, x:50, y:75, rotate:0, fadeIn:.2, fadeOut:.2};
    case 'shape': return {...ANIM_DEF, shape:'rect', w:40, h:10, x:50, y:50, rotate:0, fill:'#7b61ff', grad:false, fill2:'#00d1b2', gradAngle:90,
      stroke:'#ffffff', strokeW:0, radius:20, shadow:0};
    case 'fx': return {kind:'confetti', count:60, speed:50, size:50, palette:'rainbow', color:'#ffd23f', emoji:'❤️', x:50, y:50, seed:1, opacity:100, fadeIn:.2, fadeOut:.5, ease:'smooth', blend:'source-over'};
    case 'adjust': return {...ANIM_DEF, ...EFFECT_DEF, look:'cinematic', vignette:35, grain:15};
    default: return {...ANIM_DEF, ...EFFECT_DEF, scale:100, x:0, y:0, rotate:0, fit:'cover', bgBlur:false, flipH:false, flipV:false, mask:'none', maskR:20,
      cl:0, cr:0, ct:0, cb:0, borderW:0, borderColor:'#ffffff', shadow:0, speed:1, volume:100, bass:0, treble:0, echo:0};
  }
}

/* ============ محرّك الحركة (دخول / خروج / مستمرة) ============ */
const E = {
  out: u => 1 - Math.pow(1 - u, 3),
  back: u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
  bounce: u => { const n = 7.5625, d = 2.75; if (u < 1/d) return n*u*u; if (u < 2/d) return n*(u -= 1.5/d)*u + .75; if (u < 2.5/d) return n*(u -= 2.25/d)*u + .9375; return n*(u -= 2.625/d)*u + .984375; },
  elastic: u => u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -10*u) * Math.sin((u*10 - .75) * (2*Math.PI) / 3) + 1,
};
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function enterAnim(st, type, u){
  u = clamp(u, 0, 1); const e = E.out(u);
  switch (type){
    case 'fade': st.al *= u; break;
    case 'slideR': st.dx += 1 - e; st.al *= Math.min(1, u * 3); break;
    case 'slideL': st.dx -= 1 - e; st.al *= Math.min(1, u * 3); break;
    case 'slideU': st.dy -= 1 - e; st.al *= Math.min(1, u * 3); break;
    case 'slideD': st.dy += 1 - e; st.al *= Math.min(1, u * 3); break;
    case 'zoomIn': st.sc *= .3 + .7 * e; st.al *= Math.min(1, u * 2); break;
    case 'zoomOut': st.sc *= 1.7 - .7 * e; st.al *= Math.min(1, u * 2); break;
    case 'pop': st.sc *= Math.max(.001, E.back(u)); st.al *= Math.min(1, u * 4); break;
    case 'bounce': st.dy -= (1 - E.bounce(u)) * .4; st.al *= Math.min(1, u * 5); break;
    case 'elastic': st.sc *= Math.max(.001, E.elastic(u)); break;
    case 'spin': st.rot += (1 - e) * 360; st.sc *= Math.max(.001, e); break;
    case 'flip': st.sx *= Math.max(.001, e); break;
    case 'blur': st.blur += (1 - u) * 40; st.al *= u; break;
    case 'rise': st.dy += (1 - e) * .08; st.al *= u; break;
    case 'drop': st.dy -= (1 - e) * .08; st.al *= u; break;
    case 'wipeR': st.wipe = {d:'r', k:e}; break;
    case 'wipeL': st.wipe = {d:'l', k:e}; break;
    case 'wipeD': st.wipe = {d:'d', k:e}; break;
    case 'wipeU': st.wipe = {d:'u', k:e}; break;
    case 'glitch': { const g = 1 - u; st.glitch = Math.max(st.glitch, g); st.dx += Math.sin(S.t * 97) * .03 * g; st.al *= u < .15 ? .6 : 1; break; }
    case 'typewriter': case 'words': st.reveal = Math.min(st.reveal, u); st.revType = type; break;
  }
}
function animState(c){
  const p = c.p, t = S.t - c.start, st = {dx:0, dy:0, sc:1, sx:1, rot:0, al:1, blur:0, wipe:null, glitch:0, reveal:1, revType:null};
  if (p.aIn && p.aIn !== 'none' && t < p.aInDur) enterAnim(st, p.aIn, t / p.aInDur);
  const rem = c.dur - t;
  if (p.aOut && p.aOut !== 'none' && rem < p.aOutDur && p.aOut !== 'typewriter' && p.aOut !== 'words') enterAnim(st, p.aOut, rem / p.aOutDur);
  if (p.aLoop && p.aLoop !== 'none'){
    const a = (p.aLoopAmt ?? 50) / 50, T = S.t;
    switch (p.aLoop){
      case 'pulse': st.sc *= 1 + .08 * a * Math.sin(2 * Math.PI * 1.2 * t); break;
      case 'float': st.dy += .015 * a * Math.sin(2 * Math.PI * .5 * t); break;
      case 'shake': st.dx += .008 * a * (rnd(Math.floor(T * 30), 1) - .5) * 2; st.dy += .008 * a * (rnd(Math.floor(T * 30), 2) - .5) * 2; break;
      case 'wiggle': st.rot += 4 * a * Math.sin(2 * Math.PI * 1.5 * t); break;
      case 'spin': st.rot += t * 60 * a; break;
      case 'heartbeat': st.sc *= 1 + .1 * a * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * t)), 8); break;
      case 'sway': st.dx += .02 * a * Math.sin(2 * Math.PI * .6 * t); break;
      case 'flicker': st.al *= .7 + .3 * rnd(Math.floor(T * 18), 3); break;
      case 'kenburns': st.sc *= 1 + .15 * a * (t / Math.max(.1, c.dur)); break;
      case 'panL': st.dx -= (t / Math.max(.1, c.dur) - .5) * .1 * a; st.sc *= 1.1; break;
      case 'panR': st.dx += (t / Math.max(.1, c.dur) - .5) * .1 * a; st.sc *= 1.1; break;
    }
  }
  return st;
}
function fadeFactor(c){
  const t = S.t - c.start, p = c.p; let f = 1;
  if (p.fadeIn > 0 && t < p.fadeIn) f = Math.min(f, t / p.fadeIn);
  if (p.fadeOut > 0 && c.dur - t < p.fadeOut) f = Math.min(f, (c.dur - t) / p.fadeOut);
  return clamp(f, 0, 1);
}
function wipeClip(g, w, W, H){
  g.beginPath();
  if (w.d === 'r') g.rect(0, 0, W * w.k, H); else if (w.d === 'l') g.rect(W * (1 - w.k), 0, W * w.k, H);
  else if (w.d === 'd') g.rect(0, 0, W, H * w.k); else g.rect(0, H * (1 - w.k), W, H * w.k);
  g.clip();
}

/* ============ مؤثرات الألوان والصورة ============ */
const LOOKS = {
  none:{n:'بدون'},
  cinematic:{n:'سينمائي', f:'contrast(115%) saturate(85%) brightness(96%)', tint:['#0b3d5c', 'soft-light', .45]},
  warm:{n:'دافئ', f:'saturate(110%) contrast(105%)', tint:['#ff9a3c', 'soft-light', .35]},
  cool:{n:'بارد', f:'saturate(95%)', tint:['#3c8bff', 'soft-light', .35]},
  vintage:{n:'قديم', f:'sepia(55%) contrast(95%) saturate(90%) brightness(105%)', tint:['#d9a066', 'multiply', .22]},
  noir:{n:'أبيض وأسود', f:'grayscale(100%) contrast(125%)'},
  vivid:{n:'نابض', f:'saturate(160%) contrast(112%)'},
  fade:{n:'باهت', f:'contrast(85%) saturate(80%) brightness(110%)'},
  tealorange:{n:'تيل وبرتقالي', f:'contrast(112%) saturate(115%)', tint:['#0f7c8c', 'soft-light', .35]},
  dream:{n:'حالم', f:'brightness(110%) saturate(115%) contrast(90%) blur(1px)'},
  cyber:{n:'سايبر', f:'saturate(150%) contrast(115%) hue-rotate(-20deg)', tint:['#ff2bd6', 'soft-light', .3]},
};
function filterStr(c, extraBlur){
  const V = k => val(c, k), f = [], L = LOOKS[c.p.look], W = cv.width;
  if (L && L.f) f.push(L.f);
  if (V('brightness') !== 100) f.push(`brightness(${V('brightness')}%)`);
  if (V('contrast') !== 100) f.push(`contrast(${V('contrast')}%)`);
  if (V('saturate') !== 100) f.push(`saturate(${V('saturate')}%)`);
  if (V('hue')) f.push(`hue-rotate(${V('hue')}deg)`);
  if (V('sepia') > 0) f.push(`sepia(${V('sepia')}%)`);
  if (V('gray') > 0) f.push(`grayscale(${V('gray')}%)`);
  const bl = V('blur') / 100 * W * .05 + (extraBlur || 0) / 100 * W * .05; if (bl > .2) f.push(`blur(${bl}px)`);
  return f.length ? f.join(' ') : 'none';
}
const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function tintOver(g, color, mode, alpha){
  const W = LY.width, H = LY.height;
  tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'copy'; tg.drawImage(LY, 0, 0);           // نسخ الشفافية
  g.save(); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.fillStyle = color; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'destination-in'; g.drawImage(TM, 0, 0); g.restore();
}
function postFx(g, c, bb){
  const V = k => val(c, k), W = LY.width, H = LY.height, p = c.p;
  if (p.chroma){
    const id = g.getImageData(0, 0, W, H), d = id.data, [kr, kg, kb] = hex2rgb(p.chromaColor), tol = V('chromaTol') / 100 * 300, soft = Math.max(1, p.chromaSoft / 100 * 300);
    for (let i = 0; i < d.length; i += 4){
      if (!d[i+3]) continue;
      const dr = d[i] - kr, dg = d[i+1] - kg, db = d[i+2] - kb, dist = Math.sqrt(dr*dr + dg*dg + db*db);
      if (dist < tol) d[i+3] = 0; else if (dist < tol + soft){ const k = (dist - tol) / soft; d[i+3] *= k; if (kg > kr && kg > kb) d[i+1] = Math.min(d[i+1], (d[i] + d[i+2]) / 2 + 20 * k); }
    }
    g.putImageData(id, 0, 0);
  }
  const px = V('pixel');
  if (px > 0){
    const k = Math.max(2, Math.round(px / 100 * 36)), tw = Math.max(1, Math.round(W / k)), th = Math.max(1, Math.round(H / k));
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'copy'; tg.drawImage(LY, 0, 0, W, H, 0, 0, tw, th);
    g.save(); g.globalCompositeOperation = 'copy'; g.imageSmoothingEnabled = false; g.drawImage(TM, 0, 0, tw, th, 0, 0, W, H); g.restore();
  }
  const rg = V('rgb');
  if (rg > 0){
    const off = Math.max(1, Math.round(rg / 100 * W * .03)), id = g.getImageData(0, 0, W, H), d = id.data, s = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++){ const row = y * W;
      for (let x = 0; x < W; x++){ const i = (row + x) * 4, xr = Math.min(W - 1, x + off), xb = Math.max(0, x - off);
        d[i] = s[(row + xr) * 4]; d[i+2] = s[(row + xb) * 4 + 2]; d[i+3] = Math.max(s[i+3], s[(row + xr) * 4 + 3], s[(row + xb) * 4 + 3]); } }
    g.putImageData(id, 0, 0);
  }
  const L = LOOKS[p.look]; if (L && L.tint) tintOver(g, L.tint[0], L.tint[1], L.tint[2]);
  const tp = V('temp'); if (tp) tintOver(g, tp > 0 ? '#ff8a00' : '#2d7bff', 'soft-light', Math.min(1, Math.abs(tp) / 100 * .7));
  const vg = V('vignette');
  if (vg > 0){
    const r = Math.max(bb.w, bb.h) * .75, gr = g.createRadialGradient(bb.cx, bb.cy, r * .35, bb.cx, bb.cy, r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${vg / 100 * .9})`);
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
  const gn = V('grain');
  if (gn > 0){
    g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = gn / 100 * .45;
    g.fillStyle = g.createPattern(NOISE[Math.floor(S.t * 24) % 4], 'repeat'); g.fillRect(0, 0, W, H); g.restore();
  }
}

/* ============ الرسم ============ */
function startLayer(){ lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.filter = 'none'; lg.clearRect(0, 0, LY.width, LY.height); }
function compositeLayer(c, f, st){
  const V = k => val(c, k), W = cv.width;
  ctx.save();
  ctx.globalAlpha = clamp(V('opacity') / 100 * f * st.al, 0, 1); ctx.globalCompositeOperation = c.p.blend || 'source-over';
  if (c.p.shadow > 0 || (c.kf && c.kf.shadow)){ const sh = V('shadow'); if (sh > 0){ ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = sh / 100 * W * .06; ctx.shadowOffsetY = sh / 100 * W * .015; } }
  ctx.drawImage(LY, 0, 0);
  if (st.glitch > .05){
    const H = cv.height, seed = Math.floor(S.t * 20);
    for (let i = 0; i < 6; i++){ const sy = rnd(seed, i) * H, sh = rnd(seed, i + 9) * H * .08 + 4, off = (rnd(seed, i + 20) - .5) * W * .12 * st.glitch;
      ctx.drawImage(LY, 0, sy, W, sh, off, sy, W, sh); }
  }
  ctx.restore();
}
function drawVisual(c, f){
  const e = els.get(c.id); if (!e) return;
  const w = e.videoWidth || e.naturalWidth, h = e.videoHeight || e.naturalHeight; if (!w || !h) return;
  const p = c.p, V = k => val(c, k), W = cv.width, H = cv.height, st = animState(c);
  const base = p.fit === 'cover' ? Math.max(W / w, H / h) : Math.min(W / w, H / h), s = base * V('scale') / 100, dw = w * s, dh = h * s;
  startLayer(); lg.save();
  if (st.wipe) wipeClip(lg, st.wipe, W, H);
  if (p.fit === 'contain' && p.bgBlur){ lg.save(); lg.filter = `blur(${W * .03}px) brightness(70%)`; const bs = Math.max(W / w, H / h) * 1.15; lg.drawImage(e, W / 2 - w * bs / 2, H / 2 - h * bs / 2, w * bs, h * bs); lg.restore(); }
  const cx = W / 2 + V('x') / 100 * W + st.dx * W, cy = H / 2 + V('y') / 100 * H + st.dy * H;
  lg.translate(cx, cy); lg.rotate((V('rotate') + st.rot) * Math.PI / 180); lg.scale((p.flipH ? -1 : 1) * st.sx * st.sc, (p.flipV ? -1 : 1) * st.sc);
  const x0 = -dw / 2 + dw * p.cl / 100, x1 = dw / 2 - dw * p.cr / 100, y0 = -dh / 2 + dh * p.ct / 100, y1 = dh / 2 - dh * p.cb / 100, rw = x1 - x0, rh = y1 - y0;
  const shapePath = () => { lg.beginPath();
    if (p.mask === 'circle') lg.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.min(rw, rh) / 2, Math.min(rw, rh) / 2, 0, 0, Math.PI * 2);
    else if (p.mask === 'rounded') lg.roundRect(x0, y0, rw, rh, V('radius') ? V('radius') / 100 * Math.min(rw, rh) / 2 : p.maskR / 100 * Math.min(rw, rh) / 2);
    else lg.rect(x0, y0, rw, rh); };
  const masked = p.mask !== 'none' || p.cl || p.cr || p.ct || p.cb;
  if (masked){ shapePath(); lg.clip(); }
  lg.filter = filterStr(c, st.blur); lg.drawImage(e, -dw / 2, -dh / 2, dw, dh); lg.filter = 'none';
  if (p.borderW > 0){ shapePath(); lg.lineWidth = p.borderW / 100 * W * .05 * 2; lg.strokeStyle = p.borderColor; lg.stroke(); }
  lg.restore();
  const bb = {cx:cx + ((x0 + x1) / 2) * st.sc, cy:cy + ((y0 + y1) / 2) * st.sc, w:rw * st.sc * st.sx, h:rh * st.sc, rot:V('rotate') + st.rot};
  BB.set(c.id, bb);
  postFx(lg, c, bb);
  compositeLayer(c, f, st);
}
function drawAdjust(c, f){
  const W = cv.width, H = cv.height, st = animState(c);
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'copy'; sg.drawImage(cv, 0, 0);
  startLayer(); lg.filter = filterStr(c, st.blur); lg.drawImage(SN, 0, 0); lg.filter = 'none';
  postFx(lg, c, {cx:W / 2, cy:H / 2, w:W, h:H});
  ctx.save(); ctx.globalAlpha = clamp(val(c, 'opacity') / 100 * f * st.al, 0, 1); ctx.drawImage(LY, 0, 0); ctx.restore();
}

/* --- الأشكال --- */
function shapePath2(g, shape, w, h, r){
  g.beginPath();
  switch (shape){
    case 'circle': g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); break;
    case 'triangle': g.moveTo(0, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); break;
    case 'star': for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? .42 : 1; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr * w / 2, Math.sin(a) * rr * h / 2); } g.closePath(); break;
    case 'arrow': [[-.5,-.2],[.1,-.2],[.1,-.5],[.5,0],[.1,.5],[.1,.2],[-.5,.2]].forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x * w, y * h)); g.closePath(); break;
    case 'heart': g.moveTo(0, h * .5); g.bezierCurveTo(-w * .65, h * .05, -w * .5, -h * .55, 0, -h * .2); g.bezierCurveTo(w * .5, -h * .55, w * .65, h * .05, 0, h * .5); g.closePath(); break;
    case 'line': g.roundRect(-w / 2, -h / 2, w, h, h / 2); break;
    default: g.roundRect(-w / 2, -h / 2, w, h, r);
  }
}
function drawShape(c, f){
  const p = c.p, V = k => val(c, k), W = cv.width, H = cv.height, st = animState(c);
  const w = V('w') / 100 * W, h = V('h') / 100 * H, cx = V('x') / 100 * W + st.dx * W, cy = V('y') / 100 * H + st.dy * H;
  ctx.save(); ctx.globalAlpha = clamp(V('opacity') / 100 * f * st.al, 0, 1); ctx.globalCompositeOperation = p.blend || 'source-over';
  if (st.wipe) wipeClip(ctx, st.wipe, W, H);
  if (st.blur > 0) ctx.filter = `blur(${st.blur / 100 * W * .05}px)`;
  ctx.translate(cx, cy); ctx.rotate((V('rotate') + st.rot) * Math.PI / 180); ctx.scale(st.sc * st.sx, st.sc);
  const r = V('radius') / 100 * Math.min(w, h) / 2;
  let fs = p.fill;
  if (p.grad){ const a = p.gradAngle * Math.PI / 180, dx = Math.cos(a) * w / 2, dy = Math.sin(a) * h / 2; fs = ctx.createLinearGradient(-dx, -dy, dx, dy); fs.addColorStop(0, p.fill); fs.addColorStop(1, p.fill2); }
  if (V('shadow') > 0){ ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = V('shadow') / 100 * W * .06; ctx.shadowOffsetY = V('shadow') / 100 * W * .015; }
  if (p.shape === 'bar'){
    ctx.fillStyle = p.fill2; ctx.globalAlpha *= .35; shapePath2(ctx, 'rect', w, h, r); ctx.fill(); ctx.globalAlpha = clamp(V('opacity') / 100 * f * st.al, 0, 1);
    const k = clamp((S.t - c.start) / Math.max(.1, c.dur), 0, 1); ctx.fillStyle = fs;
    ctx.save(); shapePath2(ctx, 'rect', w, h, r); ctx.clip(); ctx.fillRect(-w / 2, -h / 2, w * k, h); ctx.restore();
  } else { ctx.fillStyle = fs; shapePath2(ctx, p.shape, w, h, r); ctx.fill(); }
  if (V('strokeW') > 0){ ctx.shadowColor = 'transparent'; ctx.lineWidth = V('strokeW') / 100 * W * .05; ctx.strokeStyle = p.stroke; ctx.lineJoin = 'round'; shapePath2(ctx, p.shape === 'bar' ? 'rect' : p.shape, w, h, r); ctx.stroke(); }
  ctx.restore();
  BB.set(c.id, {cx, cy, w:w * st.sc * st.sx, h:h * st.sc, rot:V('rotate') + st.rot});
}

/* --- جسيمات --- */
const PAL = ['#ff4d5e', '#ffd23f', '#00d1b2', '#7b61ff', '#4da6ff', '#ff8ad8'];
const EMO = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
function drawFx(c, f){
  const p = c.p, V = k => val(c, k), W = cv.width, H = cv.height, t = S.t - c.start, n = Math.round(p.count), spd = p.speed / 50, sz = p.size / 50;
  const col = i => p.palette === 'single' ? p.color : PAL[Math.floor(rnd(i, 8) * PAL.length)];
  ctx.save(); ctx.globalAlpha = clamp(V('opacity') / 100 * f, 0, 1); ctx.globalCompositeOperation = p.blend || 'source-over';
  const seed = p.seed * 13.7;
  const R = (i, j) => rnd(i + seed, j);
  const star4 = (x, y, r) => { ctx.beginPath(); for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4, rr = i % 2 ? r * .25 : r; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  for (let i = 0; i < n; i++){
    switch (p.kind){
      case 'confetti': {
        const x = R(i, 1) * W + Math.sin(t * (1 + R(i, 2) * 2) + R(i, 3) * 6) * W * .03, y = ((R(i, 4) * (H + 200) + t * H * .35 * spd * (.6 + R(i, 5))) % (H + 200)) - 100;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * (2 + R(i, 6) * 6) + R(i, 7) * 6); ctx.scale(1, Math.cos(t * (3 + R(i, 9) * 4) + i));
        ctx.fillStyle = col(i + seed); ctx.fillRect(-sz * W * .009, -sz * W * .005, sz * W * .018, sz * W * .01); ctx.restore(); break; }
      case 'snow': {
        const r = (.003 + R(i, 1) * .007) * W * sz, x = R(i, 2) * W + Math.sin(t * .8 + R(i, 3) * 6) * W * .03, y = ((R(i, 4) * (H + 40) + t * H * .12 * spd * (.5 + R(i, 5))) % (H + 40)) - 20;
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); break; }
      case 'rain': {
        const x = R(i, 1) * W, y = ((R(i, 2) * (H + 100) + t * H * 1.1 * spd * (.7 + R(i, 3) * .6)) % (H + 100)) - 50, l = (.02 + R(i, 4) * .03) * H * sz;
        ctx.strokeStyle = 'rgba(200,220,255,.6)'; ctx.lineWidth = Math.max(1, W * .002); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - l * .12, y + l); ctx.stroke(); break; }
      case 'bubbles': {
        const r = (.006 + R(i, 1) * .016) * W * sz, x = R(i, 2) * W + Math.sin(t + R(i, 3) * 6) * W * .03, y = H + 50 - ((R(i, 4) * (H + 100) + t * H * .15 * spd * (.5 + R(i, 5))) % (H + 100));
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(1, W * .003); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break; }
      case 'emoji': {
        const x = R(i, 1) * W + Math.sin(t * 1.3 + R(i, 3) * 6) * W * .04, prog = ((R(i, 4) + t * .12 * spd * (.6 + R(i, 5) * .8)) % 1), y = H + 40 - prog * (H + 120);
        ctx.globalAlpha = clamp(V('opacity') / 100 * f, 0, 1) * Math.min(1, (1 - prog) * 3, prog * 6 + .2);
        ctx.font = `${(.03 + R(i, 6) * .04) * W * sz}px ${EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.emoji, x, y); break; }
      case 'sparkles': {
        const x = R(i, 1) * W, y = R(i, 2) * H, ph = R(i, 3) * 6, a = Math.max(0, Math.sin(t * 3 * spd + ph));
        ctx.fillStyle = col(i + seed); ctx.globalAlpha = clamp(V('opacity') / 100 * f, 0, 1) * a; star4(x, y, (.008 + R(i, 4) * .016) * W * sz * (.5 + a)); break; }
      case 'burst': case 'burstEmoji': {
        const ox = p.x / 100 * W, oy = p.y / 100 * H, ang = R(i, 1) * Math.PI * 2, v = (.15 + .85 * R(i, 2)) * W * .9 * spd, life = Math.max(.5, c.dur * .85);
        const px = ox + Math.cos(ang) * v * t * Math.exp(-t * .6), py = oy + Math.sin(ang) * v * t * Math.exp(-t * .6) + .5 * H * .6 * t * t;
        ctx.globalAlpha = clamp(V('opacity') / 100 * f, 0, 1) * clamp(1 - t / life, 0, 1);
        if (p.kind === 'burstEmoji'){ ctx.font = `${(.03 + R(i, 3) * .03) * W * sz}px ${EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.emoji, px, py); }
        else { ctx.save(); ctx.translate(px, py); ctx.rotate(t * (3 + R(i, 4) * 8)); ctx.fillStyle = col(i + seed); ctx.fillRect(-sz * W * .009, -sz * W * .005, sz * W * .018, sz * W * .01); ctx.restore(); }
        break; }
    }
  }
  if (p.kind === 'flare'){
    const k = clamp(t / Math.max(.1, c.dur), 0, 1), x = (-.3 + 1.6 * k) * W, y = p.y / 100 * H, r = W * .8 * sz, g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, p.palette === 'single' ? p.color : '#ffb347'); g.addColorStop(.4, 'rgba(255,120,50,.35)'); g.addColorStop(1, 'rgba(255,120,50,0)');
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* --- النص --- */
const FONTS = {Cairo:"Cairo,'Segoe UI',Tahoma,Arial,sans-serif", Tajawal:"Tajawal,'Segoe UI',Tahoma,sans-serif", Lalezar:"Lalezar,Cairo,Tahoma,sans-serif",
               sans:"'Segoe UI',Tahoma,Arial,sans-serif", serif:"'Times New Roman',Georgia,serif", mono:"ui-monospace,Menlo,Consolas,monospace", impact:"Impact,'Arial Black',sans-serif"};
const isRtl = s => /[֐-ࣿ]/.test(s);
function textOf(c){
  const p = c.p; if (!p.counter) return p.text;
  const k = E.out(clamp((S.t - c.start) / Math.max(.2, p.cDur), 0, 1)), n = p.cFrom + (p.cTo - p.cFrom) * k;
  return p.cPrefix + n.toLocaleString('en-US', {minimumFractionDigits:p.cDec, maximumFractionDigits:p.cDec}) + p.cSuffix;
}
function wrapText(text, maxW){
  const out = [];
  for (const para of String(text).split('\n')){
    let line = '';
    for (const w of para.split(' ')){
      const test = line ? line + ' ' + w : w;
      if (line && ctx.measureText(test).width > maxW){ out.push(line); line = w; } else line = test;
    }
    out.push(line);
  }
  return out;
}
function drawText(c, f){
  const p = c.p, V = k => val(c, k), W = cv.width, H = cv.height, st = animState(c), size = V('size') / 100 * W, txt = textOf(c);
  if (!txt) return;
  ctx.save(); ctx.globalAlpha = clamp(V('opacity') / 100 * f * st.al, 0, 1); ctx.globalCompositeOperation = p.blend || 'source-over';
  if (st.wipe) wipeClip(ctx, st.wipe, W, H);
  if (st.blur > 0) ctx.filter = `blur(${st.blur / 100 * W * .05}px)`;
  const cx = V('x') / 100 * W + st.dx * W, cy = V('y') / 100 * H + st.dy * H;
  ctx.translate(cx, cy); ctx.rotate((V('rotate') + st.rot) * Math.PI / 180); ctx.scale(st.sc * st.sx, st.sc);
  ctx.font = `${p.weight} ${size}px ${FONTS[p.font] || FONTS.Cairo}`; ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = (p.ls || 0) * size / 100 + 'px'; } catch (_) {}
  const lines = wrapText(txt, W * .9), lh = size * p.lh, h0 = -(lines.length - 1) * lh / 2;
  const widths = lines.map(l => ctx.measureText(l).width), bw = Math.max(...widths), bh = lines.length * lh;
  const left = w => p.align === 'center' ? -w / 2 : p.align === 'left' ? 0 : -w;
  // خلفية
  const bx0 = left(bw);
  if (p.bg){
    ctx.save(); ctx.globalAlpha *= p.bgOp / 100; ctx.fillStyle = p.bgColor; ctx.beginPath(); ctx.roundRect(bx0 - size * .5, -bh / 2 - size * .15, bw + size, bh + size * .3, size * .3); ctx.fill(); ctx.restore();
  }
  let fill = p.color;
  if (p.grad){ fill = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2); fill.addColorStop(0, p.color); fill.addColorStop(1, p.color2); }
  const paint = (str, x, y, col) => {
    if (V('glow') > 0){ ctx.save(); ctx.shadowColor = p.glowColor; ctx.shadowBlur = V('glow') / 100 * size * 1.5; ctx.fillStyle = p.glowColor; ctx.fillText(str, x, y); ctx.fillText(str, x, y); ctx.restore(); }
    const sh = V('shadow');
    if (V('strokeW') > 0){ ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = V('strokeW') / 100 * size * 2; ctx.strokeStyle = p.stroke;
      if (sh > 0){ ctx.shadowColor = p.shadowColor; ctx.shadowBlur = sh / 100 * size; ctx.shadowOffsetY = sh / 100 * size * .3; } ctx.strokeText(str, x, y); ctx.restore(); }
    ctx.save(); if (sh > 0 && !(V('strokeW') > 0)){ ctx.shadowColor = p.shadowColor; ctx.shadowBlur = sh / 100 * size; ctx.shadowOffsetY = sh / 100 * size * .3; }
    ctx.fillStyle = col || fill; ctx.fillText(str, x, y); ctx.restore();
  };
  const wordMode = st.reveal < 1 && st.revType === 'words' || p.hl !== 'none';
  const totalChars = lines.reduce((a, l) => a + l.length, 0), shown = Math.floor(st.reveal * totalChars + 1e-4);
  const totalWords = lines.reduce((a, l) => a + l.split(' ').length, 0), spaceW = ctx.measureText(' ').width;
  const act = Math.floor(clamp((S.t - c.start) / Math.max(.1, c.dur), 0, .9999) * totalWords);
  let consumed = 0, gi = 0;
  lines.forEach((line, i) => {
    const y = h0 + i * lh, rtl = isRtl(line), lw = widths[i], lx = left(lw), rx = lx + lw;
    ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
    if (!wordMode){
      let str = line;
      if (st.reveal < 1 && st.revType === 'typewriter') str = line.slice(0, clamp(shown - consumed, 0, line.length));
      consumed += line.length; if (str) paint(str, rtl ? rx : lx, y);
    } else {
      let cur = rtl ? rx : lx;
      for (const w of line.split(' ')){
        const ww = ctx.measureText(w).width, wx = rtl ? cur : cur;
        let col = null, sc = 1, al = 1;
        if (st.reveal < 1 && st.revType === 'words'){ const k = clamp(st.reveal * totalWords - gi, 0, 1); al = k; sc = .6 + .4 * E.back(k); }
        if (p.hl === 'karaoke' && gi <= act) col = p.hlColor;
        if (p.hl === 'wordpop' && gi === act){ col = p.hlColor; sc *= 1.18; }
        if (al > 0){
          ctx.save(); ctx.globalAlpha *= al; const mx = rtl ? wx - ww / 2 : wx + ww / 2; ctx.translate(mx, y); ctx.scale(sc, sc); ctx.translate(-mx, -y);
          paint(w, wx, y, col); ctx.restore();
        }
        cur += rtl ? -(ww + spaceW) : ww + spaceW; gi++;
      }
    }
  });
  ctx.restore();
  const dxA = p.align === 'center' ? 0 : p.align === 'left' ? bw / 2 : -bw / 2;
  BB.set(c.id, {cx:cx + dxA * st.sc, cy, w:(bw + size) * st.sc * st.sx, h:(bh + size * .3) * st.sc, rot:V('rotate') + st.rot});
}

/* ============ الحلقة الرئيسية للرسم ============ */
function render(){
  const W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  BB.clear();
  const ordered = [...S.clips].sort((a, b) => a.start - b.start);
  for (const tr of drawOrder()){
    if (S.hidden[tr.id]) continue;
    for (const c of ordered){
      if (c.track !== tr.id || S.t < c.start || S.t >= c.start + c.dur) continue;
      const f = fadeFactor(c);
      switch (c.type){
        case 'text': drawText(c, f); break;
        case 'shape': drawShape(c, f); break;
        case 'fx': drawFx(c, f); break;
        case 'adjust': drawAdjust(c, f); break;
        default: drawVisual(c, f);
      }
    }
  }
  $('#time').textContent = fmt(S.t) + ' / ' + fmt(total());
  $('#ph').style.left = (S.t * S.zoom) + 'px';
  if (typeof syncInspector === 'function') syncInspector();
  if (typeof updateGizmo === 'function') updateGizmo();
}

/* ============ الوسائط والصوت ============ */
function ensureAudio(){
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  recDest = actx.createMediaStreamDestination();
}
function syncEls(){
  const live = new Set(S.clips.map(c => c.id));
  for (const [id, e] of els) if (!live.has(id)){ e.pause && e.pause(); els.delete(id); }
  for (const c of S.clips){
    if (NOEL.has(c.type) || els.has(c.id)) continue;
    const m = mediaOf(c); if (!m) continue;
    let e;
    if (c.type === 'image'){ e = new Image(); e.src = m.url; }
    else {
      e = document.createElement(c.type === 'video' ? 'video' : 'audio');
      e.preload = 'auto'; e.playsInline = true; e.src = m.url; e.addEventListener('seeked', () => { if (!S.playing) render(); });
      try {
        ensureAudio(); const src = actx.createMediaElementSource(e);
        const bass = actx.createBiquadFilter(), treb = actx.createBiquadFilter(), out = actx.createGain(), dly = actx.createDelay(1), fb = actx.createGain(), wet = actx.createGain();
        bass.type = 'lowshelf'; bass.frequency.value = 200; treb.type = 'highshelf'; treb.frequency.value = 3500; dly.delayTime.value = .28; fb.gain.value = .4; wet.gain.value = 0;
        src.connect(bass); bass.connect(treb); treb.connect(out); treb.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(out);
        out.connect(actx.destination); out.connect(recDest); FXN.set(c.id, {bass, treb, wet});
      } catch (_) {}
    }
    els.set(c.id, e);
  }
}
const duckState = new Map(), FXN = new Map();
function duckFactor(c){
  const d = c.p.duck || 0; if (!d) return 1;
  let loud = false;
  for (const o of S.clips){
    if (o === c || (o.type !== 'video' && o.type !== 'audio') || (o.type === 'audio' && o.p.duck)) continue;
    if (S.t < o.start || S.t >= o.start + o.dur || S.muted[o.track]) continue;
    const m = mediaOf(o); if (!m || !m.peaks) continue;
    const i = Math.floor((o.in + (S.t - o.start) * (o.p.speed || 1)) * PPS); let mx = 0;
    for (let j = i - 8; j <= i + 8; j++) mx = Math.max(mx, m.peaks[j] || 0);
    if (mx > .08){ loud = true; break; }
  }
  const cur = duckState.get(c.id) ?? 1, target = loud ? 1 - d / 100 : 1, nv = cur + (target - cur) * .15; duckState.set(c.id, nv); return nv;
}
function syncPlayback(){
  for (const c of S.clips){
    if (NOEL.has(c.type) || c.type === 'image') continue;
    const e = els.get(c.id); if (!e) continue;
    const sp = c.p.speed || 1, active = S.t >= c.start && S.t < c.start + c.dur && !S.muted[c.track];
    const local = c.in + (S.t - c.start) * sp;
    if (!active){ if (!e.paused) e.pause(); continue; }
    e.volume = clamp(val(c, 'volume') / 100 * fadeFactor(c) * (c.type === 'audio' ? duckFactor(c) : 1), 0, 1);
    e.playbackRate = sp;
    const fx = FXN.get(c.id); if (fx){ fx.bass.gain.value = c.p.bass || 0; fx.treb.gain.value = c.p.treble || 0; fx.wet.gain.value = (c.p.echo || 0) / 100 * .8; }
    if (S.playing){
      if (e.paused){ e.currentTime = local; e.play().catch(() => {}); }
      else if (Math.abs(e.currentTime - local) > .35) e.currentTime = local;
    } else {
      if (!e.paused) e.pause();
      if (Math.abs(e.currentTime - local) > .03) e.currentTime = local;
    }
  }
}
const PPS = 100;
async function computePeaks(m){
  try {
    ensureAudio();
    const buf = await actx.decodeAudioData(await (await fetch(m.url)).arrayBuffer());
    const ch = buf.getChannelData(0), n = Math.ceil(buf.duration * PPS), step = buf.sampleRate / PPS, pk = new Float32Array(n);
    for (let i = 0; i < n; i++){ let mx = 0; const a = Math.floor(i * step), b = Math.min(ch.length, Math.floor((i + 1) * step)); for (let j = a; j < b; j += 4){ const v = Math.abs(ch[j]); if (v > mx) mx = v; } pk[i] = mx; }
    m.peaks = pk;
  } catch (_) { m.peaks = null; }
  if (typeof renderTimeline === 'function') renderTimeline();
}
