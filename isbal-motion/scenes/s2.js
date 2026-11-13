/* s2 — شنو الإسبال: الثوب ينزل تحت الكعبين */
MOTION.scene({
  id: 's2',
  draw(t, lt, ctx) {
    const { X, P, at, FX, E } = ctx, ISB = window.ISB, red = P.red || '#D4503A';
    ISB.bg(ctx, t);
    const w = ctx.wordTime('l2', 2), end2 = ctx.wordTime('l2', -1);
    const drop = at(t, w.s - 0.05, w.e + 0.45, 'cubicInOut');
    const hemY = ISB.AN - 150 + (ISB.FL - 8 - (ISB.AN - 150)) * drop;
    ISB.leg(ctx, X, { hemY, lineK: at(lt, 0.3, 1.1, 'cubicOut'), redA: at(t, w.e + 0.2, w.e + 0.6), pulse: ctx.beatPulse(t, 6, 1) * 0.6 });
    ISB.line(ctx, t, 'l2', { y: 330, size: 88, maxWidth: 900, step: 0.34, dim: 0.12, accent: [0] });
    ISB.line(ctx, t, 'l3', { y: 330, size: 88, maxWidth: 900, step: 0.34, dim: 0.12, accent: [] });
    // علامة تعجب حمراء عند «بسيطًا»
    const b = ctx.wordTime('l3', -1), k = at(t, b.s, b.s + 0.35, 'backOut');
    if (k > 0.01) { X.save(); X.translate(830, 1010); X.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); X.fillStyle = red; X.beginPath(); X.arc(0, 0, 66, 0, 6.2832); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.roundRect(-9, -36, 18, 48, 9); X.fill(); X.beginPath(); X.arc(0, 38, 10, 0, 6.2832); X.fill(); X.restore(); }
  }
});
