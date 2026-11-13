/* s1 — الهوك: مثلث تحذير يترسم + «انتبه!» + الجملة. ويعرّف أدوات مشتركة لباقي المشاهد (window.ISB) */
const W = 1080, H = 1920;
const ISB = window.ISB = {};
const C = (v, a, b) => Math.min(b, Math.max(a, v));

// خلفية: لون الثيم + نجمة ثمانية خفيفة تتحرك ببطء
ISB.bg = (ctx, lt) => {
  const { X, P } = ctx;
  if (!ISB._pat) {
    const c = document.createElement('canvas'); c.width = W + 240; c.height = H + 240;
    const g = c.getContext('2d'); g.strokeStyle = P.acc; g.globalAlpha = 0.09; g.lineWidth = 2;
    const s = 240;
    for (let y = 0; y <= c.height + s; y += s) for (let x = 0; x <= c.width + s; x += s) {
      const r = s * 0.36;
      for (let k = 0; k < 2; k++) { g.save(); g.translate(x, y); g.rotate(k * Math.PI / 4); g.strokeRect(-r, -r, r * 2, r * 2); g.restore(); }
      g.beginPath(); g.arc(x, y, r * 0.55, 0, 6.2832); g.stroke();
    }
    ISB._pat = c;
  }
  X.fillStyle = P.bg; X.fillRect(0, 0, W, H);
  const gr = X.createRadialGradient(540, 900, 100, 540, 900, 1300); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)');
  X.fillStyle = gr; X.fillRect(0, 0, W, H);
  const d = (lt * 8) % 240; X.drawImage(ISB._pat, -d, -d * 0.5);
};

// مسجد: قبة + مئذنتين (صلب، بلا أشخاص)
ISB.mosque = (ctx, cx, baseY, sc, color, alpha) => {
  const { X } = ctx; X.save(); X.globalAlpha = alpha; X.fillStyle = color; X.translate(cx, baseY); X.scale(sc, sc);
  X.fillRect(-260, -200, 520, 200);
  X.beginPath(); X.arc(0, -200, 190, Math.PI, 0); X.fill();
  X.fillRect(-3, -440, 6, 60);
  X.beginPath(); X.arc(0, -470, 24, 0.6, 6.2832 - 0.6 + 0.0001, false); X.arc(10, -470, 19, 6.2832 - 0.8, 0.8, true); X.fill('evenodd');
  [-330, 330].forEach(mx => { X.fillRect(mx - 24, -520, 48, 520); X.beginPath(); X.moveTo(mx - 34, -520); X.lineTo(mx, -600); X.lineTo(mx + 34, -520); X.fill(); X.fillRect(mx - 34, -380, 68, 14); });
  X.restore();
};

// سطر من الصوت يظهر كلمة كلمة ثم يخفت
ISB.line = (ctx, t, id, o) => {
  const sp = ctx.lineSpan(id), fade = 1 - ctx.at(t, sp.e + 0.1, sp.e + 0.4, 'cubicIn');
  if (fade <= 0.01 || t < sp.s - 0.6) return;
  ctx.X.save(); ctx.X.globalAlpha = fade; ctx.FX.scrollReveal(ctx, t, Object.assign({ line: id }, o)); ctx.X.restore();
};

