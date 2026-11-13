/* s3 — حذّر النبي ﷺ: قرص ساعة/ميزان بخطوط دقيقة، قرمزي يمسح، ثم علامة اقتباس */
MOTION.scene({
  id: 's3',
  draw(t, lt, ctx) {
    const { X, P, at, E } = ctx, ISB = window.ISB, red = P.red, CX = 540, CY = 1180;
    ISB.bg(ctx, t, { light: 0.7 });
    ISB.hud(ctx, t, lt, 3, 'التحذير');
    // كلمة ضخمة مفرّغة بالخلفية (باراللاكس)
    X.save(); X.globalAlpha = 0.07 * at(lt, 0, 1); ctx.text(X, 'تحذير', 540 - lt * 18, 1040, { family: 'kufi', weight: 900, size: 520, color: P.ink, align: 'center' }); X.restore();
    // قرص الميزان
    const open = at(lt, 0, 1.0, 'expoOut'), rot = lt * 0.12;
    X.save(); X.translate(CX, CY); X.globalAlpha = open;
    X.strokeStyle = P.acc;
    for (let i = 0; i < 120; i++) { const a = i / 120 * 6.2832 + rot, big = i % 10 === 0, r1 = 430, r2 = big ? 396 : 412; X.lineWidth = big ? 4 : 2; X.globalAlpha = open * (big ? 0.9 : 0.4);
      X.beginPath(); X.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); X.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); X.stroke(); }
    X.globalAlpha = open * 0.5; X.lineWidth = 2; [360, 300].forEach((r, i) => { X.setLineDash(i ? [4, 14] : [40, 12]); X.lineDashOffset = -lt * (i ? -30 : 20); X.beginPath(); X.arc(0, 0, r, 0, 6.2832); X.stroke(); }); X.setLineDash([]);
    // قوس قرمزي يتمدد بقدر الخطورة
    const sk = at(lt, 0.3, 2.2, 'cubicInOut'); X.globalAlpha = open; X.strokeStyle = red; X.lineWidth = 14; X.lineCap = 'round';
    X.beginPath(); X.arc(0, 0, 330, -Math.PI / 2, -Math.PI / 2 + 5.2 * sk); X.stroke();
    X.restore();
    // مركز: علامة تعجب ← علامة اقتباس عند «قال»
    const w5 = ctx.lineSpan('l5'), sw = at(t, w5.s - 0.1, w5.s + 0.5, 'cubicInOut');
    X.save(); X.translate(CX, CY);
    if (sw < 0.99) { X.globalAlpha = (1 - sw) * open; X.scale(1 - 0.3 * sw, 1 - 0.3 * sw); X.fillStyle = red; X.beginPath(); X.roundRect(-16, -140, 32, 170, 16); X.fill(); X.beginPath(); X.arc(0, 78, 20 * (1 + 0.12 * ctx.beatPulse(t, 8, 1)), 0, 6.2832); X.fill(); }
    if (sw > 0.01) { X.globalAlpha = sw; X.scale(0.8 + 0.2 * sw, 0.8 + 0.2 * sw); ctx.text(X, '”', 0, 150, { family: 'ruqaa', weight: 700, size: 420, color: P.acc, align: 'center' }); }
    X.restore();
    ISB.line(ctx, t, 'l4', { y: 340, size: 76, maxWidth: 900, step: 0.3, dim: 0.12, accent: [3, 4] });
    ISB.line(ctx, t, 'l5', { y: 340, size: 76, maxWidth: 900, step: 0.3, dim: 0.12, accent: [] });
  }
});
