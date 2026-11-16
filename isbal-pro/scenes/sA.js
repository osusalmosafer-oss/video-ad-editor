/* sA — «انتبه» ثابتة + كلمة تتبدّل ← دخول من نقطة ← عدسة تركيز + مطّ كشيدة ← كلمات تطيح. ويعرّف أدوات مشتركة (window.ISB) */
const W = 1080, H = 1920;
const ISB = window.ISB = {};
const sm = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };

ISB.bg = (ctx, t, o = {}) => {
  const { X, P } = ctx;
  const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1220'); g.addColorStop(0.55, P.bg); g.addColorStop(1, '#020306');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  X.save(); X.globalCompositeOperation = 'screen';
  [[150, 0.10, 0.9], [420, 0.07, 1.3], [-120, 0.05, 0.7]].forEach(([bx, a, sp], i) => {
    const x0 = bx + Math.sin(t * 0.25 * sp + i * 2) * 60;
    const lg = X.createLinearGradient(x0, 0, x0 + 520, 1500); lg.addColorStop(0, `rgba(233,210,160,${a * (o.light == null ? 1 : o.light)})`); lg.addColorStop(1, 'rgba(233,210,160,0)');
    X.fillStyle = lg; X.beginPath(); X.moveTo(x0 - 40, -20); X.lineTo(x0 + 120, -20); X.lineTo(x0 + 900, 1700); X.lineTo(x0 + 380, 1700); X.closePath(); X.fill();
  });
  X.restore();
  if (!ISB._dust) { const r = ctx.seeded(11); ISB._dust = Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * H, s: r.range(0.6, 2.8), v: r.range(10, 38), ph: r() * 6.28, dx: r.range(-12, 12) })); }
  X.save(); ISB._dust.forEach(d => {
    const y = ((d.y - t * d.v) % H + H) % H, x = d.x + Math.sin(t * 0.4 + d.ph) * 22 + d.dx * Math.sin(t * 0.1);
    X.globalAlpha = (0.12 + 0.28 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.ph))) * (o.dust == null ? 1 : o.dust); X.fillStyle = P.hi; X.beginPath(); X.arc(x, y, d.s, 0, 6.2832); X.fill();
  }); X.restore();
};
ISB.hud = (ctx, t, a0, n, label) => {
  const { X, P, at } = ctx, k = at(t, a0 + 0.05, a0 + 0.7, 'expoOut');
  X.save(); X.globalAlpha = 0.9 * k; X.strokeStyle = 'rgba(244,239,228,0.22)'; X.lineWidth = 2; X.beginPath(); X.moveTo(80, 210); X.lineTo(80 + 920 * k, 210); X.stroke();
  ctx.text(X, '0' + n + ' / 05', 80, 190, { family: 'num', weight: 500, size: 28, color: P.acc, align: 'left', dir: 'ltr', letterSpacing: 4 });
  ctx.text(X, label, 1000, 190, { family: 'body', weight: 700, size: 30, color: P.mut, align: 'right' }); X.restore();
};
ISB.line = (ctx, t, id, o) => {
  const sp = ctx.lineSpan(id), fade = 1 - ctx.at(t, sp.e - 0.05, sp.e + 0.2, 'cubicIn');
  if (fade <= 0.01 || t < sp.s - 0.1) return;
  ctx.X.save(); ctx.X.globalAlpha = fade; ctx.FX.scrollReveal(ctx, t, Object.assign({ line: id }, o)); ctx.X.restore();
};
ISB.fog = (ctx) => { const { X } = ctx, g = X.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(5,7,13,1)'); g.addColorStop(0.55, 'rgba(5,7,13,0.96)'); g.addColorStop(1, 'rgba(5,7,13,0)'); X.fillStyle = g; X.fillRect(0, 0, 1080, 760); };


// قدم واقعية: جسم مُشكَّل بمقاطع عرضية (عقب ← قوس ← مقدّمة) + 5 أصابع بأظافر
ISB.foot = (THREE, skin, nailMat, inner) => {
  const g = new THREE.Group(), FY = -0.72;
  const PZ = [-0.48, -0.3, 0, 0.35, 0.7, 1.0, 1.18], PW = [0.2, 0.28, 0.335, 0.35, 0.37, 0.36, 0.33], PH = [0.22, 0.44, 0.56, 0.48, 0.34, 0.25, 0.19];
  const itp = (A, z) => { let i = 0; while (i < PZ.length - 2 && z > PZ[i + 1]) i++; const k = Math.min(1, Math.max(0, (z - PZ[i]) / (PZ[i + 1] - PZ[i]))), e = k * k * (3 - 2 * k); return A[i] + (A[i + 1] - A[i]) * e; };
  const NZ = 44, NA = 36, pos = [], idx = [], zmin = PZ[0], zmax = PZ[PZ.length - 1];
  for (let i = 0; i <= NZ; i++) {
    const z = zmin + (zmax - zmin) * i / NZ, e0 = Math.min(1, Math.sqrt(Math.max(0, (z - zmin) / 0.16))), e1 = Math.min(1, Math.sqrt(Math.max(0, (zmax - z) / 0.1)));
    const cap = Math.min(e0, e1), w = itp(PW, z) * cap, h = itp(PH, z) * Math.max(0.3, cap), lift = 0.07 * Math.sin(Math.PI * Math.min(1, Math.max(0, (z + 0.1) / 0.9))), yc = FY + lift * 0.5 + h / 2;
    for (let j = 0; j < NA; j++) { const a = j / NA * 6.2832, c = Math.cos(a), sn = Math.sin(a), n = 2.7;
      const x = w * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y = sn > 0 ? yc + (h / 2) * Math.pow(sn, 2 / n) : yc - (h / 2 - lift * 0.5) * Math.pow(-sn, 2 / n);
      pos.push(x, y, z); }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = (i + 1) * NA + j, d = (i + 1) * NA + (j + 1) % NA; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, skin));
  // الأصابع: الإبهام جهة الداخل
  const sph = new THREE.SphereGeometry(1, 28, 20), W = [0.115, 0.085, 0.078, 0.07, 0.06].map(v => v * 0.88), LEN = [0.36, 0.38, 0.33, 0.29, 0.24], HT = [0.15, 0.12, 0.11, 0.1, 0.085];
  let x = inner * (0.36 - W[0]);
  for (let i = 0; i < 5; i++) {
    const t = new THREE.Mesh(sph, skin), zc = 1.05 + LEN[i] * 0.5 - (i ? 0.03 * i : 0);
    t.position.set(x, FY + HT[i] * 0.5 + 0.02, zc); t.scale.set(W[i], HT[i] * 0.55, LEN[i] * 0.55); t.rotation.x = -0.05 - (i === 0 ? 0.05 : 0); g.add(t);
    const n = new THREE.Mesh(sph, nailMat); n.position.set(x, FY + HT[i] * 0.98 + 0.012, zc + LEN[i] * 0.28); n.scale.set(W[i] * 0.62, 0.012, LEN[i] * 0.2); n.rotation.x = 0.18; g.add(n);
    if (i < 4) x -= inner * (W[i] + W[i + 1] + 0.012);
  }
  return g;
};

