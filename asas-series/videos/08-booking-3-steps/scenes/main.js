/* قالب موحّد لسلسلة موشن جرافيك أسس المسافر. كل فيديو = مواصفات JSON في project.json ← spec.scenes.
   الأنواع: hook · icon · list · tiers · compare2 · steps · qa · rows · bars · outro. هوية: كحلي/أبيض/أزرق + Cairo. لا أرقام إلا من spec. كل شي من t بس. */
const W = 1080, H = 1920, T_TR = 0.8;
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };

/* أيقونات [مسار، 'i' أبيض | 'a' أزرق، تأخير] — مركزها (0,0) داخل ~±170 */
const ICONS = {
  window: [[rr(-130, -150, 260, 300, 26), 'i', 0], ['M0 -150 L0 150', 'i', 1], ['M-130 0 L130 0', 'i', 1], [rr(-100, 30, 70, 90, 6), 'a', 2], ['M-100 58 L-30 58', 'a', 3]],
  building: [[rr(-70, -160, 140, 320, 10), 'i', 0], ['M-35 -110 L-10 -110 M10 -110 L35 -110 M-35 -60 L-10 -60 M10 -60 L35 -60 M-35 -10 L-10 -10 M10 -10 L35 -10 M-35 40 L-10 40 M10 40 L35 40', 'i', 1], ['M-18 160 L-18 100 L18 100 L18 160', 'a', 2], ['M-70 -160 L70 -160', 'a', 3]],
  hotel: [[rr(-60, -140, 120, 270, 10), 'i', 0], ['M-32 -95 L-10 -95 M10 -95 L32 -95 M-32 -45 L-10 -45 M10 -45 L32 -45 M-32 5 L-10 5 M10 5 L32 5', 'i', 1], ['M-18 130 L-18 80 L18 80 L18 130', 'a', 2], ['M-170 150 L170 150', 'i', 3]],
  walk: [[circ(0, 0, 150), 'i', 0], ['M0 -150 L0 -118', 'i', 1], ['M0 150 L0 118', 'i', 1], ['M-150 0 L-118 0', 'i', 1], ['M150 0 L118 0', 'i', 1], ['M-55 60 L55 -60', 'a', 2], ['M5 -62 L57 -62 L57 -10', 'a', 3], [circ(-70, 75, 12), 'a', 4]],
  bus: [[rr(-160, -95, 320, 170, 30), 'i', 0], ['M-160 -20 L160 -20', 'i', 1], ['M-110 -62 L-55 -62 M-25 -62 L30 -62 M60 -62 L115 -62', 'a', 2], [circ(-95, 95, 26), 'i', 3], [circ(95, 95, 26), 'i', 3]],
  people: [[circ(-80, -95, 34), 'i', 0], ['M-80 -58 L-80 40 M-80 -20 L-125 20 M-80 -20 L-35 20 M-80 40 L-110 130 M-80 40 L-50 130', 'i', 1], ['M150 40 L150 140', 'a', 2], [circ(70, -20, 24), 'a', 2], ['M70 6 L70 70 M70 30 L40 55 M70 30 L100 55 M70 70 L50 130 M70 70 L90 130', 'a', 3]],
  cup: [['M-100 -20 L100 -20 L80 110 C75 130 -75 130 -80 110 Z', 'i', 0], ['M100 10 C160 10 160 80 92 80', 'i', 1], ['M-50 -50 C-70 -80 -30 -100 -50 -130', 'a', 2], ['M0 -50 C-20 -80 20 -100 0 -130', 'a', 2], ['M50 -50 C30 -80 70 -100 50 -130', 'a', 2], ['M-150 150 L150 150', 'i', 3]],
  bed: [['M-160 110 L-160 -30 L160 -30 L160 110', 'i', 0], ['M-160 110 L160 110', 'i', 1], ['M-160 50 L160 50', 'i', 1], [rr(-135, -85, 95, 50, 14), 'a', 2], ['M-160 -130 L-160 110', 'i', 3]],
  moon: [['M60 -130 C-40 -120 -100 -30 -80 60 C-60 140 40 170 110 120 C20 130 -30 60 -10 -20 C0 -70 30 -110 60 -130', 'a', 0], ['M130 -90 L140 -60 L170 -55 L145 -38 L152 -8 L130 -25 L108 -8 L115 -38 L90 -55 L120 -60 Z', 'i', 1]],
  shield: [['M0 -160 L135 -105 L135 20 C135 105 65 145 0 175 C-65 145 -135 105 -135 20 L-135 -105 Z', 'i', 0], ['M-55 10 L-12 55 L65 -35', 'a', 1]],
  doc: [[rr(-105, -160, 210, 320, 22), 'i', 0], ['M-60 -90 L60 -90', 'i', 1], ['M-60 -40 L60 -40', 'i', 1], ['M-60 10 L10 10', 'i', 2], ['M20 95 L52 127 L105 65', 'a', 3]],
  chat: [[rr(-150, -130, 300, 220, 50), 'i', 0], ['M-70 90 L-95 150 L-20 90', 'i', 1], [circ(-60, -20, 4), 'a', 2], [circ(0, -20, 4), 'a', 2], [circ(60, -20, 4), 'a', 2], ['M-60 30 C-20 55 20 55 60 30', 'a', 3]],
  tag: [['M-150 -60 L30 -60 L150 40 L30 140 L-150 140 Z', 'i', 0], [circ(-95, 40, 20), 'a', 1], ['M-60 40 L60 40', 'a', 2]],
  check: [[circ(0, 0, 150), 'i', 0], ['M-65 5 L-15 60 L75 -50', 'a', 1]],
  cross: [[circ(0, 0, 150), 'i', 0], ['M-60 -60 L60 60', 'a', 1], ['M60 -60 L-60 60', 'a', 1]],
  scale: [['M0 -150 L0 140', 'i', 0], ['M-85 150 L85 150', 'i', 1], ['M-145 -90 L145 -90', 'i', 2], ['M-145 -90 L-195 25 M-145 -90 L-95 25', 'i', 3], ['M-205 25 C-195 80 -95 80 -85 25 Z', 'a', 4], ['M145 -90 L95 25 M145 -90 L195 25', 'i', 3], ['M85 25 C95 80 195 80 205 25 Z', 'a', 4]],
  door: [['M-110 150 L-110 -20 C-110 -140 110 -140 110 -20 L110 150', 'i', 0], ['M-60 150 L-60 -10 C-60 -80 60 -80 60 -10 L60 150', 'i', 1], ['M-170 150 L170 150', 'i', 2], ['M-30 70 L30 70 M10 50 L30 70 L10 90', 'a', 3]],
  clock: [[circ(0, 10, 140), 'i', 0], ['M-30 -150 L30 -150', 'i', 1], ['M0 10 L0 -80', 'a', 2], ['M0 10 L70 50', 'a', 3]],
  bag: [['M-55 -75 L-55 -125 C-55 -135 -45 -140 -35 -140 L35 -140 C45 -140 55 -135 55 -125 L55 -75', 'i', 0], [rr(-130, -75, 260, 200, 34), 'i', 1], ['M-60 -75 L60 -75', 'i', 2], ['M-30 25 L0 55 L50 -10', 'a', 3]],
  kaaba: [[rr(-100, -90, 200, 200, 10), 'i', 0], ['M-100 -30 L100 -30', 'a', 1], ['M-15 -30 L-15 40 L40 40 L40 -30', 'a', 2], ['M-170 150 L170 150', 'i', 3]],
  cal: [[rr(-150, -120, 300, 270, 32), 'i', 0], ['M-150 -50 L150 -50', 'i', 1], ['M-80 -150 L-80 -100', 'i', 1], ['M80 -150 L80 -100', 'i', 1], [rr(-100, 0, 60, 60, 10), 'a', 2], ['M-10 30 L110 30', 'i', 2], ['M-100 100 L110 100', 'i', 3]],
  question: [['M-70 -80 C-70 -180 90 -180 90 -80 C90 -20 0 -20 0 50', 'i', 0], [circ(0, 115, 12), 'a', 1]],
  pin: [['M0 160 C-90 50 -110 10 -110 -40 C-110 -110 -60 -160 0 -160 C60 -160 110 -110 110 -40 C110 10 90 50 0 160', 'i', 0], [circ(0, -50, 35), 'a', 1]],
  money: [[rr(-170, -90, 340, 180, 24), 'i', 0], [circ(0, 0, 48), 'a', 1], ['M-130 -50 L-130 -50 M130 50 L130 50', 'i', 2]],
};

