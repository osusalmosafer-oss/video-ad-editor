const FP = (window.__FP = window.__FP || {});
FP.bg = function (ctx, t) {
  const { X, W, H } = ctx; const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050D0B'); g.addColorStop(1, '#10241D'); X.fillStyle = g; X.fillRect(0, 0, W, H);
  X.save(); X.translate(540, 700); for (let q = 0; q < 3; q++) { X.rotate(t * .03 * (q % 2 ? -1 : 1) + q * .5); X.strokeStyle = 'rgba(217,178,91,.07)'; X.lineWidth = 2; X.strokeRect(-460 - q * 60, -460 - q * 60, 920 + q * 120, 920 + q * 120); } X.restore();
};
FP.wave = function (ctx, t, cx, cy, R, amp, lt, envAt) {
  const X = ctx.X, N = 96;
  for (let i = 0; i < N; i++) {
    const a = i / N * 6.2832 - Math.PI / 2, ph = (i % 24) / 24;
    const e = envAt ? envAt(ph * .35) : amp * (.6 + .4 * Math.sin(lt * 4 + i));
    const h = 14 + e * 120 * (.55 + .45 * Math.abs(Math.sin(i * 1.7 + 1)));
    X.strokeStyle = 'rgba(217,178,91,' + (.35 + .6 * Math.min(1, e)) + ')'; X.lineWidth = 7; X.lineCap = 'round';
    X.beginPath(); X.moveTo(cx + Math.cos(a) * (R + 26), cy + Math.sin(a) * (R + 26)); X.lineTo(cx + Math.cos(a) * (R + 26 + h), cy + Math.sin(a) * (R + 26 + h)); X.stroke();
  }
};
window.NG_text = (ctx, s, x, y, lt, t0) => { const k = ctx.at(lt, t0, t0 + .8, 'expoOut'); ctx.text(ctx.X, s, x, y + (1 - k) * 50, { family: 'display', size: 130, color: '#F4EFE3', align: 'center', alpha: k, maxWidth: 940, shadow: { blur: 40, y: 0, color: 'rgba(217,178,91,.4)' } }); };
window.NG_text2 = (ctx, s, x, y, lt, t0) => { const k = ctx.at(lt, t0, t0 + .8, 'expoOut'); ctx.text(ctx.X, s, x, y + (1 - k) * 40, { family: 'display', size: 90, color: '#D9B25B', align: 'center', alpha: k, maxWidth: 940 }); };
FP.clip = function (ctx, t, lt, C) {
  const { X, at } = ctx; FP.bg(ctx, t);
  const ct = lt - C.lead, playing = ct >= 0 && ct <= C.dur;
  const envAt = (off) => { const u = Math.max(0, Math.min(C.env.length - 1.001, (ct - off) * 50)); const i = Math.floor(u), f = u - i; return playing || ct - off > 0 && ct - off < C.dur ? C.env[i] * (1 - f) + C.env[i + 1] * f : 0; };
  const e0 = envAt(0), cx = 540, cy = 700, R = 230 * (1 + .025 * e0) * (.9 + .1 * at(lt, 0, .8, 'backOut'));
  const k0 = at(lt, 0, .7, 'expoOut');
  ctx.text(X, 'فتوى مسموعة', 540, 250, { family: 'display', size: 84, color: '#D9B25B', align: 'center', alpha: k0 });
  FP.wave(ctx, t, cx, cy, R, 0, lt, playing ? envAt : () => 0);
  X.save(); X.beginPath(); X.arc(cx, cy, R, 0, 6.2832); X.clip();
  const img = C.photo && ctx.img(C.photo);
  if (img) { const z = 1 + .06 * at(lt, 0, C.lead + C.dur, 'linear'), s = (R * 2 * z) / Math.min(img.width, img.height); X.drawImage(img, cx - img.width * s / 2, cy - img.height * s / 2, img.width * s, img.height * s); }
  else { X.fillStyle = '#183A2F'; X.fillRect(cx - R, cy - R, R * 2, R * 2); X.fillStyle = '#2E6B58'; X.beginPath(); X.arc(cx, cy - 50, 80, 0, 6.2832); X.fill(); X.beginPath(); X.ellipse(cx, cy + 190, 150, 130, 0, 0, 6.2832); X.fill(); }
  X.restore(); X.strokeStyle = '#D9B25B'; X.lineWidth = 8; X.beginPath(); X.arc(cx, cy, R + 4, 0, 6.2832); X.stroke();
  // play-tap interaction (0 → lead)
  const pa = 1 - at(lt, C.lead - .35, C.lead, 'cubicIn');
  if (pa > 0) {
    X.save(); X.globalAlpha = pa; X.fillStyle = 'rgba(0,0,0,.45)'; X.beginPath(); X.arc(cx, cy, R, 0, 6.2832); X.fill();
    const tap = at(lt, .55, .75, 'cubicOut'), sc = 1 - .12 * Math.sin(tap * 3.1416);
    X.translate(cx, cy); X.scale(sc, sc); X.fillStyle = '#F4EFE3'; X.beginPath(); X.moveTo(-34, -52); X.lineTo(60, 0); X.lineTo(-34, 52); X.closePath(); X.fill(); X.restore();
    const rp = at(lt, .6, 1.1, 'cubicOut'); X.save(); X.globalAlpha = pa * (1 - rp) * (lt > .6 ? 1 : 0); X.strokeStyle = '#D9B25B'; X.lineWidth = 6; X.beginPath(); X.arc(cx, cy, 60 + rp * 140, 0, 6.2832); X.stroke(); X.restore();
    const cur = at(lt, 0, .6, 'expoOut'); X.save(); X.globalAlpha = pa * cur; X.fillStyle = 'rgba(255,255,255,.85)'; X.beginPath(); X.arc(cx + 150 - cur * 130 + (lt > .6 ? 0 : 0), cy + 220 - cur * 200, 26 - 6 * Math.sin(tap * 3.1416), 0, 6.2832); X.fill(); X.restore();
  }
  // name
  const kn = at(lt, .3, 1.1, 'expoOut');
  ctx.text(X, C.name, 540, 1060 + (1 - kn) * 40, { family: 'display', size: 74, color: '#F4EFE3', align: 'center', alpha: kn, maxWidth: 960 });
  if (C.role) ctx.text(X, C.role, 540, 1128, { family: 'body', weight: 400, size: 38, color: '#8FA79B', align: 'center', alpha: kn, maxWidth: 940 });
  // caption lines, word-by-word highlight
  let li = -1; C.lines.forEach((l, i) => { if (ct >= l.t) li = i; });
  if (li >= 0 && ct <= C.dur + .6) {
    const l = C.lines[li], end = li + 1 < C.lines.length ? C.lines[li + 1].t : C.dur, span = Math.max(.4, end - l.t - .15);
    const L = ctx.text.layout(X, l.text, { family: 'body', weight: 700, size: 58, maxWidth: 900, lineHeight: 1.6 }), n = L.words ? L.words.length : l.text.split(/\s+/).length;
    const ap = at(ct, l.t, l.t + .3, 'cubicOut');
    ctx.text.drawLayout(X, L, 540, 1210 + (1 - ap) * 24, { align: 'center', color: '#F4EFE3', perWord: (i) => {
      const w0 = l.t + span * i / n, w1 = l.t + span * (i + 1) / n, cur = ct >= w0 && ct < w1, past = ct >= w1;
      return { alpha: ap * (past || cur ? 1 : .38), color: cur ? '#F3DDA0' : '#F4EFE3', scale: cur ? 1.08 : 1, shadow: cur ? { blur: 30, y: 0, color: 'rgba(217,178,91,.8)' } : undefined };
    } });
  }
  // player bar
  const bx0 = 150, bx1 = 930, by = 1530, p = Math.max(0, Math.min(1, ct / C.dur)), kb = at(lt, .5, 1.2, 'cubicOut');
  X.globalAlpha = kb; X.fillStyle = 'rgba(255,255,255,.18)'; X.fillRect(bx0, by - 3, bx1 - bx0, 6);
  X.fillStyle = '#D9B25B'; X.fillRect(bx0, by - 3, (bx1 - bx0) * p, 6); X.beginPath(); X.arc(bx0 + (bx1 - bx0) * p, by, 13, 0, 6.2832); X.fill();
  const f = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  ctx.text(X, f(Math.max(0, Math.min(C.dur, ct))), bx0 + 40, by + 52, { family: 'num', weight: 400, size: 30, color: '#8FA79B', align: 'center', dir: 'ltr' });
  ctx.text(X, f(C.dur), bx1 - 40, by + 52, { family: 'num', weight: 400, size: 30, color: '#8FA79B', align: 'center', dir: 'ltr' }); X.globalAlpha = 1;
  if (C.source) { const ks = at(ct, C.dur - .2, C.dur + .6, 'cubicOut'); ctx.text(X, C.source, 540, 1400, { family: 'body', weight: 400, size: 36, color: '#8FA79B', align: 'center', alpha: ks, maxWidth: 940 }); }
};
