/* «كم يبعد فعلاً؟» — عدّاد المشي الحقيقي. حلقة 1: شيراتون جبل الكعبة.
   كل الأرقام والنصوص المتغيرة من project.json ← walk (المالك يعبّئها من قياسه). لا رقم من عندي.
   هوك سؤال + عدّاد من أول فريم ← مسار يُرسم والعدّاد يمشي ← النتيجة ← الباص (اختياري) ← «اسأل قبل ما تحجز» ← ختام. */
const W = 1080, H = 1920;
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };

const HOTEL = [   // فندق (مركزه 0,0، ارتفاع ~220)
  [rr(-55, -110, 110, 220, 10), 'i'], ['M-30 -70 L-10 -70 M10 -70 L30 -70 M-30 -25 L-10 -25 M10 -25 L30 -25 M-30 20 L-10 20 M10 20 L30 20', 'i'], ['M-16 110 L-16 70 L16 70 L16 110', 'a']];
const KAABA = [   // كعبة (مكعب + حزام)
  [rr(-75, -70, 150, 150, 8), 'i'], ['M-75 -25 L75 -25', 'a'], ['M-10 -25 L-10 25 L30 25 L30 -25', 'a']];
const BUS = [
  [rr(-150, -80, 300, 150, 28), 'i'], ['M-150 -10 L150 -10', 'i'], ['M-100 -55 L-50 -55 M-20 -55 L30 -55 M60 -55 L110 -55', 'a'], [circ(-85, 85, 24), 'i'], [circ(85, 85, 24), 'i']];

