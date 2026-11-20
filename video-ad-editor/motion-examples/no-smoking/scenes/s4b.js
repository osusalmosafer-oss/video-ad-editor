
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

const QS = [
  { n: 'الشيخ محمد بن صالح العثيمين', r: 'رحمه الله', ph: 'p_uth', t: 'التدخين الذي هو شرب الدخان أو التبغ محرم بدلالة الكتاب والسنة والاعتبار الصحيح', s: 'موقع الشيخ ابن عثيمين — «حكم شرب الدخان»' },
  { n: 'الشيخ عبدالعزيز بن باز', r: 'رحمه الله', ph: 'p_baz', t: 'التدخين يضيق مجاري الدم، يسيء إلى شرايينه، يسيء إلى صدره، يسيء إلى قلبه… فمضاره كثيرة', s: 'موقع الشيخ ابن باز — «التدخين والسهر من أسباب الطلاق»' },
  { n: 'الشيخ محمد بن صالح العثيمين', r: 'رحمه الله', ph: 'p_uth', t: 'شرب الدخان ضرر في البدن، وفي المال', s: 'موقع الشيخ ابن عثيمين — «حكم شرب الدخان»' }
];
MOTION.scene({ id: 's4b',
  draw(t, lt, ctx) {
    const { X, at } = ctx; const D = 3.2, i = Math.max(0, Math.min(2, Math.floor(lt / D))), sl = lt - i * D, q = QS[i];
    NG.bg(ctx, t, { gy: 800, glow: .14 });
    NG.label(ctx, 'من أقوال العلماء', lt, '#E8C46A');
    const k = at(sl, 0, .7, 'expoOut'), cx = 540, cy = 640, R = 150;
    X.save(); X.globalAlpha = k; X.strokeStyle = '#E8C46A'; X.lineWidth = 6; X.beginPath(); X.arc(cx, cy, R + 10 + 6 * Math.sin(sl * 3), 0, 6.283); X.stroke();
    X.beginPath(); X.arc(cx, cy, R, 0, 6.283); X.clip();
    const img = ctx.images && ctx.images[q.ph] && ctx.img(q.ph);
    if (img) { const s = (R * 2.1) / Math.min(img.width, img.height); X.drawImage(img, cx - img.width * s / 2, cy - img.height * s / 2, img.width * s, img.height * s); }
    else { X.fillStyle = '#2A2420'; X.fillRect(cx - R, cy - R, R * 2, R * 2); X.fillStyle = '#5B4A30'; X.beginPath(); X.arc(cx, cy - 36, 54, 0, 6.283); X.fill(); X.beginPath(); X.ellipse(cx, cy + 130, 100, 86, 0, 0, 6.283); X.fill(); }
    X.restore();
    ctx.text(X, q.n, 540, 880, { family: 'display', size: 64, color: '#F2EFE9', align: 'center', alpha: k, maxWidth: 960 });
    ctx.text(X, q.r, 540, 950, { family: 'body', weight: 400, size: 38, color: '#E8C46A', align: 'center', alpha: k });
    ctx.text(X, '«', 540, 1030, { family: 'display', size: 140, color: '#E5483B', align: 'center', alpha: .8 * k });
    NG.words(ctx, q.t, 1140, sl, .3, .17, 62, '#F2EFE9', { family: 'body', lh: 1.65 });
    NG.src(ctx, q.s, 1500, sl, 1.8);
    const f = 1 - at(sl, 0, .25, 'cubicOut'); if (f > 0 && i > 0) { X.fillStyle = 'rgba(232,196,106,' + f * .35 + ')'; X.fillRect(0, 0, ctx.W, ctx.H); }
  } });
