MOTION.scene({ id: 's4',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, B = ctx.img('bag');
    HU.bg(ctx);
    const g = X.createRadialGradient(540, 800, 80, 540, 800, 900); g.addColorStop(0, '#1E4F5A'); g.addColorStop(1, P.bg); X.fillStyle = g; X.fillRect(0, 0, 1080, 1920);
    ctx.text(X, 'وجبة ضيوف البيت الحرام', 540, 300, { family: 'display', weight: 800, size: 90, color: P.ink, alpha: at(lt, .1, .6, 'cubicOut'), maxWidth: 940 });
    FX.kenBurns(ctx, t, { s: 14, dur: 4, from: [540, 960, 1.0], to: [540, 960, 1.07], clamp: false, draw: Y => {
      const k = at(lt, .2, .9, 'expoOut'); Y.save(); Y.globalAlpha = k; Y.translate(540, 900 + 50 * (1 - k)); Y.scale(.95 + .05 * k, .95 + .05 * k);
      Y.fillStyle = 'rgba(0,0,0,.35)'; Y.beginPath(); Y.ellipse(0, 400, 380, 38, 0, 0, 6.283); Y.fill();
      Y.save(); HU.rr(Y, -460, -430, 920, 850, 28); Y.clip(); Y.drawImage(B, -460, -430, 920, 850); Y.restore(); Y.restore(); } });
    ['تمر', 'ماء', 'عصير'].forEach((w, i) => { const k = at(lt, 1.2 + i * .25, 1.7 + i * .25, 'cubicOut'); ctx.text(X, w, 780 - i * 240, 1420, { family: 'body', weight: 700, size: 50, color: P.hi, alpha: k }); });
  } });
