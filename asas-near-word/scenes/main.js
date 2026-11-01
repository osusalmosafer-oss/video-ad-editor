/* «كلمة قريب من الحرم لا تكفي» — أسس المسافر. موشن جرافيك خالص.
   هوك ← نفس الكلمة، مسافات مختلفة (3 فنادق عامة) ← اسأل بالدقائق ← وإلى أي باب ← والمشي يختلف حسب من معك ← ختام. بلا أرقام. كل شي من t بس. */
const W = 1080, H = 1920;
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };

const ICONS = {
  clock: [[circ(0, 10, 140), 'i', 0], ['M-30 -150 L30 -150', 'i', 1], ['M0 10 L0 -80', 'a', 2], ['M0 10 L70 50', 'a', 3]],
  door: [['M-110 150 L-110 -20 C-110 -140 110 -140 110 -20 L110 150', 'i', 0], ['M-60 150 L-60 -10 C-60 -80 60 -80 60 -10 L60 150', 'i', 1], ['M-170 150 L170 150', 'i', 2], ['M-30 70 L30 70 M10 50 L30 70 L10 90', 'a', 3]],
  people: [[circ(-80, -95, 34), 'i', 0], ['M-80 -58 L-80 40 M-80 -20 L-125 20 M-80 -20 L-35 20 M-80 40 L-110 130 M-80 40 L-50 130', 'i', 1],
           ['M150 40 L150 140', 'a', 2], [circ(70, -20, 24), 'a', 2], ['M70 6 L70 70 M70 30 L40 55 M70 30 L100 55 M70 70 L50 130 M70 70 L90 130', 'a', 3]],
};
const DUR = [3.6, 6.6, 4.2, 4.2, 4.4, 5];
const START = DUR.reduce((a, d, i) => (a.push(i ? a[i - 1] + DUR[i - 1] : 0), a), []);
const T_TR = 0.8;

