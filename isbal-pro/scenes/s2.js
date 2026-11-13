/* s2 — ما هو الإسبال: قماش 3D ينزل تحت حلقة الكعبين */
const sm2 = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
MOTION.scene({
  id: 's2',
  setup(ctx) { this.w = window.ISB.world(ctx); },
  draw(t, lt, ctx) {
    const { X, P, at } = ctx, ISB = window.ISB, w = this.w;
    ISB.bg(ctx, t, { light: 0.8 });
    const wd = ctx.wordTime('l2', 2), drop = at(t, wd.s - 0.1, wd.e + 0.5, 'cubicInOut');
    const hem = 1.7 - 2.3 * drop;
    w.update(t, hem, {});
    w.st.orbit(0.5 + 0.12 * Math.sin(lt * 0.35), 0.1, 22 - 1.0 * at(lt, 0, 5, 'sineInOut'), [0, 1.1, 0]);
    w.st.draw(X);
    window.ISB.fog(ctx);
    ISB.hud(ctx, t, lt, 2, 'التعريف');
    // شرح: خط توضيحي للكعبين
    const [rx, ry] = w.project(1.2, 0, 0), k = at(lt, 0.5, 1.3, 'cubicOut');
    ctx.drawPath(X, [[rx, ry], [rx + 90, ry - 70], [930, ry - 70]], k, { width: 3, color: P.acc, cap: 'round', smooth: false, tip: { r: 7, color: P.acc } });
    X.save(); X.globalAlpha = k; ctx.text(X, 'الكعبان', 930, ry - 90, { family: 'body', weight: 700, size: 40, color: P.acc, align: 'right' }); X.restore();
    // وسم «ما أسفل الكعبين» بعد النزول
    const ak = at(t, wd.e + 0.4, wd.e + 1.0, 'cubicOut');
    if (ak > 0.01) { const [lx, ly] = w.project(-1.0, hem + 0.3, 0);
      ctx.drawPath(X, [[lx - 10, ly], [lx - 90, ly + 40], [150, ly + 40]], ak, { width: 3, color: P.red, cap: 'round', smooth: false, tip: { r: 7, color: P.red } });
      X.save(); X.globalAlpha = ak; ctx.text(X, 'ما أسفل الكعبين', 150, ly + 12, { family: 'body', weight: 700, size: 38, color: P.red, align: 'left' }); X.restore(); }
    ISB.line(ctx, t, 'l2', { y: 330, size: 84, maxWidth: 900, step: 0.34, dim: 0.12, accent: [0] });
    ISB.line(ctx, t, 'l3', { y: 330, size: 84, maxWidth: 900, step: 0.34, dim: 0.12, accent: [] });
  }
});
