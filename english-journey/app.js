(() => {
'use strict';
const KEY = 'ej_v1';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => fmt(new Date());
const addDays = (ds, n) => { const [y, m, d] = ds.split('-').map(Number); return fmt(new Date(y, m - 1, d + n)); };
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const shuffle = (a, r = Math.random) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const whyH = t => esc(t).split('\n').map(l => `<div dir="auto">${l}</div>`).join('');
const isEn = s => /^[\x20-\x7E]+$/.test(s) && /[a-z]/i.test(s);

/* ---------- state ---------- */
const def = () => ({ xp: 0, streak: 0, best: 0, last: null, log: {}, mist: {}, seen: {}, stamps: {}, pron: {}, custom: [], day: {}, badges: {}, cleared: 0, maxCombo: 0, set: { rate: 0.9, sound: true } });
let S;
try { S = Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || '{}')); S.set = Object.assign(def().set, S.set); } catch (e) { S = def(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

/* ---------- content ---------- */
let U = [], Q = {}, W = [], FACTS = [];
function build() {
  U = [...CONTENT.units, ...S.custom];
  Q = {}; W = []; FACTS = [...CONTENT.facts];
  U.forEach(u => (u.words || []).forEach(w => W.push({ ...w, unit: u.id })));
  U.forEach(u => {
    (u.facts || []).forEach(f => FACTS.push({ unit: u.id, ar: f.ar || f }));
    (u.questions || []).forEach((q, i) => {
      const id = `${u.id}:q${i}`;
      Q[id] = { id, unit: u.id, type: q.listen ? 'listen' : 'mc', q: q.q, hint: q.hint || '', say: q.say, c: q.c, a: q.c[0], why: q.why || '' };
    });
    const ws = u.words || [];
    if (ws.length < 3) return;
    const pool = ws.length >= 4 ? ws : W;
    ws.forEach(w => {
      const r = rng(hash(u.id + w.en));
      const pick = key => shuffle(pool.filter(x => x[key] !== w[key]), r).slice(0, 3).map(x => x[key]);
      Q[`${u.id}:m:${w.en}`] = { id: `${u.id}:m:${w.en}`, unit: u.id, type: 'mean', q: w.en, big: 1, ipa: w.ipa, hint: w.num ? 'كم يساوي هذا الرقم؟' : 'ما معنى هذه الكلمة؟', say: w.en, c: [w.ar, ...pick('ar')], a: w.ar, why: `${w.en} = ${w.ar}` + (w.ex ? `\n${w.ex}` : '') };
      Q[`${u.id}:l:${w.en}`] = { id: `${u.id}:l:${w.en}`, unit: u.id, type: 'listen', q: '🔊 اسمع واختر الكلمة', hint: 'اضغط على السماعة', say: w.en, c: [w.en, ...pick('en')], a: w.en, why: `${w.en} = ${w.ar}${w.ipa ? '\n' + w.ipa : ''}` };
    });
  });
}
const unitOf = id => U.find(u => u.id === id) || { title: id, icon: '📘', titleAr: id };
const qs = () => Object.values(Q);

/* ---------- audio / fx ---------- */
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  voice = v.find(x => /^en[-_]US/i.test(x.lang) && /google|natural|samantha|aria|jenny/i.test(x.name)) || v.find(x => /^en[-_]US/i.test(x.lang)) || v.find(x => /^en/i.test(x.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(t, slow) {
  if (!('speechSynthesis' in window)) return toast('متصفحك لا يدعم النطق الصوتي');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'en-US'; if (voice) u.voice = voice;
  u.rate = slow ? 0.5 : S.set.rate;
  speechSynthesis.speak(u);
}
let ac;
function beep(ok) {
  if (!S.set.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.connect(g); g.connect(ac.destination);
    o.type = ok ? 'sine' : 'triangle';
    o.frequency.setValueAtTime(ok ? 660 : 220, t);
    if (ok) o.frequency.setValueAtTime(880, t + .12);
    g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .28);
    o.start(t); o.stop(t + .3);
  } catch (e) {}
  try { navigator.vibrate && navigator.vibrate(ok ? 15 : [40, 30, 40]); } catch (e) {}
}
function burst(n = 14) {
  const em = ['🎉', '✨', '⭐', '✈️', '🧳', '🌍'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'fx'; s.textContent = em[i % em.length];
    s.style.left = (30 + Math.random() * 40) + 'vw'; s.style.top = '55vh';
    s.style.setProperty('--dx', (Math.random() * 240 - 120) + 'px'); s.style.setProperty('--rot', (Math.random() * 360) + 'deg');
    document.body.appendChild(s); setTimeout(() => s.remove(), 1200);
  }
}
let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- progress ---------- */
const curStreak = () => (S.last === today() || S.last === addDays(today(), -1)) ? S.streak : 0;
const LV = [['سائح جديد', '🧍'], ['مسافر', '🎒'], ['مستكشف', '🧭'], ['مرشد مبتدئ', '🚩'], ['مرشد سياحي', '🏛️'], ['سفير الضيافة', '🏆']];
const level = () => { const l = Math.floor(S.xp / 120) + 1; const t = LV[Math.min(l - 1, LV.length - 1)]; return { l, name: t[0], ico: t[1], cur: S.xp % 120, need: 120 }; };
const BADGES = [
  ['first', '🌱', 'أول إجابة', () => qs().some(q => S.seen[q.id])],
  ['x100', '💯', '100 نقطة خبرة', () => S.xp >= 100],
  ['s3', '🔥', '3 أيام متتالية', () => S.best >= 3],
  ['s7', '🌋', '7 أيام متتالية', () => S.best >= 7],
  ['c10', '⚡', 'سلسلة 10 إجابات صحيحة', () => S.maxCombo >= 10],
  ['fix5', '🛠️', 'أصلحت 5 أخطاء نهائيًا', () => S.cleared >= 5],
  ['st3', '🛂', '3 أختام في الجواز', () => Object.keys(S.stamps).length >= 3],
  ['st8', '🌐', 'جواز مكتمل (كل الوحدات)', () => U.length > 0 && U.every(u => S.stamps[u.id])],
  ['pr', '🎤', 'نطق ناجح بالميكروفون', () => (S.pronOk || 0) >= 1]
];
function checkBadges() { BADGES.forEach(([k, i, n, f]) => { if (!S.badges[k] && f()) { S.badges[k] = today(); toast(`${i} شارة جديدة: ${n}`); burst(10); } }); save(); }
function gain(n) {
  const t = today(); S.xp += n; S.log[t] = (S.log[t] || 0) + n;
  if (S.last !== t) { S.streak = S.last === addDays(t, -1) ? S.streak + 1 : 1; S.last = t; S.best = Math.max(S.best, S.streak); }
  save();
}
function record(q, ok) {
  const t = today(), s = S.seen[q.id] || (S.seen[q.id] = { ok: 0, bad: 0 });
  if (ok) {
    s.ok++; const m = S.mist[q.id];
    if (m) { m.box++; if (m.box > 4) { delete S.mist[q.id]; S.cleared++; } else m.due = addDays(t, [0, 1, 3, 7, 14][m.box]); }
  } else {
    s.bad++; const m = S.mist[q.id] || (S.mist[q.id] = { n: 0, box: 0, due: t, unit: q.unit });
    m.n++; m.box = 0; m.due = t; m.last = t;
  }
  save();
}
const dueList = () => Object.keys(S.mist).filter(id => Q[id] && S.mist[id].due <= today());
const accOf = id => { const a = qs().filter(q => q.unit === id && S.seen[q.id]); const ok = a.reduce((x, q) => x + S.seen[q.id].ok, 0), bad = a.reduce((x, q) => x + S.seen[q.id].bad, 0); return ok + bad ? Math.round(ok * 100 / (ok + bad)) : null; };

/* ---------- daily picks (stored so they stay stable all day) ---------- */
function daily() {
  const t = today(), d = S.day[t] || (S.day = { [t]: {} })[t];
  const manual = qs().filter(q => q.type === 'mc' || q.type === 'listen');
  if (!d.q || !Q[d.q]) d.q = manual[hash(t + 'q') % manual.length].id;
  if (!d.w || !W.find(w => w.en === d.w)) d.w = W[hash(t + 'w') % W.length].en;
  if (d.f == null || !FACTS[d.f]) d.f = hash(t + 'f') % FACTS.length;
  S.day = { [t]: d }; save();
  return d;
}

/* ---------- sessions ---------- */
let view = 'home', tab = 'home', sess = null, filt = 'all', search = '';
function pickQs(pool, n) {
  const due = pool.filter(q => S.mist[q.id] && S.mist[q.id].due <= today());
  const fresh = pool.filter(q => !S.seen[q.id] && !due.includes(q));
  const rest = pool.filter(q => !due.includes(q) && !fresh.includes(q));
  return shuffle([...shuffle(due).slice(0, 2), ...shuffle(fresh), ...shuffle(rest)].slice(0, n).filter(Boolean));
}
function start(o) { if (!o.qs.length) return toast('لا توجد أسئلة هنا بعد'); sess = { ...o, i: 0, ok: 0, combo: 0, best: 0, xp: 0, ans: null, ch: null }; view = 'quiz'; render(); }
function curQ() { const q = Q[sess.qs[sess.i]]; if (!sess.ch) sess.ch = shuffle(q.c); return q; }
function answer(i) {
  if (sess.ans) return;
  const q = curQ(), pick = sess.ch[i], ok = pick === q.a;
  sess.ans = { pick, ok };
  let x = 0;
  if (ok) { sess.ok++; sess.combo++; sess.best = Math.max(sess.best, sess.combo); x = 10 + (sess.combo >= 3 ? Math.min(sess.combo, 6) : 0) + (sess.mode === 'review' ? 5 : 0); if (sess.mode === 'daily') x += 20; }
  else sess.combo = 0;
  S.maxCombo = Math.max(S.maxCombo, sess.best);
  sess.xp += x; if (x) gain(x);
  record(q, ok);
  if (sess.mode === 'daily') S.day[today()].res = ok ? 1 : 0;
  beep(ok); if (ok) burst(sess.combo >= 3 ? 12 : 5);
  render();
  const sp = q.say || (isEn(q.a) ? q.a : null);
  if (ok && sp && q.type !== 'listen') setTimeout(() => say(sp), 250);
  checkBadges();
}
function next() {
  sess.i++; sess.ans = null; sess.ch = null;
  if (sess.i >= sess.qs.length) {
    const pct = Math.round(sess.ok * 100 / sess.qs.length);
    sess.pct = pct;
    if (sess.unit && sess.mode === 'unit' && pct >= 80) S.stamps[sess.unit] = Math.max(S.stamps[sess.unit] || 0, pct);
    save(); view = 'summary'; if (pct >= 80) burst(24); checkBadges();
  }
  render();
}

/* ---------- views ---------- */
const NAV = [['home', '🏠', 'اليوم'], ['practice', '🎯', 'تدرّب'], ['words', '🔊', 'كلمات'], ['mist', '🛠️', 'أخطائي'], ['me', '🛂', 'رحلتي']];
function renderNav() {
  const n = $('#nav'); n.className = view === 'quiz' || view === 'summary' ? 'hide' : '';
  const d = dueList().length;
  n.innerHTML = NAV.map(([k, i, t]) => `<button data-a="tab" data-k="${k}" class="${tab === k ? 'on' : ''}" aria-label="${t}"><b>${i}</b>${t}${k === 'mist' && d ? `<span class="dot">${d}</span>` : ''}</button>`).join('');
}
const spk = (t, slow) => `<button class="ico" data-a="say" data-t="${esc(t)}" ${slow ? 'data-s="1"' : ''} aria-label="${slow ? 'نطق بطيء' : 'استمع'}">${slow ? '🐢' : '🔊'}</button>`;
function wordCard(w, mic = true) {
  return `<div class="card"><div class="row"><div class="sp"><div class="big en">${esc(w.en)}</div>${w.ipa ? `<div class="ipa en">${esc(w.ipa)}</div>` : ''}<div>${esc(w.ar)}</div>${w.ex ? `<div class="mute en" style="margin-top:4px">“${esc(w.ex)}”</div>` : ''}</div>
  <div style="display:flex;flex-direction:column;gap:8px">${spk(w.en)}${spk(w.en, 1)}${mic ? `<button class="ico" data-a="mic" data-t="${esc(w.en)}" aria-label="اختبر نطقك">🎤</button>` : ''}</div></div><div class="mute" id="mic-${hash(w.en)}"></div></div>`;
}
function vHome() {
  const L = level(), d = daily(), q = Q[d.q], w = W.find(x => x.en === d.w), f = FACTS[d.f], due = dueList().length, st = curStreak();
  const done = d.res != null;
  return `<div class="card hero"><div class="row"><div class="sp"><div class="sub">أهلًا بك في رحلتك</div><h1>${L.ico} ${L.name} · مستوى ${L.l}</h1></div><span class="pill">🔥 ${st}</span></div>
  <div class="bar" style="margin-top:12px"><i style="width:${L.cur * 100 / L.need}%"></i></div><div class="sub" style="margin-top:6px">${L.cur} / ${L.need} نقطة للمستوى التالي · إجمالي ${S.xp} XP</div></div>
  <h2>❓ سؤال اليوم</h2>
  <div class="card"><span class="tag">${esc(unitOf(q.unit).titleAr)}</span><div class="q en" style="display:block;direction:ltr;font-size:1.2rem">${esc(q.type === 'listen' ? 'Listen & choose' : q.q)}</div>
  ${done ? `<div class="fb ${d.res ? 'ok' : 'bad'}">${d.res ? '✅ أجبت صح اليوم! +20 مكافأة' : '❌ أخطأت اليوم — الإجابة: '}${d.res ? '' : `<bdi>${esc(q.a)}</bdi>`}<div class="mute">${whyH(q.why)}</div></div>` : `<button class="btn" data-a="daily">أجب الآن (+20 مكافأة)</button>`}</div>
  <h2>💡 معلومة اليوم</h2><div class="card"><span class="tag">${esc(unitOf(f.unit).titleAr)}</span><p style="margin:8px 0 0">${esc(f.ar)}</p></div>
  <h2>🗣️ كلمة اليوم</h2>${wordCard(w)}
  ${due ? `<div class="card" style="border-color:var(--acc)"><div class="row"><div class="sp"><b>🛠️ عندك ${due} ${due === 1 ? 'خطأ' : 'أخطاء'} جاهزة للمراجعة</b><div class="mute">المراجعة المتباعدة تثبّتها في ذاكرتك</div></div><button class="btn sm warn" data-a="review">راجع</button></div></div>` : ''}
  <button class="btn" data-a="quick" style="margin-top:6px">⚡ جولة سريعة (6 أسئلة)</button>
  <h2>📈 آخر 7 أيام</h2><div class="card"><div class="week">${weekBars()}</div></div>`;
}
function weekBars() {
  const days = [...Array(7)].map((_, i) => addDays(today(), i - 6)), max = Math.max(30, ...days.map(d => S.log[d] || 0));
  return days.map(d => { const v = S.log[d] || 0; return `<div><i style="height:${Math.max(3, v * 60 / max)}px"></i>${new Date(d).toLocaleDateString('ar', { weekday: 'narrow' })}</div>`; }).join('');
}
function vPractice() {
  return `<h2 style="margin-top:4px">🎯 اختر وحدة</h2>` + U.map(u => {
    const all = qs().filter(q => q.unit === u.id), seen = all.filter(q => S.seen[q.id]).length, a = accOf(u.id), stp = S.stamps[u.id];
    return `<div class="card unit" data-a="unit" data-k="${u.id}"><div class="e">${u.icon}</div><div class="sp"><b class="en">${esc(u.title)}</b><div class="mute">${esc(u.titleAr)} · ${u.src === 'slides' ? 'من الشرائح' : u.src === 'book' ? 'من الكتاب' : 'إضافة'}</div>
    <div class="bar" style="margin-top:6px"><i style="width:${all.length ? seen * 100 / all.length : 0}%"></i></div><div class="mute">${seen}/${all.length} سؤال${a != null ? ` · دقة ${a}%` : ''}</div></div>${stp ? `<span class="pill" style="background:var(--acc);color:#2a1100">🛂 ${stp}%</span>` : ''}</div>`;
  }).join('') + `<h2>🎲 تحديات</h2><div class="grid2"><button class="btn ghost" data-a="mix">🎲 مختلط 10</button><button class="btn ghost" data-a="ear">👂 تدريب الأذن</button></div>`;
}
function wordList() {
  const s = search.trim().toLowerCase();
  const l = W.filter(w => (filt === 'all' || w.unit === filt) && (!s || w.en.toLowerCase().includes(s) || w.ar.includes(s)));
  return l.length ? l.map(w => wordCard(w)).join('') : '<div class="card mute">لا نتائج</div>';
}
function vWords() {
  return `<h2 style="margin-top:4px">🔊 قاموسي الصوتي</h2><input type="search" id="q" placeholder="ابحث بالإنجليزية أو العربية" value="${esc(search)}">
  <div class="chips"><button class="chip ${filt === 'all' ? 'on' : ''}" data-a="filt" data-k="all">الكل (${W.length})</button>${U.filter(u => (u.words || []).length).map(u => `<button class="chip ${filt === u.id ? 'on' : ''}" data-a="filt" data-k="${u.id}">${u.icon} ${esc(u.titleAr)}</button>`).join('')}</div>
  <div id="wlist">${wordList()}</div>`;
}
function vMist() {
  const ids = Object.keys(S.mist).filter(id => Q[id]), due = dueList().length;
  const byU = {}; ids.forEach(id => { byU[Q[id].unit] = (byU[Q[id].unit] || 0) + S.mist[id].n; });
  const mx = Math.max(1, ...Object.values(byU));
  const pr = Object.entries(S.pron).filter(([, n]) => n > 0);
  return `<h2 style="margin-top:4px">🛠️ دفتر أخطائي</h2>
  <div class="card"><div class="row"><div class="sp"><b>${ids.length} خطأ نشط · ${due} مستحق الآن</b><div class="mute">أخطاؤك تعود للمراجعة بعد: يوم ← 3 أيام ← أسبوع ← أسبوعين، ثم تُمسح.</div></div></div>
  ${ids.length ? `<button class="btn warn" style="margin-top:10px" data-a="review">${due ? `راجع المستحق (${due})` : 'راجع الكل الآن'}</button>` : '<div class="mute" style="margin-top:8px">لا أخطاء حاليًا 🎉 ابدأ تدريبًا!</div>'}</div>
  ${ids.length ? `<h2>أضعف المواضيع</h2><div class="card bars">${Object.entries(byU).sort((a, b) => b[1] - a[1]).map(([u, n]) => `<div class="b"><span>${unitOf(u).icon} ${esc(unitOf(u).titleAr)}</span><i style="width:${n * 40 / mx}%"></i><span>${n}</span></div>`).join('')}</div>
  <h2>التفاصيل</h2>${ids.sort((a, b) => S.mist[b].n - S.mist[a].n).map(id => { const q = Q[id], m = S.mist[id]; return `<div class="card"><div class="row"><span class="tag">${esc(unitOf(q.unit).titleAr)}</span><span class="sp"></span><span class="mute">أخطأت ${m.n}×</span></div><div class="en" style="display:block;direction:ltr;font-weight:700;margin:6px 0">${esc(q.type === 'listen' ? '🔊 ' + (q.say || '') : q.q)}</div><div>✅ <bdi>${esc(q.a)}</bdi></div><div class="mute">${whyH(q.why)}</div>${(q.say || isEn(q.a)) ? `<div style="margin-top:8px">${spk(q.say || q.a)}</div>` : ''}</div>`; }).join('')}` : ''}
  ${pr.length ? `<h2>🎤 نطق يحتاج تدريب</h2><div class="card">${pr.sort((a, b) => b[1] - a[1]).map(([w, n]) => `<div class="row"><b class="en sp">${esc(w)}</b><span class="mute">${n}×</span>${spk(w)}${spk(w, 1)}</div>`).join('')}</div>` : ''}`;
}
function vMe() {
  const L = level(), b = BADGES;
  return `<h2 style="margin-top:4px">🛂 جواز سفري</h2><div class="card"><div class="grid2" style="grid-template-columns:repeat(3,1fr)">${U.map(u => `<div class="stamp ${S.stamps[u.id] ? 'on' : ''}"><div>${u.icon}<small>${esc(u.titleAr)}</small>${S.stamps[u.id] ? `<small>${S.stamps[u.id]}%</small>` : ''}</div></div>`).join('')}</div><div class="mute" style="margin-top:10px">اختم كل وحدة بتحصيل 80%+ في جولة الوحدة.</div></div>
  <div class="card"><div class="row"><div class="sp"><b>${L.ico} ${L.name}</b><div class="mute">${S.xp} XP · أفضل سلسلة أيام: ${S.best} 🔥</div></div></div></div>
  <h2>🏅 الشارات</h2><div class="card">${b.map(([k, i, n]) => `<div class="badge ${S.badges[k] ? '' : 'off'}"><span style="font-size:1.5rem">${i}</span><span>${n}</span></div>`).join('')}</div>
  <h2>⚙️ الإعدادات</h2><div class="card"><label>سرعة النطق: <b id="rv">${S.set.rate}</b></label><input type="range" id="rate" min="0.5" max="1.2" step="0.1" value="${S.set.rate}">
  <div class="row" style="margin-top:12px"><span class="sp">الأصوات والاهتزاز</span><button class="btn sm ghost" data-a="snd">${S.set.sound ? 'مفعّل ✅' : 'مغلق'}</button></div></div>
  <h2>➕ أضف فصلًا من الكتاب</h2><div class="card"><div class="mute">الصق وحدة جديدة بصيغة JSON (يمكنني أن أجهّزها لك من صور الكتاب).</div><textarea id="imp" placeholder='{"id":"unit1","icon":"📘","title":"Unit 1","titleAr":"الوحدة 1","words":[{"en":"hello","ar":"مرحبا"}],"questions":[{"q":"hello = ?","c":["مرحبا","وداعا"],"why":"hello = مرحبا"}]}'></textarea>
  <div class="grid2" style="margin-top:8px"><button class="btn" data-a="import">إضافة</button><button class="btn ghost" data-a="tpl">نسخ قالب</button></div></div>
  <h2>💾 نسخة احتياطية</h2><div class="card"><div class="grid2"><button class="btn ghost" data-a="exp">تصدير</button><button class="btn ghost" data-a="imptoggle">استيراد</button></div><input type="file" id="bk" accept="application/json" hidden>
  <button class="btn sm warn" style="margin-top:12px" data-a="reset">مسح كل التقدم</button><div class="mute" style="margin-top:10px">بياناتك محفوظة على جوالك فقط. للتثبيت: قائمة المتصفح ← «إضافة إلى الشاشة الرئيسية».</div></div>`;
}
function vQuiz() {
  const q = curQ(), a = sess.ans, pct = sess.i * 100 / sess.qs.length;
  const sp = q.say || (isEn(q.a) ? q.a : null);
  return `<div class="quiz-top"><button class="ico" data-a="exit" aria-label="خروج">✕</button><div class="bar"><i style="width:${pct}%"></i></div><span class="pill" style="background:var(--soft);color:var(--pri)">🔥 ${sess.combo}</span></div>
  <div class="card ${a && !a.ok ? 'shake' : ''}"><div class="row"><span class="tag">${esc(sess.title || '')}</span><span class="sp"></span><span class="mute">${sess.i + 1}/${sess.qs.length}</span></div>
  ${q.type === 'listen' ? `<div class="q"><div class="row" style="justify-content:center">${spk(q.say)}${spk(q.say, 1)}</div><div style="margin-top:10px;font-size:1.1rem">${esc(q.q)}</div></div>` : `<div class="q en" style="display:block;direction:ltr">${esc(q.q)}${q.ipa ? `<div class="ipa" style="font-size:1rem;font-weight:400">${esc(q.ipa)}</div>` : ''}${q.type === 'mean' ? `<div style="margin-top:8px">${spk(q.say)}</div>` : ''}</div>`}
  ${q.hint ? `<div class="hint">${esc(q.hint)}</div>` : ''}
  <div style="margin-top:10px">${sess.ch.map((c, i) => `<button class="ch ${a ? (c === q.a ? 'ok' : c === a.pick ? 'bad' : '') : ''}" dir="auto" data-a="ans" data-i="${i}" ${a ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>
  ${a ? `<div class="fb ${a.ok ? 'ok' : 'bad'}"><b>${a.ok ? '🎉 صحيح!' : '❌ ليست صحيحة'}</b>${a.ok ? '' : ` الجواب: <bdi>${esc(q.a)}</bdi>`}<div style="margin-top:4px">${whyH(q.why)}</div>${sp ? `<div style="margin-top:8px">${spk(sp)}${spk(sp, 1)}</div>` : ''}</div><button class="btn" data-a="next">${sess.i + 1 >= sess.qs.length ? 'النتيجة' : 'التالي'}</button>` : ''}</div>`;
}
function vSummary() {
  const p = sess.pct, msg = p >= 80 ? '🏆 ممتاز! تستحق ختمًا' : p >= 50 ? '👍 جيد — راجع أخطاءك' : '💪 لا بأس، المراجعة ستثبّت المعلومة';
  return `<div class="card hero" style="text-align:center"><div style="font-size:3rem">${p >= 80 ? '🛂' : '🎒'}</div><h1>${msg}</h1><p>${sess.ok} من ${sess.qs.length} · +${sess.xp} XP · أفضل سلسلة ${sess.best}</p></div>
  ${sess.mode === 'unit' && p >= 80 ? '<div class="card">✅ حصلت على ختم الوحدة في جواز سفرك.</div>' : sess.mode === 'unit' ? '<div class="card mute">اجمع 80%+ لتحصل على الختم.</div>' : ''}
  <div class="grid2"><button class="btn" data-a="again">جولة أخرى</button><button class="btn ghost" data-a="home">الرئيسية</button></div>
  ${Object.keys(S.mist).length ? '<button class="btn ghost" style="margin-top:10px" data-a="gomist">🛠️ دفتر أخطائي</button>' : ''}`;
}
function render() {
  const el = $('#app');
  el.innerHTML = view === 'quiz' ? vQuiz() : view === 'summary' ? vSummary() : ({ home: vHome, practice: vPractice, words: vWords, mist: vMist, me: vMe }[tab])();
  renderNav();
  if (view === 'quiz' && !sess.ans && curQ().type === 'listen' && sess.spoken !== sess.i) { sess.spoken = sess.i; const t = curQ().say; setTimeout(() => view === 'quiz' && say(t), 300); }
  const rt = $('#rate'); if (rt) rt.oninput = () => { S.set.rate = +rt.value; $('#rv').textContent = rt.value; save(); };
  const sq = $('#q'); if (sq) sq.oninput = () => { search = sq.value; $('#wlist').innerHTML = wordList(); };
  const bk = $('#bk'); if (bk) bk.onchange = () => { const f = bk.files[0]; if (!f) return; f.text().then(t => { try { S = Object.assign(def(), JSON.parse(t)); S.set = Object.assign(def().set, S.set); save(); build(); render(); toast('تم الاستيراد ✅'); } catch (e) { toast('الملف غير صالح'); } }); };
  window.scrollTo(0, 0);
}

/* ---------- mic ---------- */
function mic(word, btn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, out = $('#mic-' + hash(word));
  if (!SR) { out.textContent = 'ميزة الميكروفون غير مدعومة في هذا المتصفح (جرّب Chrome).'; return; }
  const r = new SR(); r.lang = 'en-US'; r.maxAlternatives = 5;
  out.textContent = '🎙️ تكلّم الآن…';
  r.onresult = e => {
    const heard = [...e.results[0]].map(x => x.transcript.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim());
    const ok = heard.includes(word.toLowerCase().replace(/[^a-z0-9 ]/g, ''));
    if (ok) { out.innerHTML = '✅ نطق ممتاز!'; beep(true); burst(6); S.pronOk = (S.pronOk || 0) + 1; if (S.pron[word]) S.pron[word] = Math.max(0, S.pron[word] - 1); gain(3); checkBadges(); }
    else { out.innerHTML = `❌ سمعتُ: <bdi>${esc(heard[0] || '—')}</bdi> — اسمعها وأعد المحاولة`; beep(false); S.pron[word] = (S.pron[word] || 0) + 1; save(); }
  };
  r.onerror = e => { out.textContent = e.error === 'not-allowed' ? 'اسمح للمتصفح باستخدام الميكروفون.' : 'لم أسمعك، حاول مجددًا.'; };
  try { r.start(); } catch (e) {}
}

/* ---------- actions ---------- */
const A = {
  tab: d => { tab = d.k; view = tab; render(); },
  say: d => say(d.t, d.s),
  mic: d => mic(d.t),
  filt: d => { filt = d.k; render(); },
  daily: () => { const q = daily().q; start({ qs: [q], mode: 'daily', title: 'سؤال اليوم' }); },
  quick: () => start({ qs: pickQs(qs(), 6).map(q => q.id), mode: 'quick', title: 'جولة سريعة' }),
  mix: () => start({ qs: pickQs(qs(), 10).map(q => q.id), mode: 'mix', title: 'مختلط' }),
  ear: () => start({ qs: pickQs(qs().filter(q => q.type === 'listen'), 8).map(q => q.id), mode: 'mix', title: 'تدريب الأذن' }),
  unit: d => { const u = unitOf(d.k); start({ qs: pickQs(qs().filter(q => q.unit === d.k), 8).map(q => q.id), mode: 'unit', unit: d.k, title: u.titleAr }); },
  review: () => { let l = dueList(); if (!l.length) l = Object.keys(S.mist).filter(id => Q[id]); start({ qs: shuffle(l).slice(0, 10), mode: 'review', title: 'مراجعة الأخطاء' }); },
  ans: d => answer(+d.i),
  next: () => next(),
  exit: () => { if (confirm('الخروج من الجولة؟')) { view = tab; sess = null; render(); } },
  again: () => { const o = sess; const f = { unit: A.unit, quick: A.quick, mix: A.mix, review: A.review, daily: A.quick }[o.mode]; f({ k: o.unit }); },
  home: () => { view = tab = 'home'; render(); },
  gomist: () => { view = tab = 'mist'; render(); },
  snd: () => { S.set.sound = !S.set.sound; save(); render(); },
  exp: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = `english-journey-${today()}.json`; a.click(); },
  imptoggle: () => $('#bk').click(),
  tpl: () => { const t = JSON.stringify({ id: 'unit1', icon: '📘', title: 'Unit 1', titleAr: 'الوحدة 1', words: [{ en: 'hello', ar: 'مرحبا', ipa: '/həˈləʊ/', ex: 'Hello, welcome!' }], questions: [{ q: 'hello = ?', hint: 'ما معناها؟', c: ['مرحبا', 'وداعا'], why: 'hello = مرحبا' }], facts: [{ ar: 'معلومة من الفصل' }] }, null, 1); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('تم نسخ القالب'), () => { $('#imp').value = t; toast('وُضع القالب في المربع'); }); },
  import: () => {
    try {
      const u = JSON.parse($('#imp').value);
      if (!u.id || !u.title || ![...(u.words || []), ...(u.questions || [])].length) throw 0;
      if (U.some(x => x.id === u.id)) { toast('المعرّف id مستخدم، غيّره'); return; }
      if ((u.questions || []).some(q => !q.q || !Array.isArray(q.c) || q.c.length < 2)) { toast('كل سؤال يحتاج q و c (خياران على الأقل)'); return; }
      u.src = 'book'; u.icon = u.icon || '📘'; u.titleAr = u.titleAr || u.title; S.custom.push(u); save(); build(); render(); toast('أُضيفت الوحدة ✅');
    } catch (e) { toast('JSON غير صالح'); }
  },
  reset: () => { if (confirm('سيُمسح كل تقدمك. متأكد؟')) { S = def(); save(); build(); view = tab = 'home'; render(); } }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && A[b.dataset.a]) { A[b.dataset.a](b.dataset); } });

build(); render(); checkBadges();
if ('serviceWorker' in navigator && /^https:|localhost/.test(location.protocol + location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