// رجل + ثوب: hemY = حافة الثوب
ISB.AN = 1320; ISB.FL = 1420;
ISB.leg = (ctx, Y, o) => {
  const { P, at } = ctx, oy = o.oy || 0, AN = ISB.AN + oy, FL = ISB.FL + oy, hem = o.hemY + oy;
  const skin = '#C79B72', thobe = '#F2EEE4', shoe = '#4A6158', red = P.red || '#D4503A';
  Y.save();
  Y.fillStyle = skin; Y.beginPath(); Y.moveTo(470, 880 + oy); Y.lineTo(610, 880 + oy); Y.lineTo(592, AN); Y.lineTo(488, AN); Y.closePath(); Y.fill();
  Y.fillStyle = shoe; Y.beginPath(); Y.moveTo(486, AN - 6); Y.lineTo(594, AN - 6); Y.lineTo(604, AN + 44); Y.lineTo(780, FL - 52); Y.quadraticCurveTo(836, FL - 30, 826, FL); Y.lineTo(462, FL); Y.quadraticCurveTo(452, FL - 70, 486, AN - 6); Y.fill();
  Y.fillStyle = 'rgba(255,255,255,0.14)'; Y.fillRect(462, FL - 12, 364, 12);
  // خط الكعبين + عظمة الكعب
  const lk = o.lineK == null ? 1 : o.lineK;
  if (lk > 0) {
    Y.strokeStyle = P.acc; Y.lineWidth = 4; Y.setLineDash([22, 14]); Y.beginPath(); Y.moveTo(850, AN); Y.lineTo(850 - 640 * lk, AN); Y.stroke(); Y.setLineDash([]);
    Y.strokeStyle = P.acc; Y.lineWidth = 5; Y.beginPath(); Y.arc(548, AN, 17 + (o.pulse || 0) * 6, 0, 6.2832); Y.stroke();
    Y.globalAlpha = lk; ctx.text(Y, 'الكعبان', 215, AN - 26, { family: 'body', weight: 700, size: 44, color: P.acc, align: 'left' }); Y.globalAlpha = 1;
  }
  // منطقة الخطر
  if (hem > AN + 4 && (o.redA || 0) > 0) { Y.fillStyle = red; Y.globalAlpha = 0.5 * o.redA; Y.fillRect(432, AN, 216, hem - AN); Y.globalAlpha = 1; }
  // الثوب
  const bad = at(hem, AN - 4, AN + 12, 'linear');
  const hemCol = bad > 0.5 ? red : '#BDB6A2';
  Y.fillStyle = thobe;
  const gr = Y.createLinearGradient(0, 700 + oy, 0, 800 + oy); gr.addColorStop(0, 'rgba(242,238,228,0)'); gr.addColorStop(1, thobe);
  Y.beginPath(); Y.moveTo(446, 700 + oy); Y.lineTo(634, 700 + oy); Y.lineTo(648, hem); Y.lineTo(432, hem); Y.closePath(); Y.fillStyle = gr; Y.fill();
  Y.fillStyle = thobe; Y.beginPath(); Y.moveTo(442, 800 + oy); Y.lineTo(638, 800 + oy); Y.lineTo(648, hem); Y.lineTo(432, hem); Y.closePath(); Y.fill();
  Y.strokeStyle = 'rgba(0,0,0,0.07)'; Y.lineWidth = 3;
  [490, 540, 590].forEach(x => { Y.beginPath(); Y.moveTo(x, 800 + oy); Y.lineTo(x + (x - 540) * 0.2, hem); Y.stroke(); });
  Y.strokeStyle = hemCol; Y.lineWidth = 10; Y.beginPath(); Y.moveTo(432, hem); Y.lineTo(648, hem); Y.stroke();
  Y.restore();
};

MOTION.scene({
  id: 's1',
  draw(t, lt, ctx) {
    const { X, P, at, FX, E } = ctx; const red = P.red || '#D4503A';
    ISB.bg(ctx, t);
    const sp = ctx.lineSpan('l1'), w0 = ctx.wordTime('l1', 0);
    // مثلث التحذير يترسم
    const k = at(lt, 0.0, 0.75, 'cubicOut'), pulse = 1 + 0.035 * ctx.beatPulse(t, 7, 1);
    X.save(); X.translate(540, 560); X.scale(pulse * (0.92 + 0.08 * k), pulse * (0.92 + 0.08 * k));
    ctx.drawPath(X, [[0, -210], [215, 170], [-215, 170], [0, -210]], k, { width: 22, color: red, cap: 'round', smooth: false });
    const ek = at(lt, 0.55, 0.9, 'cubicOut');
    if (ek > 0) { X.globalAlpha = ek; X.fillStyle = red; X.beginPath(); X.roundRect(-14, -90, 28, 150, 14); X.fill(); X.beginPath(); X.arc(0, 108, 17, 0, 6.2832); X.fill(); }
    X.restore();
    // «انتبه!»
    FX.riseUp(ctx, t, { text: 'انتبه!', s: Math.max(0.35, w0.s), x: 540, y: 1000, size: 210, stagger: 0.1 });
    ISB.line(ctx, t, 'l1', { y: 1240, size: 70, maxWidth: 900, step: 0.3, dim: 0.1, accent: [] });
  }
});
