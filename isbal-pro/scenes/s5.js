/* s5 — الحل: القماش يطلع فوق الحلقة، الرجلين بكعبيهم، الحلقة تخضر */
MOTION.scene({
  id: 's5',
  setup(ctx) { this.w = window.ISB.world(ctx); },
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx, ISB = window.ISB, w = this.w, green = P.green;
    ISB.bg(ctx, t, { light: 0.8 });
    const wd = ctx.wordTime('l8', 0), up = at(t, wd.s + 0.1, wd.s + 1.3, 'cubicInOut'), hem = 0.05 + 1.0 * up;
    w.update(t, hem, { ringColor: up > 0.85 ? green : P.acc });
    w.st.orbit(-0.1 * Math.sin(lt * 0.3), 0.08, 21, [-0.3, 1.0, 0]);
    w.st.draw(X); ISB.fog(ctx);
    ISB.hud(ctx, t, ctx.scene.start, 5, 'الحل');
    const [bx, by] = w.project(...w.BONE), k = at(t, wd.s + 1.2, wd.s + 1.8, 'backOut');
    if (k > 0.01) { X.save(); X.translate(920, by - 80); X.scale(k, k); X.fillStyle = green; X.beginPath(); X.arc(0, 0, 50, 0, 6.2832); X.fill(); X.restore();
      ctx.drawPath(X, [[897, by - 80], [914, by - 62], [944, by - 100]], at(t, wd.s + 1.5, wd.s + 1.9), { width: 11, color: '#fff', cap: 'round', smooth: false });
      X.save(); X.globalAlpha = k; X.strokeStyle = green; X.lineWidth = 3; X.beginPath(); X.arc(bx, by, 28, 0, 6.2832); X.stroke(); X.restore(); }
    ISB.line(ctx, t, 'l8', { y: 330, size: 86, maxWidth: 900, step: 0.34, dim: 0.12, accent: [3] });
    const s9 = ctx.lineSpan('l9'), kk = at(t, s9.s - 0.1, s9.s + 0.45, 'cubicOut');
    if (kk > 0.01) { X.save(); X.globalAlpha = kk; FX.scrollReveal(ctx, t, { line: 'l9', y: 330, size: 76, maxWidth: 900, step: 0.3, dim: 0.12, accent: [1] }); X.restore();
      FX.ctaPulse(ctx, t, { text: 'شارك التذكير', s: s9.s + 0.3, y: 1450, tap: s9.s + 2.4 }); }
  }
});
