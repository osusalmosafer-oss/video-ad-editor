/* s4 — الحديث: إطار ذهبي + كلمة كلمة + المصدر */
MOTION.scene({
  id: 's4',
  draw(t, lt, ctx) {
    const { X, P, at, FX, E } = ctx, ISB = window.ISB, red = P.red || '#D4503A';
    const w7 = ctx.wordTime('l6', -1);
    const punch = Math.max(0, 1 - Math.abs(t - w7.s - 0.12) / 0.35) * 0.035;
    const push = 1 + punch;
    X.save(); X.translate(540, 960); X.scale(push, push); X.translate(-540, -960);
    FX.pushIn(ctx, t, { s: ctx.scene.start + 0.2, dur: 5, to: 1.07, focus: [540, 860], blur: false, draw: (Y) => {
    ISB.bg(ctx, t);
    ISB.mosque(ctx, 540, 1750, 0.7, P.acc, 0.12);
    // إطار مزدوج يترسم
    const fk = at(lt, 0, 1.0, 'cubicOut');
    ctx.drawPath(X, [[150, 330], [930, 330], [930, 1450], [150, 1450], [150, 330]], fk, { width: 5, color: P.acc, cap: 'round', smooth: false });
    ctx.drawPath(X, [[180, 360], [900, 360], [900, 1420], [180, 1420], [180, 360]], fk, { width: 2, color: P.acc, cap: 'round', smooth: false });
    [[150, 330], [930, 330], [930, 1450], [150, 1450]].forEach(([x, y]) => { X.save(); X.globalAlpha = fk; X.translate(x, y); X.rotate(Math.PI / 4); X.fillStyle = P.acc; X.fillRect(-14, -14, 28, 28); X.restore(); });
    // علامة اقتباس
    const qk = at(lt, 0.3, 0.8, 'cubicOut'); X.save(); X.globalAlpha = qk * 0.9; ctx.text(X, '”', 540, 590 + 20 * (1 - qk), { family: 'display', size: 280, color: P.acc, align: 'center' }); X.restore();
    // الحديث
    FX.scrollReveal(ctx, t, { line: 'l6', y: 780, size: 100, maxWidth: 660, step: 0.38, dim: 0.1, accent: [7] });
    // خط أحمر تحت «النار»
    const uk = at(t, w7.s + 0.15, w7.s + 0.6, 'cubicOut');
    if (uk > 0) ctx.drawPath(X, [[360, 1130], [720, 1130]], uk, { width: 8, color: red, cap: 'round' });
    // المصدر
    const s7 = ctx.lineSpan('l7'), sk = at(t, s7.s - 0.1, s7.s + 0.45, 'cubicOut');
    if (sk > 0.01) {
      X.save(); X.globalAlpha = sk; X.translate(0, 30 * (1 - sk));
      X.fillStyle = P.acc; X.beginPath(); X.roundRect(280, 1250, 520, 100, 50); X.fill();
      ctx.text(X, 'رواه البخاري', 560, 1318, { family: 'display', size: 62, color: P.bg, align: 'center' });
      X.strokeStyle = P.bg; X.lineWidth = 5; X.beginPath(); X.roundRect(330, 1275, 48, 52, 6); X.stroke(); X.beginPath(); X.moveTo(354, 1275); X.lineTo(354, 1327); X.stroke();
      X.restore();
    }
    } });
    X.restore();
  }
});
