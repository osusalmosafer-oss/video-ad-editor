/* s5 — الحل: الثوب فوق الكعبين + شارك */
MOTION.scene({
  id: 's5',
  draw(t, lt, ctx) {
    const { X, P, at, FX, E } = ctx, ISB = window.ISB, green = P.green || '#4FB286';
    ISB.bg(ctx, t);
    const w = ctx.wordTime('l8', 0);
    const up = at(t, w.s, w.s + 0.9, 'cubicInOut');
    const hemY = (ISB.FL - 8) + ((ISB.AN - 150) - (ISB.FL - 8)) * up;
    ISB.leg(ctx, X, { oy: -180, hemY, lineK: 1, redA: 1 - up, pulse: ctx.beatPulse(t, 6, 1) * 0.6 });
    // صح أخضر
    const ck = at(t, w.s + 0.8, w.s + 1.3, 'cubicOut');
    if (ck > 0) { X.save(); X.translate(830, 900); X.fillStyle = green; X.globalAlpha = Math.min(1, ck * 2); X.beginPath(); X.arc(0, 0, 70, 0, 6.2832); X.fill(); X.restore(); ctx.drawPath(X, [[800, 902], [823, 927], [862, 876]], ck, { width: 16, color: '#fff', cap: 'round' }); }
    ISB.line(ctx, t, 'l8', { y: 300, size: 90, maxWidth: 900, step: 0.34, dim: 0.12, accent: [3] });
    // دعوة المشاركة
    const s9 = ctx.lineSpan('l9'), k = at(t, s9.s - 0.1, s9.s + 0.45, 'cubicOut');
    if (k > 0.01) {
      X.save(); X.globalAlpha = k; X.translate(0, 30 * (1 - k));
      FX.scrollReveal(ctx, t, { line: 'l9', y: 300, size: 76, maxWidth: 900, step: 0.3, dim: 0.12, accent: [1] });
      FX.ctaPulse(ctx, t, { text: 'شارك التذكير', s: s9.s + 0.3, y: 1450, tap: s9.s + 2.2 });
      X.restore();
    }
  }
});
