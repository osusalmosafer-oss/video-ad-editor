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

const CLIP = {"name": "اسم الشيخ — رحمه الله", "role": "نموذج تجريبي — ضع اسم الشيخ وصفته", "source": "المصدر: اسم المادة ورابطها", "dur": 14.0, "lead": 1.1, "env": [0.049, 0.265, 0.556, 0.809, 0.774, 0.6, 0.254, 0.043, 0.099, 0.366, 0.771, 0.98, 0.924, 0.64, 0.23, 0.032, 0.156, 0.52, 0.938, 0.991, 0.945, 0.562, 0.195, 0.023, 0.214, 0.661, 1.031, 1.047, 0.895, 0.469, 0.157, 0.039, 0.288, 0.777, 1.035, 1.08, 0.806, 0.417, 0.101, 0.056, 0.369, 0.803, 1.007, 0.978, 0.656, 0.34, 0.057, 0.087, 0.412, 0.751, 1.035, 0.927, 0.607, 0.243, 0.026, 0.113, 0.402, 0.684, 0.845, 0.692, 0.45, 0.148, 0.013, 0.127, 0.348, 0.582, 0.645, 0.504, 0.291, 0.077, 0.014, 0.121, 0.288, 0.452, 0.438, 0.353, 0.169, 0.041, 0.019, 0.098, 0.237, 0.323, 0.311, 0.226, 0.095, 0.021, 0.021, 0.093, 0.198, 0.243, 0.246, 0.157, 0.065, 0.01, 0.025, 0.105, 0.196, 0.245, 0.236, 0.144, 0.06, 0.006, 0.045, 0.155, 0.251, 0.327, 0.282, 0.173, 0.059, 0.006, 0.086, 0.237, 0.386, 0.459, 0.355, 0.217, 0.056, 0.019, 0.157, 0.357, 0.567, 0.6, 0.457, 0.244, 0.048, 0.046, 0.25, 0.519, 0.77, 0.721, 0.562, 0.239, 0.041, 0.092, 0.343, 0.721, 0.928, 0.859, 0.588, 0.212, 0.03, 0.149, 0.481, 0.886, 0.993, 0.932, 0.554, 0.187, 0.022, 0.199, 0.612, 0.976, 1.042, 0.893, 0.476, 0.153, 0.037, 0.279, 0.738, 0.977, 0.944, 0.718, 0.37, 0.095, 0.052, 0.348, 0.761, 0.973, 1.008, 0.678, 0.343, 0.055, 0.084, 0.397, 0.71, 0.966, 0.883, 0.577, 0.238, 0.026, 0.112, 0.386, 0.677, 0.823, 0.678, 0.439, 0.143, 0.013, 0.127, 0.334, 0.568, 0.62, 0.494, 0.286, 0.075, 0.013, 0.119, 0.289, 0.449, 0.433, 0.353, 0.171, 0.04, 0.019, 0.098, 0.233, 0.32, 0.307, 0.225, 0.096, 0.021, 0.021, 0.093, 0.196, 0.241, 0.246, 0.159, 0.067, 0.01, 0.026, 0.106, 0.2, 0.249, 0.241, 0.146, 0.061, 0.006, 0.045, 0.157, 0.259, 0.331, 0.289, 0.177, 0.06, 0.007, 0.087, 0.246, 0.395, 0.473, 0.365, 0.226, 0.059, 0.02, 0.161, 0.361, 0.592, 0.623, 0.478, 0.249, 0.048, 0.049, 0.26, 0.543, 0.784, 0.759, 0.58, 0.251, 0.041, 0.097, 0.355, 0.761, 0.969, 0.884, 0.618, 0.223, 0.031, 0.153, 0.496, 0.927, 0.97, 0.897, 0.546, 0.188, 0.023, 0.207, 0.65, 0.997, 1.007, 0.862, 0.459, 0.154, 0.038, 0.287, 0.757, 1.029, 1.0, 0.738, 0.385, 0.097, 0.053, 0.361, 0.786, 1.012, 1.004, 0.674, 0.34, 0.057, 0.084, 0.404, 0.732, 1.008, 0.915, 0.593, 0.239, 0.026, 0.112, 0.396, 0.674, 0.836, 0.681, 0.452, 0.149, 0.013, 0.127, 0.341, 0.585, 0.642, 0.511, 0.286, 0.078, 0.014, 0.121, 0.291, 0.446, 0.437, 0.354, 0.171, 0.041, 0.019, 0.099, 0.235, 0.321, 0.311, 0.227, 0.098, 0.021, 0.021, 0.094, 0.197, 0.243, 0.248, 0.161, 0.067, 0.01, 0.025, 0.108, 0.199, 0.251, 0.244, 0.147, 0.062, 0.006, 0.044, 0.155, 0.26, 0.334, 0.294, 0.177, 0.06, 0.007, 0.089, 0.249, 0.396, 0.471, 0.369, 0.223, 0.06, 0.02, 0.162, 0.368, 0.588, 0.626, 0.485, 0.255, 0.05, 0.049, 0.261, 0.555, 0.807, 0.754, 0.59, 0.249, 0.042, 0.099, 0.36, 0.751, 0.966, 0.906, 0.627, 0.23, 0.032, 0.162, 0.509, 0.939, 1.009, 0.942, 0.565, 0.192, 0.024, 0.209, 0.653, 1.009, 0.989, 0.848, 0.465, 0.152, 0.039, 0.285, 0.757, 1.017, 1.071, 0.814, 0.419, 0.105, 0.056, 0.364, 0.79, 1.066, 1.093, 0.722, 0.365, 0.06, 0.088, 0.408, 0.738, 1.019, 0.911, 0.607, 0.241, 0.025, 0.114, 0.398, 0.676, 0.845, 0.686, 0.451, 0.147, 0.014, 0.128, 0.342, 0.589, 0.639, 0.509, 0.289, 0.079, 0.013, 0.122, 0.294, 0.442, 0.437, 0.357, 0.171, 0.04, 0.019, 0.101, 0.239, 0.323, 0.312, 0.229, 0.096, 0.021, 0.022, 0.094, 0.201, 0.243, 0.25, 0.161, 0.066, 0.01, 0.026, 0.108, 0.203, 0.25, 0.241, 0.148, 0.062, 0.006, 0.046, 0.157, 0.258, 0.339, 0.289, 0.177, 0.06, 0.007, 0.088, 0.25, 0.395, 0.475, 0.372, 0.227, 0.06, 0.02, 0.167, 0.364, 0.597, 0.628, 0.486, 0.253, 0.051, 0.047, 0.263, 0.55, 0.806, 0.757, 0.591, 0.251, 0.042, 0.101, 0.369, 0.781, 0.982, 0.92, 0.626, 0.23, 0.032, 0.158, 0.516, 0.937, 1.026, 1.005, 0.587, 0.198, 0.024, 0.215, 0.659, 1.045, 1.074, 0.914, 0.492, 0.161, 0.038, 0.291, 0.766, 0.984, 1.078, 0.821, 0.417, 0.099, 0.057, 0.371, 0.791, 1.077, 1.039, 0.705, 0.347, 0.058, 0.087, 0.415, 0.736, 1.013, 0.914, 0.598, 0.244, 0.026, 0.114, 0.4, 0.693, 0.863, 0.683, 0.453, 0.146, 0.013, 0.131, 0.346, 0.581, 0.633, 0.506, 0.29, 0.077, 0.014, 0.12, 0.291, 0.446, 0.434, 0.356, 0.169, 0.04, 0.019, 0.099, 0.238, 0.32, 0.311, 0.226, 0.095, 0.021, 0.021, 0.093, 0.197, 0.243, 0.241, 0.16, 0.066, 0.01, 0.025, 0.106, 0.2, 0.247, 0.239, 0.146, 0.062, 0.006, 0.045, 0.158, 0.256, 0.336, 0.29, 0.177, 0.06, 0.007, 0.089, 0.246, 0.397, 0.475, 0.375, 0.227, 0.059, 0.02, 0.164, 0.368, 0.59, 0.633, 0.481, 0.256, 0.05, 0.049, 0.266, 0.556, 0.815, 0.784, 0.602, 0.254, 0.043, 0.102, 0.367, 0.772, 0.991, 0.922, 0.633, 0.232, 0.032, 0.161, 0.525, 0.949, 1.035, 0.945, 0.568, 0.194, 0.024, 0.217, 0.677, 1.029, 0.991, 0.86, 0.458, 0.152, 0.039, 0.29, 0.781, 1.016, 1.089, 0.814, 0.418, 0.101, 0.055, 0.361, 0.804, 1.063, 1.032, 0.698, 0.348, 0.057, 0.087, 0.42, 0.751, 1.027, 0.928, 0.597, 0.248, 0.026, 0.115, 0.399, 0.692, 0.857, 0.691, 0.451, 0.148, 0.013, 0.131, 0.34, 0.588, 0.641, 0.508, 0.293, 0.079, 0.014, 0.12, 0.289, 0.438, 0.435], "lines": [{"t": 0.0, "text": "هنا السطر الأول من نص الفتوى كما نُطق"}, {"t": 4.6, "text": "هنا السطر الثاني من نص الفتوى"}, {"t": 9.2, "text": "وهنا السطر الثالث والأخير"}], "photo": "p_c1"};
MOTION.scene({ id: 'c1', draw(t, lt, ctx) { FP.clip(ctx, t, lt, CLIP); } });