// عالم ثلاثي الأبعاد: رجلين حقيقيتين بكعبين + ثوب بيضاوي يتموج + حلقة الكعبين
ISB.world = (ctx) => {
  const { THREE, P } = ctx, w = {};
  w.st = ctx.stage3D({ fov: 24, camera: [0, 1.1, 25], env: 'room', tone: 'neutral', exposure: 1.0 });
  const st = w.st;
  const key = new THREE.DirectionalLight(0xffdca8, 2.6); key.position.set(4, 7, 6); st.add(key);
  const rim = new THREE.DirectionalLight(0x7fa8ff, 1.6); rim.position.set(-6, 3, -5); st.add(rim);
  const skin = new THREE.MeshPhysicalMaterial({ color: '#a87858', roughness: 0.55, envMapIntensity: 0.3, sheen: 0.45, sheenColor: new THREE.Color('#d9a584'), sheenRoughness: 0.5, clearcoat: 0.08, clearcoatRoughness: 0.6 });
  const nail = new THREE.MeshPhysicalMaterial({ color: '#e9cbb8', roughness: 0.25, clearcoat: 0.6 });
  const bone = new THREE.MeshPhysicalMaterial({ color: '#a87858', roughness: 0.55, envMapIntensity: 0.4 });
  const prof = [[0, -0.34], [0.18, -0.3], [0.26, -0.2], [0.285, -0.08], [0.295, 0.0], [0.3, 0.45], [0.36, 1.2], [0.45, 2.2], [0.53, 3.3], [0.5, 4.5], [0.47, 5.5], [0.5, 7.2], [0, 7.2]].map(([r, y]) => new THREE.Vector2(r, y));
  const legG = new THREE.LatheGeometry(prof, 56), sph = new THREE.SphereGeometry(1, 32, 24);
  const mk = (geo, mat, p, s) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.scale.set(...s); return m; };
  [-0.82, 0.82].forEach(cx => {
    const g = new THREE.Group(); g.position.x = cx; const inner = -Math.sign(cx);
    g.add(new THREE.Mesh(legG, skin));
    g.add(mk(sph, bone, [inner * 0.27, 0.26, 0.0], [0.07, 0.13, 0.12]));          // الكعب الداخلي (أعلى)
    g.add(mk(sph, bone, [-inner * 0.275, 0.12, -0.03], [0.065, 0.11, 0.11]));       // الكعب الخارجي (أوطى)
    g.add(ISB.foot(THREE, skin, nail, inner));
    st.add(g);
  });
  w.floor = st.add(new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshBasicMaterial({ color: '#05080f' })));
  w.floor.rotation.x = -Math.PI / 2; w.floor.position.y = -0.75;
  const HH = 7, geo = new THREE.CylinderGeometry(0.93, 1.0, HH, 72, 70, true);
  w.base = Float32Array.from(geo.attributes.position.array); w.H = HH;
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3)); w.geo = geo;
  w.thobe = st.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.4, side: THREE.DoubleSide, envMapIntensity: 0.7 })));
  w.thobe.scale.x = 1.75;
  w.ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(P.acc) });
  w.ring = st.add(new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.022, 12, 160), w.ringMat)); w.ring.rotation.x = Math.PI / 2; w.ring.scale.set(1.95, 1, 1);
  w.ring2 = st.add(new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.01, 8, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.acc), transparent: true, opacity: 0.45 }))); w.ring2.rotation.x = Math.PI / 2; w.ring2.scale.set(1.75, 1, 1);
  w.disc = st.add(new THREE.Mesh(new THREE.CircleGeometry(1.55, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.acc), transparent: true, opacity: 0.07, side: THREE.DoubleSide }))); w.disc.rotation.x = Math.PI / 2; w.disc.scale.set(1.75, 1, 1);
  w.white = new THREE.Color('#f2eee5'); w.red = new THREE.Color(P.red); w.tmp = new THREE.Color();
  w.update = (t, hem, o = {}) => {
    const pos = w.geo.attributes.position, col = w.geo.attributes.color, b = w.base, n = pos.count;
    for (let i = 0; i < n; i++) {
      const x = b[i * 3], by = b[i * 3 + 1], z = b[i * 3 + 2], u = (by + HH / 2) / HH, ang = Math.atan2(x, z), r0 = Math.hypot(x, z);
      const near = 1 - sm(0, 0.2, u), amp = 0.055 * near, r = r0 * (1 + amp * Math.sin(ang * 6 + t * 2.1) + 0.014 * Math.sin(ang * 11 - t * 0.7) + 0.02 * near * Math.sin(ang * 3 + t * 1.2));
      pos.setXYZ(i, r * Math.sin(ang), by + 0.06 * near * Math.sin(ang * 5 + t * 1.7), r * Math.cos(ang));
      const wy = hem + u * HH, bad = (o.crimson == null ? 1 : o.crimson) * sm(0.04, -0.2, wy), shade = 0.82 + 0.18 * Math.cos(ang * 2 - 0.6);
      w.tmp.copy(w.white).lerp(w.red, bad * 0.9).multiplyScalar(shade); col.setXYZ(i, w.tmp.r, w.tmp.g, w.tmp.b);
    }
    pos.needsUpdate = true; col.needsUpdate = true; w.geo.computeVertexNormals();
    w.thobe.position.y = hem + HH / 2;
    const pulse = 1 + 0.03 * ctx.beatPulse(t, 7, 1); w.ring.scale.set(1.95 * pulse, 1, pulse);
    w.ring2.rotation.z = t * 0.25; w.ringMat.color.set(o.ringColor || ctx.P.acc);
  };
  w.project = (x, y, z) => { const v = new THREE.Vector3(x, y, z); st.camera.updateMatrixWorld(); v.project(st.camera); return [(v.x * 0.5 + 0.5) * 1080, (-v.y * 0.5 + 0.5) * 1920]; };
  w.BONE = [1.08, 0.12, 0];    // كعب الرجل اليمنى الخارجي
  return w;
};

