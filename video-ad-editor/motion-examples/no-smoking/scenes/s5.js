
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

MOTION.scene({ id: 's5',
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.bg(ctx, t, { gy: 700, glow: .14 });
    NG.label(ctx, 'أضرار صحية', lt);
    const dark = at(lt, 1, 4.5, 'sineInOut');
    const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; };
    const bre = 1 + .025 * Math.sin(lt * 2.6) * (1 - dark * .6);
    X.save(); X.translate(540, 700); X.scale(bre, bre);
    const lung = (sg) => { X.save(); X.scale(sg, 1); X.beginPath(); X.moveTo(-14, -90); X.bezierCurveTo(-40, -100, -170, -90, -200, 30); X.bezierCurveTo(-225, 150, -150, 215, -80, 190); X.bezierCurveTo(-28, 170, -12, 110, -14, 20); X.closePath(); X.fillStyle = mix('#E58A8A', '#2A2321', dark); X.fill(); X.strokeStyle = 'rgba(255,255,255,.12)'; X.lineWidth = 3; X.stroke();
      X.strokeStyle = 'rgba(0,0,0,.28)'; X.lineWidth = 4; X.beginPath(); X.moveTo(-18, -20); X.lineTo(-80, 30); X.moveTo(-50, 10); X.lineTo(-90, 90); X.moveTo(-40, 20); X.lineTo(-40, 120); X.stroke(); X.restore(); };
    lung(1); lung(-1);
    X.strokeStyle = mix('#E8C0B8', '#4A403B', dark); X.lineWidth = 26; X.lineCap = 'round'; X.beginPath(); X.moveTo(0, -190); X.lineTo(0, -40); X.stroke();
    X.restore();
    NG.smoke(ctx, lt, 540, 960, { n: 16, h: 220, alpha: dark * .8, r: 60, spread: 220 });
    const items = [['سرطان الرئة والفم', 1.2], ['أمراض القلب والجلطات', 2.2], ['ضيق التنفس المزمن', 3.2], ['تلف الأسنان واللثة', 4.2]];
    items.forEach(([s, t0], i) => { const k = at(lt, t0, t0 + .5, 'expoOut'); const y = 1090 + i * 118;
      X.globalAlpha = k; X.fillStyle = '#E5483B'; X.fillRect(540 + 340 * (1 - k * .0) , y - 52, 8, 64); X.globalAlpha = 1;
      ctx.text(X, s, 540 - (1 - k) * 80 - 10, y, { family: 'display', size: 76, color: i % 2 ? '#F2EFE9' : '#FFB4A8', align: 'center', alpha: k, maxWidth: 640 }); });
    const w = at(lt, 5.4, 6.0, 'cubicOut');
    ctx.text(X, 'أكثر من 8 ملايين وفاة كل سنة', 540, 1560, { family: 'body', weight: 700, size: 46, color: '#F2EFE9', align: 'center', alpha: w });
    ctx.text(X, 'التبغ — منظمة الصحة العالمية', 540, 1620, { family: 'body', weight: 400, size: 34, color: '#9A968F', align: 'center', alpha: w });
  } });
