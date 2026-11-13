/* s5 — الحل: القماش يطلع فوق الحلقة، الحلقة تخضر */
MOTION.scene({
  id: 's5',
  setup(ctx) { this.w = window.ISB.world(ctx); },
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx, ISB = window.ISB, w = this.w, green = P.green;
    ISB.bg(ctx, t, { light: 0.8 });
    const wd = ctx.wordTime('l8', 0), up = at(t, wd.s + 0.1, wd.s + 1.3, 'cubicInOut'), hem = -0.6 + 2.3 * up;
    w.update(t, hem, { ringColor: up > 0.85 ? green : P.acc });
    w.st.orbit(0.55 - 0.12 * Math.sin(lt * 0.3), 0.1, 21, [0, 1.1, 0]);
    w.st.draw(X);
    window.ISB.fog(ctx);
    ISB.hud(ctx, t, lt, 5, 'الحل');
    const [rx, ry] = w.project(1.2, 0, 0), k = at(t, wd.s + 1.2, wd.s + 1.8, 'backOut');
    if (k > 0.01) { X.save(); X.translate(900, ry - 70); X.scale(k, k); X.fillStyle = green; X.beginPath(); X.arc(0, 0, 54, 0, 6.2832); X.fill(); X.restore();
      ctx.drawPath(X, [[876, ry - 70], [894, ry - 50], [926, ry - 92]], at(t, wd.s + 1.5, wd.s + 1.9), { width: 12, color: '#fff', cap: 'round', smooth: false }); }
    ISB.line(ctx, t, 'l8', { y: 330, size: 86, maxWidth: 900, step: 0.34, dim: 0.12, accent: [3] });
    const s9 = ctx.lineSpan('l9'), kk = at(t, s9.s - 0.1, s9.s + 0.45, 'cubicOut');
    if (kk > 0.01) { X.save(); X.globalAlpha = kk; FX.scrollReveal(ctx, t, { line: 'l9', y: 330, size: 76, maxWidth: 900, step: 0.3, dim: 0.12, accent: [1] }); X.restore();
      FX.ctaPulse(ctx, t, { text: 'شارك التذكير', s: s9.s + 0.3, y: 1450, tap: s9.s + 2.4 }); }
  }
});