MOTION.scene({
  id: 'sA',
  setup(ctx) { this.w = ISB.world(ctx); },
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx, red = P.red, w = this.w;
    const l2 = ctx.lineSpan('l2'), l3 = ctx.lineSpan('l3'), lastW = ctx.wordTime('l1', -1).s;
    const dotS = l2.s - 0.7, dotD = 0.7;

    // ── الجزء 1: «انتبه» ثابتة + الكلمة تتبدّل
    const partA = () => {
      ISB.bg(ctx, t, { light: 0.6 }); ISB.hud(ctx, t, 0, 1, 'تنبيه');
      const k = at(lt, 0.0, 0.5, 'cubicOut');
      ctx.text(X, 'انتبه', 540, 820, { family: 'kufi', weight: 900, size: 380, color: P.ink, align: 'center', alpha: k });
      X.save(); X.strokeStyle = red; X.lineWidth = 4; X.globalAlpha = k; X.beginPath(); X.moveTo(240, 880); X.lineTo(840, 880); X.stroke(); X.restore();
      const a = at(t, ctx.wordTime('l1', 1).s - 0.1, ctx.wordTime('l1', 1).s + 0.4, 'cubicOut');
      X.save(); X.globalAlpha = a; FX.wordSwap(ctx, t, { lead: 'قد تكون في خطر وأنت لا', words: ['تدري', 'تنتبه', 'تشعر'], s: lastW - 1.1, every: 0.55, y: 1130, size: 84, pill: red }); X.restore();
    };

    // ── الجزء 2: العالم 3D + عدسة تركيز + كشيدة، ثم كلمات تطيح
    const partB = () => {
      ISB.bg(ctx, t, { light: 0.8 });
      const wd = ctx.wordTime('l2', 2), drop = at(t, wd.s - 0.1, wd.e + 0.5, 'cubicInOut'), hem = 1.7 - 2.3 * drop;
      w.update(t, hem, {});
      w.st.orbit(0.28 + 0.1 * Math.sin(t * 0.35), 0.1, 25 - 1.2 * at(t, l2.s, l2.s + 5, 'sineInOut'), [0, 1.1, 0]);
      w.st.draw(X); ISB.fog(ctx);
      ISB.hud(ctx, t, l2.s, 2, 'التعريف');
      const [bx, by] = w.project(...w.BONE), k = at(t, l2.s + 0.5, l2.s + 1.3, 'cubicOut');
      ctx.drawPath(X, [[bx, by], [bx + 70, by - 80], [960, by - 80]], k, { width: 3, color: P.acc, cap: 'round', smooth: false, tip: { r: 7, color: P.acc } });
      X.save(); X.globalAlpha = k; X.strokeStyle = P.acc; X.lineWidth = 3; X.beginPath(); X.arc(bx, by, 28 + 6 * ctx.beatPulse(t, 6, 1), 0, 6.2832); X.stroke();
      ctx.text(X, 'الكعبان', 960, by - 100, { family: 'body', weight: 700, size: 40, color: P.acc, align: 'right' }); X.restore();
      const ak = at(t, wd.e + 0.4, wd.e + 1.0, 'cubicOut');
      if (ak > 0.01) { const [lx, ly] = w.project(-2.3, hem + 0.2, 0);
        ctx.drawPath(X, [[lx, ly], [lx - 40, ly + 60], [110, ly + 60]], ak, { width: 3, color: red, cap: 'round', smooth: false, tip: { r: 7, color: red } });
        X.save(); X.globalAlpha = ak; ctx.text(X, 'ما أسفل الكعبين', 110, ly + 36, { family: 'body', weight: 700, size: 38, color: red, align: 'left' }); X.restore(); }
      // عدسة تركيز على الجملة + مطّ الكعبين
      const fade = 1 - at(t, l2.e - 0.05, l2.e + 0.2, 'cubicIn');
      if (fade > 0.01 && t > l2.s - 0.3) {
        const w0 = ctx.wordTime('l2', 0).s, w5 = ctx.wordTime('l2', 5).s, dwell = Math.max(0.5, (w5 - w0) / 2);
        X.save(); X.globalAlpha = fade;
        FX.focus(ctx, t, { text: l2.text, s: w0, seq: [0, 3, 5], dwell, y: 360, size: 80 });
        FX.kashida(ctx, t, { text: 'الكعبين', s: w5 - 0.15, hold: 0.15, y: 1440, size: 150, w: 760, color: P.acc, underline: false });
        X.restore();
      }
      // كلمات تطيح
      if (t > l3.s - 0.1) FX.wordDrop(ctx, t, { text: l3.text, s: l3.s, y: 360, size: 82, maxWidth: 900, stagger: 0.36, accent: [4] });
    };

    FX.dotZoom(ctx, t, { s: dotS, dur: dotD, A: partA, B: partB, dot: [540, 880], r: 20, color: red });
  }
});