MOTION.scene({
  id: 'main', start: 0, end: 30,
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx;
    const spec = (ctx.project && ctx.project.spec) || { scenes: [] };
    const phone = spec.phone || '+966566403938';
    const SC = spec.scenes.concat([{ type: 'outro', d: 5 }]);
    const START = []; let acc = 0; SC.forEach(s => { START.push(acc); acc += s.d; });
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');
    const T = (Y, s, x, y, o) => ctx.text(Y, s, x, y, o);
    const bg = Y => { Y.fillStyle = P.bg; Y.fillRect(0, 0, W, H); };
    const panel = (Y, cx, cy, s, k) => { Y.save(); Y.translate(cx, cy); Y.scale(0.95 + 0.05 * k, 0.95 + 0.05 * k); Y.globalAlpha = k; Y.fillStyle = 'rgba(255,255,255,0.06)'; Y.strokeStyle = 'rgba(255,255,255,0.18)'; Y.lineWidth = 3; const p = new Path2D(rr(-s / 2, -s / 2, s, s, s * 0.12)); Y.fill(p); Y.stroke(p); Y.restore(); };
    const card = (Y, x, y, w, h, k, fill) => { Y.save(); Y.globalAlpha = k; Y.fillStyle = fill || 'rgba(255,255,255,0.06)'; Y.strokeStyle = fill ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.18)'; Y.lineWidth = 3; const p = new Path2D(rr(x, y, w, h, 36)); Y.fill(p); Y.stroke(p); Y.restore(); };
    const icon = (Y, id, u, cx, cy, S, minK, w) => { const fl = Math.sin(u * 1.3) * 4; Y.save(); Y.translate(cx, cy + fl); Y.scale(S, S); (ICONS[id] || ICONS.question).forEach(([d, c, dl]) => ctx.drawPath(Y, d, Math.max(minK || 0, ease(u, 0.3 + dl * 0.14, 0.3 + dl * 0.14 + 0.6, 'cubicOut')), { width: w || 14, color: c === 'a' ? P.acc : P.ink })); Y.restore(); };
    const col = c => c === 'acc' ? P.acc : (c === 'mut' ? P.mut : P.ink);
    const mark = (Y, kind, x, y, k, ck, R) => {
      Y.save(); Y.strokeStyle = P.mut; Y.lineWidth = 6; Y.globalAlpha = 1; Y.beginPath(); Y.arc(x, y, R, 0, 6.2832); Y.stroke(); Y.restore();
      if (k > 0.02) { Y.save(); Y.translate(x, y); Y.scale(k, k); Y.fillStyle = P.acc; Y.beginPath(); Y.arc(0, 0, R + 2, 0, 6.2832); Y.fill(); Y.restore();
        if (ck > 0) { if (kind === 'cross') { ctx.drawPath(Y, `M${x - 17} ${y - 17} L${x + 17} ${y + 17}`, ck, { width: 9, color: P.onAcc, smooth: false }); ctx.drawPath(Y, `M${x + 17} ${y - 17} L${x - 17} ${y + 17}`, ck, { width: 9, color: P.onAcc, smooth: false }); }
          else if (kind === 'ask') T(Y, '؟', x, y + 20, { family: 'display', weight: 900, size: 62, color: P.onAcc, alpha: ck });
          else ctx.drawPath(Y, [[x - 19, y + 2], [x - 5, y + 16], [x + 20, y - 14]], ck, { width: 9, color: P.onAcc, smooth: false }); } }
    };
    const note = (Y, u, s) => { if (s.note) T(Y, s.note, 540, 1465, { family: 'body', weight: 500, size: 36, color: P.mut, alpha: ease(u, 1.6, 2.2), maxWidth: 780 }); };

    /* ── hook ── */
    const hook = (Y, u, s) => {
      bg(Y);
      const a1 = Math.max(0.4, ease(u, 0, 0.6)), a2 = ease(u, 0.8, 1.4);
      if (s.icon) {
        panel(Y, 540, 600, 480, Math.max(0.5, ease(u, 0, 0.5, 'cubicOut')));
        icon(Y, s.icon, u, 540, 600, 0.9, 0.25);
        T(Y, s.l1, 540, 1070 + 36 * (1 - a1), { family: 'display', weight: 900, size: 98, color: P.ink, alpha: a1, maxWidth: 780 });
        T(Y, s.l2, 540, 1195 + 36 * (1 - a2), { family: 'display', weight: 900, size: 98, color: P.acc, alpha: a2, maxWidth: 780 });
      } else {
        T(Y, s.l1, 540, 760 + 36 * (1 - a1), { family: 'display', weight: 900, size: 118, color: P.ink, alpha: a1, maxWidth: 780 });
        T(Y, s.l2, 540, 930 + 36 * (1 - a2), { family: 'display', weight: 900, size: 118, color: P.acc, alpha: a2, maxWidth: 780 });
      }
      note(Y, u, s);
    };

    /* ── icon ── */
    const iconScene = (Y, u, s) => {
      bg(Y);
      panel(Y, 540, 600, 480, ease(u, 0.05, 0.6, 'cubicOut'));
      icon(Y, s.icon, u, 540, 600, 0.9);
      const k0 = ease(u, 0.4, 1.0), k1 = ease(u, 0.6, 1.2), k2 = ease(u, 0.9, 1.5), k3 = ease(u, 1.3, 1.9);
      if (s.kicker) T(Y, s.kicker, 540, 1010 + 24 * (1 - k0), { family: 'body', weight: 700, size: 50, color: P.mut, alpha: k0, maxWidth: 780 });
      T(Y, s.l1, 540, 1135 + 36 * (1 - k1), { family: 'display', weight: 900, size: 92, color: P.ink, alpha: k1, maxWidth: 780 });
      if (s.l2) T(Y, s.l2, 540, 1250 + 36 * (1 - k2), { family: 'display', weight: 900, size: 92, color: P.acc, alpha: k2, maxWidth: 780 });
      if (s.sub) T(Y, s.sub, 540, 1375 + 24 * (1 - k3), { family: 'body', weight: 700, size: 44, color: P.mut, alpha: k3, maxWidth: 780 });
      note(Y, u, s);
    };

    /* ── list: قائمة بعلامات (check|cross|ask) ── */
    const list = (Y, u, s) => {
      bg(Y);
      T(Y, s.title, 540, 330 + 24 * (1 - ease(u, 0.1, 0.7)), { family: 'display', weight: 900, size: 88, color: P.ink, alpha: ease(u, 0.1, 0.7), maxWidth: 800 });
      if (s.sub) T(Y, s.sub, 540, 440, { family: 'body', weight: 700, size: 50, color: P.mut, alpha: ease(u, 0.5, 1.0), maxWidth: 780 });
      const n = s.items.length, gap = n <= 3 ? 220 : (n === 4 ? 190 : 165), y0 = n <= 3 ? 700 : 620;
      s.items.forEach((it, i) => {
        const T0 = 0.8 + i * 0.55, y = y0 + i * gap, x = 880, R = 44;
        const k = ease(u, T0, T0 + 0.3, 'backOut'), ck = ease(u, T0 + 0.1, T0 + 0.45, 'cubicOut'), tx = ease(u, T0 + 0.05, T0 + 0.5);
        mark(Y, s.mark || 'check', x, y, k, ck, R);
        T(Y, it, x - 80 + 40 * (1 - tx), y + 22, { family: 'body', weight: 700, size: 60, align: 'right', color: P.ink, alpha: tx, maxWidth: 720 });
      });
      note(Y, u, s);
    };

    /* ── tiers: بطاقات متراصة (عنوان + وصف + أيقونة) ── */
    const tiers = (Y, u, s) => {
      bg(Y);
      T(Y, s.title, 540, 330 + 24 * (1 - ease(u, 0.1, 0.7)), { family: 'display', weight: 900, size: 80, color: P.ink, alpha: ease(u, 0.1, 0.7), maxWidth: 800 });
      const n = s.items.length, h = n === 2 ? 330 : 250, gap = 36, y0 = 500;
      s.items.forEach((it, i) => {
        const T0 = 0.7 + i * 0.7, k = ease(u, T0, T0 + 0.5, 'cubicOut'), y = y0 + i * (h + gap);
        card(Y, 150, y + 24 * (1 - k), 780, h, k);
        Y.save(); Y.globalAlpha = k; Y.translate(0, 24 * (1 - k)); icon(Y, it.icon || 'window', Math.max(0.0, u - T0 + 0.4), 800, y + h / 2, n === 2 ? 0.42 : 0.34, 0.2, 12); Y.restore();
        T(Y, it.t, 700, y + (it.d ? h * 0.4 : h * 0.55) + 24 * (1 - k), { family: 'display', weight: 900, size: n === 2 ? 60 : 54, align: 'right', color: P.ink, alpha: k, maxWidth: 520 });
        if (it.d) T(Y, it.d, 700, y + h * 0.72 + 24 * (1 - k), { family: 'body', weight: 700, size: 38, align: 'right', color: P.mut, alpha: k, maxWidth: 520 });
      });
      note(Y, u, s);
    };

    /* ── compare2: عمودان متقابلان ── */
    const compare2 = (Y, u, s) => {
      bg(Y);
      T(Y, s.title, 540, 330, { family: 'display', weight: 900, size: 84, color: P.ink, alpha: ease(u, 0.1, 0.7), maxWidth: 800 });
      s.cols.forEach((c, i) => {
        const T0 = 0.6 + i * 0.6, k = ease(u, T0, T0 + 0.6, 'cubicOut'), x = i === 0 ? 560 : 140, cx = x + 190;
        card(Y, x, 460 + 30 * (1 - k), 380, 820, k, i === 0 ? null : null);
        Y.save(); Y.globalAlpha = k; Y.translate(0, 30 * (1 - k)); icon(Y, c.icon, Math.max(0, u - T0), cx, 660, 0.55, 0.2, 14); Y.restore();
        T(Y, c.t, cx, 920 + 30 * (1 - k), { family: 'display', weight: 900, size: 76, color: i === 0 ? P.ink : P.acc, alpha: k, maxWidth: 340 });
        c.b.forEach((b, j) => T(Y, b, cx, 1030 + j * 100, { family: 'body', weight: 700, size: 38, color: P.mut, alpha: ease(u, T0 + 0.5 + j * 0.3, T0 + 1.0 + j * 0.3), maxWidth: 330 }));
      });
      note(Y, u, s);
    };

    /* ── steps: خطوات متسلسلة مرقّمة ── */
    const steps = (Y, u, s) => {
      bg(Y);
      T(Y, s.title, 540, 330 + 24 * (1 - ease(u, 0.1, 0.7)), { family: 'display', weight: 900, size: 84, color: P.ink, alpha: ease(u, 0.1, 0.7), maxWidth: 800 });
      const n = s.items.length, gap = n <= 3 ? 290 : 235, y0 = 600, x = 860, R = 50;
      for (let i = 0; i < n - 1; i++) { const k = ease(u, 0.9 + i * 0.9, 1.5 + i * 0.9, 'cubicInOut'); Y.fillStyle = 'rgba(255,255,255,0.18)'; Y.fillRect(x - 3, y0 + i * gap + R, 6, gap - 2 * R); if (k > 0) { Y.fillStyle = P.acc; Y.fillRect(x - 3, y0 + i * gap + R, 6, (gap - 2 * R) * k); } }
      s.items.forEach((it, i) => {
        const T0 = 0.7 + i * 0.9, y = y0 + i * gap, k = ease(u, T0, T0 + 0.35, 'backOut'), tx = ease(u, T0 + 0.1, T0 + 0.6);
        Y.save(); Y.strokeStyle = P.mut; Y.lineWidth = 6; Y.beginPath(); Y.arc(x, y, R, 0, 6.2832); Y.stroke(); Y.restore();
        if (k > 0.02) { Y.save(); Y.translate(x, y); Y.scale(k, k); Y.fillStyle = P.acc; Y.beginPath(); Y.arc(0, 0, R + 2, 0, 6.2832); Y.fill(); Y.restore(); T(Y, String(i + 1), x, y + 22, { family: 'num', weight: 900, size: 62, color: P.onAcc, dir: 'ltr', alpha: k }); }
        T(Y, typeof it === 'string' ? it : it.t, x - 85 + 40 * (1 - tx), y - (it.d ? 2 : -20), { family: 'display', weight: 900, size: 58, align: 'right', color: P.ink, alpha: tx, maxWidth: 700 });
        if (it.d) T(Y, it.d, x - 85 + 40 * (1 - tx), y + 54, { family: 'body', weight: 700, size: 38, align: 'right', color: P.mut, alpha: tx, maxWidth: 700 });
      });
      note(Y, u, s);
    };

    /* ── qa: سؤال (فقاعة) ثم جواب ── */
    const qa = (Y, u, s) => {
      bg(Y);
      T(Y, s.tag || 'سؤال من تعليقاتكم', 540, 320, { family: 'body', weight: 700, size: 52, color: P.mut, alpha: ease(u, 0.1, 0.6), maxWidth: 780 });
      const kq = ease(u, 0.3, 1.0, 'cubicOut'); card(Y, 140, 400 + 24 * (1 - kq), 800, 340, kq);
      Y.save(); Y.globalAlpha = kq; Y.fillStyle = P.acc; Y.beginPath(); Y.arc(840, 470 + 24 * (1 - kq), 26, 0, 6.2832); Y.fill(); Y.restore();
      T(Y, '؟', 840, 490 + 24 * (1 - kq), { family: 'display', weight: 900, size: 44, color: P.onAcc, alpha: kq });
      s.q.forEach((l, i) => T(Y, l, 540, 600 + i * 95 + 24 * (1 - kq), { family: 'display', weight: 900, size: 64, color: P.ink, alpha: kq, maxWidth: 720 }));
      const ka = ease(u, 1.8, 2.6, 'cubicOut'); card(Y, 140, 840 + 30 * (1 - ka), 800, 380, ka, P.acc);
      s.a.forEach((l, i) => T(Y, l, 540, 1000 + i * 100 + 30 * (1 - ka), { family: 'display', weight: 900, size: 72, color: P.ink, alpha: ka, maxWidth: 720 }));
      if (s.after) T(Y, s.after, 540, 1340, { family: 'body', weight: 700, size: 46, color: P.mut, alpha: ease(u, 2.8, 3.4), maxWidth: 780 });
      note(Y, u, s);
    };

    /* ── rows: بنود مع شارة حالة (free | cond | paid) ── */
    const rows = (Y, u, s) => {
      bg(Y);
      T(Y, s.title, 540, 330 + 24 * (1 - ease(u, 0.1, 0.7)), { family: 'display', weight: 900, size: 84, color: P.ink, alpha: ease(u, 0.1, 0.7), maxWidth: 800 });
      s.items.forEach((it, i) => {
        const T0 = 0.8 + i * 0.7, k = ease(u, T0, T0 + 0.5, 'cubicOut'), y = 560 + i * 250;
        card(Y, 120, y + 20 * (1 - k), 820, 200, k);
        T(Y, it.t, 900, y + 118 + 20 * (1 - k), { family: 'body', weight: 700, size: 50, align: 'right', color: P.ink, alpha: k, maxWidth: 470 });
        const filled = it.tone === 'free', outline = it.tone === 'cond';
        Y.save(); Y.globalAlpha = k; const px = 160, pw = 250, ph = 86, py = y + 57 + 20 * (1 - k), p = new Path2D(rr(px, py, pw, ph, 43));
        if (filled) { Y.fillStyle = P.acc; Y.fill(p); } else { Y.strokeStyle = outline ? P.acc : P.mut; Y.lineWidth = 5; Y.stroke(p); } Y.restore();
        T(Y, it.c, px + pw / 2, py + 58, { family: 'body', weight: 700, size: 38, color: filled ? P.onAcc : (outline ? P.acc : P.mut), alpha: k, maxWidth: pw - 24 });
      });
      note(Y, u, s);
    };

    /* ── bars: ترتيب أعمدة أفقية (قيم من spec فقط) ── */
    const bars = (Y, u, s) => {
      bg(Y);
      T(Y, s.title, 540, 330 + 24 * (1 - ease(u, 0.1, 0.7)), { family: 'display', weight: 900, size: 80, color: P.ink, alpha: ease(u, 0.1, 0.7), maxWidth: 800 });
      const max = Math.max(...s.items.map(i => i.v)), gap = 175, y0 = 600;
      s.items.forEach((it, i) => {
        const T0 = 0.7 + i * 0.5, k = ease(u, T0, T0 + 0.9, 'cubicOut'), y = y0 + i * gap, len = 400 * (it.v / max) * k;
        T(Y, it.t, 920, y - 18, { family: 'body', weight: 700, size: 42, align: 'right', color: P.ink, alpha: ease(u, T0, T0 + 0.4), maxWidth: 560 });
        Y.fillStyle = 'rgba(255,255,255,0.10)'; Y.fill(new Path2D(rr(520, y + 4, 400, 54, 27)));
        if (len > 8) { Y.fillStyle = i === 0 ? P.acc : 'rgba(40,132,255,0.62)'; Y.fill(new Path2D(rr(920 - len, y + 4, len, 54, 27))); }
        T(Y, String(Math.round(it.v * ease(u, T0, T0 + 0.9, 'cubicOut'))), 490, y + 50, { family: 'num', weight: 900, size: 54, align: 'right', color: P.ink, dir: 'ltr', alpha: ease(u, T0, T0 + 0.4) });
      });
      note(Y, u, s);
    };

    /* ── ختام ── */
    const outro = (Y, u) => {
      bg(Y);
      const k = ease(u, 0.2, 1.0, 'cubicOut');
      if (ctx.img('logo')) { const im = ctx.img('logo'), w = 520, h = w * im.height / im.width; Y.save(); Y.globalAlpha = k; Y.drawImage(im, 540 - w / 2, 300 + 30 * (1 - k), w, h); Y.restore(); }
      const a1 = ease(u, 1.1, 1.7), a2 = ease(u, 1.7, 2.3);
      T(Y, 'الرابط في البايو', 540, 1230 + 30 * (1 - a1), { family: 'display', weight: 900, size: 80, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.drawPath(Y, [[330, 1280], [540, 1288], [750, 1278]], ease(u, 1.5, 2.1, 'cubicInOut'), { width: 10, color: P.acc });
      T(Y, phone, 540, 1400 + 20 * (1 - a2), { family: 'num', weight: 800, size: 68, color: P.acc, alpha: a2, dir: 'ltr', maxWidth: 800 });
    };

    const FN = { hook, icon: iconScene, list, tiers, compare2, steps, qa, rows, bars, outro };
    const N = SC.length;
    const drawSeg = (Y, i) => { const u = t - (START[i] - (i > 0 ? T_TR : 0)); (FN[SC[i].type] || hook)(Y, u, SC[i]); };
    let idx = 0; for (let i = 0; i < N; i++) if (t >= START[i]) idx = i;
    const nx = idx + 1, tr0 = nx < N ? START[nx] - T_TR : Infinity;
    if (t >= tr0) FX.softWipe(ctx, t, { s: tr0, dur: T_TR, band: 240, A: Y => drawSeg(Y, idx), B: Y => drawSeg(Y, nx) });
    else drawSeg(X, idx);
  },
});