MOTION.scene({
  id: 'main', start: 0, end: 33.1,   // بلا باص (bus.available:false) = 28.1
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx;
    const cfg = (ctx.project && ctx.project.walk) || {};
    const bus = cfg.bus || {}, sample = !!cfg.sample, mins = Number(cfg.walkMinutes) || 0;
    const hotel = cfg.hotel || 'الفندق', door = cfg.door || 'باب [اسم الباب]';
    const ph = (v, fallback) => (v ? v : '[' + fallback + ']');
    const hasBus = bus.available !== false;
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');
    const bg = Y => { Y.fillStyle = P.bg; Y.fillRect(0, 0, W, H); };

    /* توقيت: قائمة المشاهد */
    const segs = [{ n: 'hook', d: 3.4 }, { n: 'walk', d: 10.5 }, { n: 'result', d: 5 }];
    if (hasBus) segs.push({ n: 'bus', d: 5 });
    segs.push({ n: 'ask', d: 4.2 }, { n: 'outro', d: 5 });
    let acc0 = 0; segs.forEach(s => { s.s = acc0; acc0 += s.d; });
    const T_END = acc0, T_TR = 0.9;

    const sampleTag = Y => { if (!sample) return; ctx.text(Y, 'عيّنة — أرقام تجريبية', 540, 215, { family: 'body', weight: 700, size: 36, color: P.acc, alpha: 0.95 }); };
    const drawIcon = (Y, spec, cx, cy, S, k, width) => { Y.save(); Y.translate(cx, cy); Y.scale(S, S); spec.forEach(([d, c], i) => ctx.drawPath(Y, d, ease(k, i * 0.12, i * 0.12 + 0.6, 'cubicOut'), { width: width || 14, color: c === 'a' ? P.acc : P.ink })); Y.restore(); };
    const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
    const timer = (Y, sec, y, size, color) => {
      const str = fmt(sec), cw = size * 0.62, colw = size * 0.34, total = (str.length - 1) * cw + colw; let x = 540 - total / 2;
      [...str].forEach(ch => { if (ch === ':') { Y.fillStyle = color || P.ink; [-0.14, 0.14].forEach(o => { Y.beginPath(); Y.arc(x + colw / 2, y - size * 0.36 + o * size * 0.9 + size * 0.14, size * 0.05, 0, 6.2832); Y.fill(); }); x += colw; }
        else { ctx.text(Y, ch, x + cw / 2, y, { family: 'num', weight: 900, size, color: color || P.ink, dir: 'ltr' }); x += cw; } });
    };

    /* ── هوك ── */
    const hook = (Y, u) => {
      bg(Y); sampleTag(Y);
      timer(Y, 0, 420, 190, P.acc);                     // العدّاد ظاهر من أول فريم
      const a1 = ease(u, 0.1, 0.7), a2 = ease(u, 0.8, 1.4), a3 = ease(u, 1.5, 2.1);
      ctx.text(Y, 'كم يبعد فعلاً؟', 540, 900 + 40 * (1 - a1), { family: 'display', weight: 900, size: 150, color: P.ink, alpha: a1, maxWidth: 820 });
      ctx.text(Y, hotel, 540, 1070 + 30 * (1 - a2), { family: 'display', weight: 900, size: 84, color: P.acc, alpha: a2, maxWidth: 800 });
      ctx.text(Y, 'عن الحرم، بالمشي الحقيقي', 540, 1190 + 24 * (1 - a3), { family: 'body', weight: 700, size: 54, color: P.mut, alpha: a3, maxWidth: 800 });
    };

    /* ── المسار + العدّاد ── */
    const PATH = 'M300 1090 C300 930 760 990 760 800';
    const walk = (Y, u) => {
      bg(Y); sampleTag(Y);
      const k = ease(u, 1.0, 8.6, 'sineInOut');
      timer(Y, mins * 60 * k, 420, 190, P.ink);
      drawIcon(Y, KAABA, 760, 640, 0.9, ease(u, 0.1, 1.0, 'cubicOut'), 13);
      ctx.text(Y, door, 760, 790 - 0, { family: 'body', weight: 700, size: 38, color: P.mut, alpha: ease(u, 0.6, 1.2), maxWidth: 400 });
      drawIcon(Y, HOTEL, 300, 1250, 0.8, ease(u, 0.1, 1.0, 'cubicOut'), 13);
      ctx.text(Y, hotel, 300, 1450, { family: 'body', weight: 700, size: 40, color: P.ink, alpha: ease(u, 0.6, 1.2), maxWidth: 440 });
      ctx.drawPath(Y, PATH, 1, { width: 8, color: 'rgba(255,255,255,0.18)' });
      ctx.drawPath(Y, PATH, k, { width: 14, color: P.acc, tip: { r: 20, color: P.ink } });
    };

    /* ── النتيجة ── */
    const result = (Y, u) => {
      bg(Y); sampleTag(Y);
      const a1 = ease(u, 0.1, 0.8), a2 = ease(u, 0.7, 1.3), a3 = ease(u, 1.2, 1.8);
      ctx.text(Y, String(mins), 540, 780 + 40 * (1 - a1), { family: 'num', weight: 900, size: 460, color: P.acc, alpha: a1, dir: 'ltr' });
      ctx.text(Y, 'دقيقة مشي', 540, 960 + 30 * (1 - a2), { family: 'display', weight: 900, size: 130, color: P.ink, alpha: a2, maxWidth: 800 });
      ctx.text(Y, 'من ' + hotel, 540, 1090 + 24 * (1 - a3), { family: 'body', weight: 700, size: 54, color: P.mut, alpha: a3, maxWidth: 800 });
      ctx.text(Y, 'إلى ' + door, 540, 1170 + 24 * (1 - a3), { family: 'body', weight: 700, size: 54, color: P.ink, alpha: a3, maxWidth: 800 });
    };

    /* ── الباص ── */
    const busScene = (Y, u) => {
      bg(Y); sampleTag(Y);
      Y.save(); Y.globalAlpha = ease(u, 0, 0.6); Y.fillStyle = 'rgba(255,255,255,0.06)'; Y.strokeStyle = 'rgba(255,255,255,0.18)'; Y.lineWidth = 3; const p = new Path2D(rr(240, 420, 600, 400, 56)); Y.fill(p); Y.stroke(p); Y.restore();
      drawIcon(Y, BUS, 540, 600, 1.0, ease(u, 0.1, 1.0, 'cubicOut'), 13);
      const a1 = ease(u, 0.8, 1.4), a2 = ease(u, 1.3, 1.9), a3 = ease(u, 1.8, 2.4);
      ctx.text(Y, 'الباص', 540, 1030 + 30 * (1 - a1), { family: 'display', weight: 900, size: 120, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.text(Y, 'يقف عند: ' + ph(bus.stop, 'موقف الباص'), 540, 1160 + 24 * (1 - a2), { family: 'body', weight: 700, size: 52, color: P.ink, alpha: a2, maxWidth: 800 });
      ctx.text(Y, 'وينزل عند: ' + ph(bus.dropoff, 'محطة النزول'), 540, 1250 + 24 * (1 - a3), { family: 'body', weight: 700, size: 52, color: P.acc, alpha: a3, maxWidth: 800 });
    };

    /* ── اسأل قبل ما تحجز ── */
    const ask = (Y, u) => {
      bg(Y);
      const a1 = ease(u, 0.1, 0.7), a2 = ease(u, 0.7, 1.3), a3 = ease(u, 1.2, 1.8);
      ctx.text(Y, 'قبل ما تحجز', 540, 760 + 30 * (1 - a1), { family: 'body', weight: 700, size: 64, color: P.mut, alpha: a1 });
      ctx.text(Y, 'اسأل: كم دقيقة مشي', 540, 930 + 40 * (1 - a2), { family: 'display', weight: 900, size: 112, color: P.ink, alpha: a2, maxWidth: 820 });
      ctx.text(Y, 'إلى أي باب؟', 540, 1060 + 30 * (1 - a3), { family: 'display', weight: 900, size: 112, color: P.acc, alpha: a3, maxWidth: 820 });
      ctx.drawPath(Y, [[330, 1105], [540, 1115], [750, 1102]], ease(u, 1.6, 2.2, 'cubicInOut'), { width: 10, color: P.acc });
    };

    /* ── ختام ── */
    const outro = (Y, u) => {
      bg(Y);
      const k = ease(u, 0.2, 1.0, 'cubicOut');
      if (ctx.img('logo')) { const im = ctx.img('logo'), w = 520, h = w * im.height / im.width; Y.save(); Y.globalAlpha = k; Y.drawImage(im, 540 - w / 2, 330 + 30 * (1 - k), w, h); Y.restore(); }
      const a1 = ease(u, 1.1, 1.7), a2 = ease(u, 1.7, 2.3);
      const cta = cfg.cta === 'inbox' ? 'للحجز المؤكد: راسلنا على الخاص' : 'للحجز المؤكد: واتساب';
      ctx.text(Y, cta, 540, 1260 + 30 * (1 - a1), { family: 'display', weight: 900, size: 62, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.drawPath(Y, [[330, 1310], [540, 1318], [750, 1308]], ease(u, 1.5, 2.1, 'cubicInOut'), { width: 10, color: P.acc });
      ctx.text(Y, '@osusalmosafer', 540, 1410 + 20 * (1 - a2), { family: 'body', weight: 700, size: 50, color: P.acc, alpha: a2, dir: 'ltr', maxWidth: 800 });
    };

    const fn = { hook, walk, result, bus: busScene, ask, outro };
    const clock = i => segs[i].s - (i > 0 ? T_TR : 0);
    const drawSeg = (Y, i) => fn[segs[i].n](Y, t - clock(i));
    let idx = 0; segs.forEach((s, i) => { if (t >= s.s) idx = i; });
    const nx = idx + 1, tr0 = nx < segs.length ? segs[nx].s - T_TR : Infinity;
    if (t >= tr0) FX.softWipe(ctx, t, { s: tr0, dur: T_TR, band: 240, A: Y => drawSeg(Y, idx), B: Y => drawSeg(Y, nx) });
    else drawSeg(X, idx);
    ctx.__end = T_END;
  },
});
