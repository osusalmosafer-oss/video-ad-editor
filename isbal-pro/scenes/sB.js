/* sB — «بسيطًا» تذوب بـ«شديدًا» ← زوم مدموج ← الحديث */
const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };

MOTION.scene({
  id: 'sB',
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx, ISB = window.ISB, red = P.red, CX = 540, CY = 1180;
    const l4 = ctx.lineSpan('l4'), l5 = ctx.lineSpan('l5'), l6 = ctx.lineSpan('l6'), l7 = ctx.lineSpan('l7'), t0 = ctx.scene.start;
    const zs = l6.s - 1.25;

    // ── الجزء 1: قرص التحذير + كلمة تذوب بكلمة + علامة اقتباس
    const partA = () => {
      ISB.bg(ctx, t, { light: 0.7 }); ISB.hud(ctx, t, t0, 3, 'التحذير');
      const open = at(t, t0, t0 + 1.0, 'expoOut'), rot = (t - t0) * 0.12;
      X.save(); X.translate(CX, CY); X.strokeStyle = P.acc;
      for (let i = 0; i < 120; i++) { const a = i / 120 * 6.2832 + rot, big = i % 10 === 0, r1 = 430, r2 = big ? 396 : 412; X.lineWidth = big ? 4 : 2; X.globalAlpha = open * (big ? 0.9 : 0.4);
        X.beginPath(); X.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); X.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); X.stroke(); }
      X.globalAlpha = open * 0.5; X.lineWidth = 2; [360, 300].forEach((r, i) => { X.setLineDash(i ? [4, 14] : [40, 12]); X.lineDashOffset = -(t - t0) * (i ? -30 : 20); X.beginPath(); X.arc(0, 0, r, 0, 6.2832); X.stroke(); }); X.setLineDash([]);
      const sk = at(t, t0 + 0.3, t0 + 2.2, 'cubicInOut'); X.globalAlpha = open; X.strokeStyle = red; X.lineWidth = 14; X.lineCap = 'round';
      X.beginPath(); X.arc(0, 0, 330, -Math.PI / 2, -Math.PI / 2 + 5.2 * sk); X.stroke(); X.restore();
      // كلمة تذوب بكلمة: «بسيطًا» ← «شديدًا»
      const ws = ctx.wordTime('l4', -1).s, k = at(t, ws - 0.25, ws + 0.7, 'cubicInOut'), sw = at(t, l5.s - 0.1, l5.s + 0.5, 'cubicInOut');
      const fa = open * (1 - sw), size = 250, y = CY + 70;
      X.save(); X.globalAlpha = fa;
      X.save(); X.globalAlpha = fa * Math.max(0, 1 - k * 1.25); X.filter = k > 0.02 ? `blur(${(20 * k).toFixed(1)}px)` : 'none';
      X.translate(CX, y); X.scale(1, 1 + 0.4 * k); X.translate(-CX, -y + 70 * k); ctx.text(X, 'بسيطًا', CX, y, { family: 'kufi', weight: 900, size, color: P.ink, align: 'center' }); X.restore();
      if (k > 0.2) { X.save(); X.globalAlpha = fa * Math.min(1, (k - 0.2) / 0.6); X.filter = k < 0.98 ? `blur(${(18 * (1 - k)).toFixed(1)}px)` : 'none';
        X.translate(CX, y); X.scale(1, 1.3 - 0.3 * k); X.translate(-CX, -y); ctx.text(X, 'شديدًا', CX, y, { family: 'kufi', weight: 900, size, color: mix(P.ink, P.red, k), align: 'center' }); X.restore(); }
      if (k > 0.02 && k < 0.98) for (let i = 0; i < 6; i++) { const dx = (i - 2.5) * 78, f = Math.max(0, k * 1.3 - i * 0.05); X.globalAlpha = fa * 0.7 * (1 - f); X.fillStyle = P.ink; X.beginPath(); X.ellipse(CX + dx, y + 20 + f * (160 + 40 * (i % 3)), 9, 9 + 14 * f, 0, 0, 6.2832); X.fill(); }
      X.restore();
      // علامة اقتباس عند «قال»
      if (sw > 0.01) { X.save(); X.translate(CX, CY); X.globalAlpha = sw; X.scale(0.8 + 0.2 * sw, 0.8 + 0.2 * sw); ctx.text(X, '”', 0, 150, { family: 'ruqaa', weight: 700, size: 420, color: P.acc, align: 'center' }); X.restore(); }
      ISB.line(ctx, t, 'l4', { y: 340, size: 76, maxWidth: 900, step: 0.3, dim: 0.12, accent: [3, 4] });
      ISB.line(ctx, t, 'l5', { y: 340, size: 76, maxWidth: 900, step: 0.3, dim: 0.12, accent: [] });
    };

    // ── الجزء 2: الحديث
    const partB = () => {
      const lt2 = t - zs, w7 = ctx.wordTime('l6', -1), punch = Math.max(0, 1 - Math.abs(t - w7.s - 0.1) / 0.4) * 0.03;
      const push = 1 + 0.045 * at(lt2, 0, 6, 'sineInOut') + punch;
      ISB.bg(ctx, t, { light: 1.1, dust: 1.2 });
      X.save(); X.translate(540, 900); X.scale(push, push); X.translate(-540, -900);
      X.save(); X.globalAlpha = 0.16 * at(lt2, 0.0, 0.8, 'cubicOut'); ctx.text(X, '“', 540, 760, { family: 'ruqaa', weight: 700, size: 900, color: P.acc, align: 'center' }); X.restore();
      const fk = at(lt2, 0.0, 0.7, 'expoOut'); X.save(); X.strokeStyle = P.acc; X.globalAlpha = 0.9;
      const x0 = 120, x1 = 960, y0 = 400, y1 = 1360, L = 70 * fk;
      [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { X.lineWidth = 4; X.beginPath(); X.moveTo(x, y + sy * L); X.lineTo(x, y); X.lineTo(x + sx * L, y); X.stroke(); });
      X.lineWidth = 1.5; X.globalAlpha = 0.35 * fk; X.strokeRect(x0 + 24, y0 + 24, x1 - x0 - 48, y1 - y0 - 48); X.restore();
      const Lo = ctx.text.layout(X, l6.text, { family: 'ruqaa', weight: 700, size: 112, maxWidth: 740, lineHeight: 1.6 });
      ctx.text.drawLayout(X, Lo, 540, 740, { align: 'center', color: P.ink, perWord: (i) => {
        const tw = ctx.wordTime('l6', i).s, k = at(t, tw - 0.06, tw + 0.55, 'expoOut');
        return { alpha: k, dy: (1 - k) * 36, scale: 0.94 + 0.06 * k, color: i === 7 ? '#E8545E' : P.ink };
      } });
      const uk = at(t, w7.s + 0.1, w7.s + 0.7, 'expoOut');
      if (uk > 0) ctx.drawPath(X, [[400, 1148], [680, 1148]], uk, { width: 6, color: P.red, cap: 'round', smooth: false });
      const sk = at(t, l7.s - 0.05, l7.s + 0.6, 'expoOut');
      if (sk > 0.01) { X.save(); X.globalAlpha = sk; X.translate(0, 24 * (1 - sk)); X.strokeStyle = P.acc; X.lineWidth = 2; X.beginPath(); X.moveTo(200, 1262); X.lineTo(400, 1262); X.moveTo(680, 1262); X.lineTo(880, 1262); X.stroke();
        ctx.text(X, 'رواه البخاري', 540, 1280, { family: 'body', weight: 700, size: 48, color: P.acc, align: 'center' }); X.restore(); }
      X.restore(); ISB.hud(ctx, t, zs + 0.5, 4, 'حديث شريف');
    };

    FX.crossZoom(ctx, t, { s: zs, dur: 1.2, A: partA, B: partB });
  }
});
