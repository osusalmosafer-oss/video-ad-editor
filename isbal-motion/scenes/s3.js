/* s3 — حذّر النبي ﷺ: مسجد يطلع + حلقات + السطرين */
MOTION.scene({
  id: 's3',
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx, ISB = window.ISB;
    ISB.bg(ctx, t);
    const rise = at(lt, 0, 1.1, 'expoOut');
    // حلقات تتمدد على النبضة
    for (let i = 0; i < 3; i++) { const q = ((lt * 0.5 + i / 3) % 1); X.save(); X.globalAlpha = 0.35 * (1 - q); X.strokeStyle = P.acc; X.lineWidth = 4; X.beginPath(); X.arc(540, 1230, 160 + 520 * q, 0, 6.2832); X.stroke(); X.restore(); }
    ISB.mosque(ctx, 540, 1480 + 260 * (1 - rise), 1.05, P.acc, 0.9);
    X.fillStyle = 'rgba(12,27,23,0.0)';
    ISB.line(ctx, t, 'l4', { y: 360, size: 84, maxWidth: 900, step: 0.3, dim: 0.12, accent: [3] });
    ISB.line(ctx, t, 'l5', { y: 600, size: 80, maxWidth: 900, step: 0.3, dim: 0.12, accent: [] });
  }
});