MOTION.scene({
  id: 'main', start: 0, end: 28,
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx;
    const cfg = (ctx.project && ctx.project.p) || {};
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');
    const bg = Y => { Y.fillStyle = P.bg; Y.fillRect(0, 0, W, H); };
    const T = (Y, s, x, y, o) => ctx.text(Y, s, x, y, o);
    const panel = (Y, cx, cy, s, k) => { Y.save(); Y.translate(cx, cy); Y.scale(0.95 + 0.05 * k, 0.95 + 0.05 * k); Y.globalAlpha = k; Y.fillStyle = 'rgba(255,255,255,0.06)'; Y.strokeStyle = 'rgba(255,255,255,0.18)'; Y.lineWidth = 3; const p = new Path2D(rr(-s / 2, -s / 2, s, s, 64)); Y.fill(p); Y.stroke(p); Y.restore(); };
    const icon = (Y, id, u, cx, cy, S, spin) => { const fl = Math.sin(u * 1.3) * 5; Y.save(); Y.translate(cx, cy + fl); Y.scale(S, S); ICONS[id].forEach(([d, c, dl]) => ctx.drawPath(Y, d, ease(u, 0.3 + dl * 0.14, 0.3 + dl * 0.14 + 0.6, 'cubicOut'), { width: 14, color: c === 'a' ? P.acc : P.ink })); Y.restore(); };
    const hotel = (Y, x, y, S, k) => { Y.save(); Y.translate(x, y); Y.scale(S, S); Y.globalAlpha = k; const L = (d, c) => { Y.strokeStyle = c; Y.lineWidth = 12; Y.lineCap = 'round'; Y.stroke(new Path2D(d)); };
      L(rr(-55, -110, 110, 220, 10), P.ink); L('M-30 -70 L-10 -70 M10 -70 L30 -70 M-30 -25 L-10 -25 M10 -25 L30 -25 M-30 20 L-10 20 M10 20 L30 20', P.ink); L('M-16 110 L-16 70 L16 70 L16 110', P.acc); Y.restore(); };
    const kaaba = (Y, x, y, S, k) => { Y.save(); Y.translate(x, y); Y.scale(S, S); Y.globalAlpha = k; Y.strokeStyle = P.ink; Y.lineWidth = 12; Y.stroke(new Path2D(rr(-75, -70, 150, 150, 8))); Y.strokeStyle = P.acc; Y.beginPath(); Y.moveTo(-75, -25); Y.lineTo(75, -25); Y.stroke(); Y.restore(); };

    /* 1) هوك */
    const hook = (Y, u) => {
      bg(Y);
      const a1 = Math.max(0.35, ease(u, 0.0, 0.6)), a2 = ease(u, 1.2, 1.8, 'backOut');
      T(Y, 'كلمة', 540, 560, { family: 'body', weight: 700, size: 64, color: P.mut, alpha: a1, maxWidth: 780 });
      T(Y, 'قريب من الحرم', 540, 740 + 30 * (1 - a1), { family: 'display', weight: 900, size: 118, color: P.ink, alpha: a1, maxWidth: 780 });
      ctx.drawPath(Y, [[260, 790], [540, 800], [820, 786]], ease(u, 0.8, 1.4, 'cubicInOut'), { width: 12, color: P.acc });
      T(Y, 'تكفي؟', 540, 1020 + 30 * (1 - a2), { family: 'display', weight: 900, size: 170, color: P.acc, alpha: Math.min(1, a2 * 1.2), maxWidth: 780 });
      const nk = ease(u, 2.2, 2.8); if (nk > 0) T(Y, 'لا', 540, 1230, { family: 'display', weight: 900, size: 120, color: P.ink, alpha: nk, maxWidth: 400 });
    };

    /* 2) نفس الكلمة، مسافات مختلفة */
    const compare = (Y, u) => {
      bg(Y);
      T(Y, 'نفس الكلمة', 540, 330, { family: 'display', weight: 900, size: 92, color: P.ink, alpha: ease(u, 0.1, 0.6), maxWidth: 780 });
      T(Y, 'مسافات مختلفة', 540, 450, { family: 'display', weight: 900, size: 92, color: P.acc, alpha: ease(u, 0.5, 1.1), maxWidth: 780 });
      const rows = [[720, 330, 0.9], [1000, 570, 1.5], [1280, 830, 2.1]];
      rows.forEach(([y, hx, t0], i) => {
        const k = ease(u, t0 - 0.4, t0, 'cubicOut');
        kaaba(Y, 150, y, 0.75, Math.max(0.0, ease(u, 0.6, 1.0)));
        const dur = 1.0 + i * 0.5, p = ease(u, t0, t0 + dur, 'cubicInOut');
        Y.save(); Y.strokeStyle = 'rgba(255,255,255,0.35)'; Y.lineWidth = 6; Y.setLineDash([4, 14]); Y.lineCap = 'round'; Y.beginPath(); Y.moveTo(230, y); Y.lineTo(230 + (hx - 230 - 90) * p, y); Y.stroke(); Y.restore();
        const hk = ease(u, t0 + dur * 0.6, t0 + dur * 0.6 + 0.5, 'cubicOut'); hotel(Y, hx, y, 0.7, hk);
        if (hk > 0.01) { Y.save(); Y.globalAlpha = hk; Y.fillStyle = P.acc; const w = 150, pp = new Path2D(rr(hx - w / 2, y - 140, w, 52, 26)); Y.fill(pp); Y.restore(); T(Y, 'قريب', hx, y - 103, { family: 'body', weight: 700, size: 34, color: P.ink, alpha: hk, maxWidth: 130 }); }
      });
      T(Y, 'الشكل توضيحي', 540, 1480, { family: 'body', weight: 500, size: 36, color: P.mut, alpha: ease(u, 3.2, 3.8), maxWidth: 780 });
    };

    /* 3-5) أسئلة */
    const ask = (Y, u, id, l1, l2, sub) => {
      bg(Y);
      panel(Y, 540, 640, 520, ease(u, 0.05, 0.6, 'cubicOut'));
      icon(Y, id, u, 540, 640, 0.95);
      const k1 = ease(u, 0.5, 1.1), k2 = ease(u, 0.8, 1.4), k3 = ease(u, 1.3, 1.9);
      T(Y, l1, 540, 1090 + 36 * (1 - k1), { family: 'display', weight: 900, size: 92, color: P.ink, alpha: k1, maxWidth: 780 });
      T(Y, l2, 540, 1205 + 36 * (1 - k2), { family: 'display', weight: 900, size: 92, color: P.acc, alpha: k2, maxWidth: 780 });
      if (sub) T(Y, sub, 540, 1340 + 24 * (1 - k3), { family: 'body', weight: 700, size: 46, color: P.mut, alpha: k3, maxWidth: 780 });
    };

    /* 6) ختام */
    const outro = (Y, u) => {
      bg(Y);
      const k = ease(u, 0.2, 1.0, 'cubicOut');
      if (ctx.img('logo')) { const im = ctx.img('logo'), w = 520, h = w * im.height / im.width; Y.save(); Y.globalAlpha = k; Y.drawImage(im, 540 - w / 2, 300 + 30 * (1 - k), w, h); Y.restore(); }
      const a1 = ease(u, 1.1, 1.7), a2 = ease(u, 1.7, 2.3);
      T(Y, 'الرابط في البايو', 540, 1230 + 30 * (1 - a1), { family: 'display', weight: 900, size: 80, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.drawPath(Y, [[330, 1280], [540, 1288], [750, 1278]], ease(u, 1.5, 2.1, 'cubicInOut'), { width: 10, color: P.acc });
      T(Y, cfg.phone || '+966566403938', 540, 1400 + 20 * (1 - a2), { family: 'num', weight: 800, size: 68, color: P.acc, alpha: a2, dir: 'ltr', maxWidth: 800 });
    };

    const N = DUR.length;
    const drawSeg = (Y, i) => { const u = t - (START[i] - (i > 0 ? T_TR : 0));
      if (i === 0) hook(Y, u); else if (i === 1) compare(Y, u);
      else if (i === 2) ask(Y, u, 'clock', 'اسأل بالدقائق', 'مو بالكلمة', 'كم دقيقة مشي؟');
      else if (i === 3) ask(Y, u, 'door', 'وإلى أي باب؟', 'حدّد الباب', 'المشي يختلف من باب لباب');
      else if (i === 4) ask(Y, u, 'people', 'والمشي يختلف', 'حسب من معك', 'كبار السن · الأطفال');
      else outro(Y, u); };
    let idx = 0; for (let i = 0; i < N; i++) if (t >= START[i]) idx = i;
    const nx = idx + 1, tr0 = nx < N ? START[nx] - T_TR : Infinity;
    if (t >= tr0) FX.softWipe(ctx, t, { s: tr0, dur: T_TR, band: 240, A: Y => drawSeg(Y, idx), B: Y => drawSeg(Y, nx) });
    else drawSeg(X, idx);
  },
});
