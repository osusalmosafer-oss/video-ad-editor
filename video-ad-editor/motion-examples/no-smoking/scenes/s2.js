
const NG = (window.__NG = window.__NG || {});
NG.bg = function (ctx, t, o = {}) {
  const { X, W, H } = ctx; const c = o.col || '229,72,59';
  const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#0A0B0F'); g.addColorStop(1, o.bot || '#1A1C24');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  const gl = X.createRadialGradient(W / 2, o.gy || 900, 0, W / 2, o.gy || 900, 950);
  gl.addColorStop(0, 'rgba(' + c + ',' + (o.glow == null ? .14 : o.glow) + ')'); gl.addColorStop(1, 'rgba(' + c + ',0)');
  X.fillStyle = gl; X.fillRect(0, 0, W, H);
};
NG.words = function (ctx, str, y, lt, t0, step, size, color, o = {}) {
  const { X } = ctx;
  const L = ctx.text.layout(X, str, { family: o.family || 'display', weight: o.weight || 700, size, maxWidth: o.maxW || 900, lineHeight: o.lh || 1.45 });
  ctx.text.drawLayout(X, L, 540, y, { align: 'center', color, perWord: (i) => {
    const k = ctx.at(lt, t0 + i * step, t0 + i * step + .45, 'expoOut');
    return { alpha: k, dy: (1 - k) * 60, shadow: { blur: 26, y: 0, color: o.glow || 'rgba(229,72,59,.35)' } };
  } });
  return L;
};
NG.vwords = function (ctx, words, au, y, size, sl, color, o = {}) {
  const X = ctx.X, str = words.map(w => w[0]).join(' ');
  const L = ctx.text.layout(X, str, { family: 'body', weight: 700, size, maxWidth: o.maxW || 900, lineHeight: o.lh || 1.7 });
  const k = ctx.at(sl, 0, .5, 'expoOut');
  ctx.text.drawLayout(X, L, 540, y, { align: 'center', color: color || '#F2EFE9', perWord: (i) => {
    const w0 = words[i][1], w1 = i + 1 < words.length ? words[i + 1][1] : w0 + 1.2, cur = au >= w0 && au < w1, past = au >= w1;
    return { alpha: k * (past || cur ? 1 : .3), color: cur ? (o.hi || '#FFD27A') : (color || '#F2EFE9'), scale: cur ? 1.08 : 1, shadow: cur ? { blur: 30, y: 0, color: 'rgba(255,200,90,.8)' } : undefined };
  } });
};
NG.label = function (ctx, str, lt, col) {
  const k = ctx.at(lt, 0, .5, 'expoOut');
  ctx.text(ctx.X, str, 540, 270 + (1 - k) * 30, { family: 'display', size: 96, color: col || '#E5483B', align: 'center', alpha: k });
  const X = ctx.X; X.globalAlpha = k; X.fillStyle = col || '#E5483B'; X.fillRect(540 - 90 * k, 300, 180 * k, 6); X.globalAlpha = 1;
};
NG.src = function (ctx, str, y, lt, t0, col) {
  const k = ctx.at(lt, t0, t0 + .5, 'cubicOut');
  ctx.text(ctx.X, str, 540, y, { family: 'body', weight: 400, size: 40, color: col || '#9A968F', align: 'center', alpha: k });
};
NG.smoke = function (ctx, t, x, y, o = {}) {
  const X = ctx.X, n = o.n || 26, h = o.h || 700, sp = o.spread || 160, al = o.alpha == null ? 1 : o.alpha;
  for (let i = 0; i < n; i++) {
    const ph = (t * (o.speed || .3) + i / n) % 1;
    const xx = x + ctx.noise1(i * 3.7 + ph * 2.2, 11) * sp * ph * 2 + Math.sin(ph * 6 + i) * 18 * ph;
    const yy = y - ph * h, r = 24 + ph * (o.r || 110);
    const a = Math.min(1, ph * 6) * (1 - ph) * .34 * al;
    const g = X.createRadialGradient(xx, yy, 0, xx, yy, r);
    g.addColorStop(0, 'rgba(' + (o.c || '190,190,196') + ',' + a + ')'); g.addColorStop(1, 'rgba(' + (o.c || '190,190,196') + ',0)');
    X.fillStyle = g; X.beginPath(); X.arc(xx, yy, r, 0, 6.283); X.fill();
  }
};
NG.cig = function (ctx, x, y, len, rot, burn, t, ember) {
  const X = ctx.X, w = 46; X.save(); X.translate(x, y); X.rotate(rot);
  const L = len, ash = 36 * (ember == null ? 1 : ember), paperTop = -L / 2 + L * burn;
  X.fillStyle = '#D98E4A'; X.fillRect(-w / 2, L / 2 - L * .26, w, L * .26);
  X.fillStyle = '#B9712F'; for (let i = 0; i < 6; i++) X.fillRect(-w / 2, L / 2 - L * .26 + i * 14, w, 3);
  X.fillStyle = '#EFEAE0'; X.fillRect(-w / 2, paperTop, w, L / 2 - L * .26 - paperTop);
  X.fillStyle = '#6E6A64'; X.fillRect(-w / 2, paperTop - ash, w, ash);
  if (ember) { const p = .75 + .25 * Math.sin(t * 9); X.shadowColor = 'rgba(255,90,40,' + p + ')'; X.shadowBlur = 50 * p; X.fillStyle = '#FF5A28'; X.beginPath(); X.ellipse(0, paperTop, w / 2, 10, 0, 0, 6.283); X.fill(); }
  X.restore();
};
const VC = [{"v": "v195", "wav": "assets/v195.wav", "dur": 4.22, "ref": "سورة البقرة · 195", "words": [["﴿وَلَا", 0.12], ["تُلْقُوا", 0.6], ["بِأَيْدِيكُمْ", 1.5], ["إِلَى", 2.5], ["التَّهْلُكَةِ﴾", 2.92]], "start": 0.0, "audio_at": 0.6, "cd": 5.62}, {"v": "v29", "wav": "assets/v29.wav", "dur": 5.72, "ref": "سورة النساء · 29", "words": [["﴿وَلَا", 0.12], ["تَقْتُلُوا", 1.02], ["أَنفُسَكُمْ﴾", 2.36]], "start": 5.62, "audio_at": 6.22, "cd": 7.12}, {"v": "v157", "wav": "assets/v157.wav", "dur": 5.14, "ref": "سورة الأعراف · 157", "words": [["﴿وَيُحَرِّمُ", 0.12], ["عَلَيْهِمُ", 1.22], ["الْخَبَائِثَ﴾", 2.08]], "start": 12.74, "audio_at": 13.34, "cd": 6.54}]
;
MOTION.scene({ id: 's2',
  draw(t, lt, ctx) {
    const { X, at } = ctx; let ci = 0; VC.forEach((c, i) => { if (lt >= c.start) ci = i; });
    const c = VC[ci], sl = lt - c.start, au = sl - 0.6;
    NG.bg(ctx, t, { gy: 900, glow: .13 });
    NG.label(ctx, 'من القرآن الكريم', lt);
    for (let q = 0; q < 3; q++) { X.globalAlpha = .06; X.strokeStyle = '#E5483B'; X.lineWidth = 2; X.save(); X.translate(540, 900); X.rotate(lt * .05 * (q % 2 ? -1 : 1) + q); X.strokeRect(-420 + q * 60, -420 + q * 60, 840 - q * 120, 840 - q * 120); X.restore(); }
    X.globalAlpha = 1;
    NG.vwords(ctx, c.words, au, 620, 104, sl);
    NG.src(ctx, c.ref, 1240, sl, 1.2);
    ctx.text(X, 'تلاوة القارئ محمد اللحيدان', 540, 1320, { family: 'body', weight: 400, size: 34, color: '#7A766F', align: 'center', alpha: at(sl, .6, 1.2) });
    const f = 1 - at(sl, 0, .25, 'cubicOut'); if (f > 0 && ci > 0) { X.fillStyle = 'rgba(229,72,59,' + f * .4 + ')'; X.fillRect(0, 0, ctx.W, ctx.H); }
  } });
