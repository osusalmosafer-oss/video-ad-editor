'use strict';
/* ============ تفريغ + ترجمة + دبلجة (نماذج تعمل داخل المتصفح عبر transformers.js) ============ */
// [رمز, الاسم, Whisper, NLLB, MMS-TTS (null = غير متاح)]
const LANGS = [
  ['ar', 'العربية', 'arabic', 'arb_Arab', 'ara'], ['en', 'English', 'english', 'eng_Latn', 'eng'], ['fr', 'Français', 'french', 'fra_Latn', 'fra'],
  ['es', 'Español', 'spanish', 'spa_Latn', 'spa'], ['de', 'Deutsch', 'german', 'deu_Latn', 'deu'], ['ru', 'Русский', 'russian', 'rus_Cyrl', 'rus'],
  ['tr', 'Türkçe', 'turkish', 'tur_Latn', null], ['hi', 'हिन्दी', 'hindi', 'hin_Deva', 'hin'], ['ko', '한국어', 'korean', 'kor_Hang', 'kor'],
  ['pt', 'Português', 'portuguese', 'por_Latn', 'por'], ['it', 'Italiano', 'italian', 'ita_Latn', null], ['ur', 'اردو', 'urdu', 'urd_Arab', null],
  ['fa', 'فارسی', 'persian', 'pes_Arab', null], ['zh', '中文', 'chinese', 'zho_Hans', null], ['ja', '日本語', 'japanese', 'jpn_Jpan', null],
];
const LG = c => LANGS.find(l => l[0] === c);
const aiSt = t => { const e = $('#aiSt'); if (e){ e.style.color = 'var(--acc2)'; e.textContent = t; } };
const aiErr = err => { const e = $('#aiSt'); if (e){ e.style.color = 'var(--red)'; e.textContent = 'تعذّر التنفيذ: ' + (err && err.message || err) + ' — تأكد من اتصال الإنترنت لتنزيل النموذج أول مرة.'; } };

async function tf(){
  if (window.__tf) return window.__tf;
  const m = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'); m.env.allowLocalModels = false; window.__tf = m; return m;
}
const PIPES = {};
async function getPipe(task, model, st, label){
  const key = task + '|' + model; if (PIPES[key]) return PIPES[key];
  const {pipeline} = await tf();
  return PIPES[key] = await pipeline(task, model, {progress_callback:p => { if (p.status === 'progress') (st || aiSt)(`${label || 'تنزيل النموذج'}… ${Math.round(p.progress)}%`); }});
}

/* ---- تفريغ ---- */
async function transcribeClip(c, m, {lang, model, task, st}){
  st = st || aiSt;
  st('تحميل نموذج التفريغ…');
  const asr = await getPipe('automatic-speech-recognition', 'Xenova/whisper-' + model, st, 'تنزيل نموذج التفريغ');
  st('تحضير الصوت…'); ensureAudio();
  const buf = await actx.decodeAudioData(await (await fetch(m.url)).arrayBuffer()), sp = c.p.speed || 1;
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * 16000)), 16000), src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
  const data = (await off.startRendering()).getChannelData(0).slice(Math.floor(c.in * 16000), Math.floor((c.in + c.dur * sp) * 16000));
  st('جارٍ التفريغ… قد يستغرق دقائق');
  const out = await asr(data, {language:lang || null, task:task || 'transcribe', chunk_length_s:30, stride_length_s:5, return_timestamps:true});
  const segs = [];
  for (const ch of out.chunks || []){
    const [s, e] = ch.timestamp, text = (ch.text || '').trim(); if (!text) continue;
    segs.push({text, start:c.start + s / sp, dur:Math.max(.4, ((e ?? s + 2.5) - s) / sp)});
  }
  return segs;
}
function addSegments(segs, karaoke, label){
  const tr = gfxTrack(0);
  for (const s of segs) mk('text', tr, s.start, s.dur, {text:s.text, size:6.5, bg:true, strokeW:0, fadeIn:0, fadeOut:0, y:72, ...(karaoke ? {hl:'karaoke'} : {})});
  commit(); return segs.length;
}

/* ---- ترجمة ---- */
const textClips = () => S.clips.filter(c => c.type === 'text' && !c.p.counter && c.p.text.trim()).sort((a, b) => a.start - b.start);
function scopeClips(v){
  if (v === '__sel'){ const c = selClip(); return c && c.type === 'text' ? [c] : []; }
  return textClips().filter(c => c.track === v);
}
async function translateClips(clips, from, to, mode, st){
  st = st || aiSt; if (!clips.length) throw new Error('لا توجد نصوص للترجمة — اختر مساراً فيه نصوص');
  if (from === to) throw new Error('اللغة المصدر والهدف متطابقتان');
  const pipe = await getPipe('translation', 'Xenova/nllb-200-distilled-600M', st, 'تنزيل نموذج الترجمة (≈600MB لمرة واحدة)');
  let tr = null;
  if (mode === 'copy'){ addTrack('gfx', true); const t = TRACKS[0]; t.label = 'ترجمة ' + LG(to)[1]; tr = t.id; }
  const made = [];
  for (let i = 0; i < clips.length; i++){
    st(`ترجمة ${i + 1} / ${clips.length}…`);
    const c = clips[i], out = await pipe(c.p.text.replace(/\s*\n\s*/g, ' '), {src_lang:LG(from)[3], tgt_lang:LG(to)[3], max_length:400});
    const text = (Array.isArray(out) ? out[0] : out).translation_text;
    if (mode === 'copy'){ const n = JSON.parse(JSON.stringify(c)); n.id = 'c' + uid++; n.track = tr; n.p.text = text; n.p.y = Math.min(94, (n.p.y || 72) + 9); n.p.size = Math.max(3, (n.p.size || 6.5) * .85); S.clips.push(n); made.push(n); }
    else c.p.text = text;
  }
  commit(); return clips.length;
}

/* ---- دبلجة ---- */
function wavBlob(f32, sr){
  const n = f32.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, clamp(f32[i], -1, 1) * 32767, true);
  return new Blob([buf], {type:'audio/wav'});
}
function ensureDubTrack(label){
  let t = TRACKS.find(x => x.kind === 'audio' && x.label === label); if (t) return t.id;
  addTrack('audio', true); t = TRACKS[TRACKS.length - 1]; t.label = label; return t.id;
}
async function dubClips(clips, lang, origVol, st){
  st = st || aiSt; const L = LG(lang); if (!L || !L[4]) throw new Error('لا يتوفر صوت دبلجة لهذه اللغة');
  if (!clips.length) throw new Error('لا توجد نصوص للدبلجة — اختر مساراً فيه نصوص');
  const tts = await getPipe('text-to-speech', 'Xenova/mms-tts-' + L[4], st, 'تنزيل نموذج الصوت');
  const tr = ensureDubTrack('دبلجة ' + L[1]); let made = 0;
  if (origVol < 100) for (const c of S.clips) if ((c.type === 'video' || c.type === 'audio') && !(c.track === tr)) c.p.volume = Math.min(c.p.volume ?? 100, origVol);
  for (let i = 0; i < clips.length; i++){
    st(`توليد الصوت ${i + 1} / ${clips.length}…`);
    const c = clips[i], out = await tts(c.p.text.replace(/\s*\n\s*/g, ' ')), sr = out.sampling_rate, dA = out.audio.length / sr;
    const m = {id:'m' + uid++, name:`دبلجة ${LG(lang)[1]} ${i + 1}.wav`, type:'audio', url:URL.createObjectURL(wavBlob(out.audio, sr)), dur:dA, thumb:null, w:0, h:0};
    S.media.push(m); computePeaks(m);
    const speed = dA > c.dur ? Math.min(1.6, dA / c.dur) : 1, a = mk('audio', tr, c.start, dA / speed); a.mediaId = m.id; a.p.speed = speed; made++;
  }
  syncEls(); renderMedia(); commit(); return made;
}
function previewVoice(lang, text){
  if (!('speechSynthesis' in window)) return alert('المتصفح لا يدعم الاستماع السريع');
  const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : lang; speechSynthesis.cancel(); speechSynthesis.speak(u);
}

/* ---- الخط الكامل ---- */
async function fullDub(c, m, src, dst, tts, origVol, model){
  const segs = await transcribeClip(c, m, {lang:LG(src)[2], model, task:'transcribe'});
  if (!segs.length) throw new Error('لم يُستخرج أي كلام من المقطع');
  const tr0 = gfxTrack(0), orig = segs.map(s => mk('text', tr0, s.start, s.dur, {text:s.text, size:6.5, bg:true, strokeW:0, fadeIn:0, fadeOut:0, y:72}));
  commit();
  await translateClips(orig, src, dst, 'copy');
  const trans = S.clips.filter(x => x.type === 'text' && x.track === TRACKS[0].id).sort((a, b) => a.start - b.start);
  return await dubClips(trans, dst, origVol);
}

/* ---- لوحة التبويب ---- */
const trackOpts = () => [...TRACKS.filter(t => t.kind === 'gfx' && S.clips.some(c => c.track === t.id && c.type === 'text')).map(t => `<option value="${t.id}">${t.label} (${S.clips.filter(c => c.track === t.id && c.type === 'text').length})</option>`), '<option value="__sel">المقطع النصي المحدد فقط</option>'].join('');
const langOpts = (only, def) => LANGS.filter(l => !only || l[4]).map(l => `<option value="${l[0]}" ${l[0] === def ? 'selected' : ''}>${l[1]}</option>`).join('');
function buildAI(){
  $('#t4').innerHTML = `
  <div class="sec">1) تفريغ الصوت إلى نص</div>
  <div class="fld row2"><div><label>لغة الكلام</label><select id="aiSrc">${langOpts(false, 'ar')}</select></div><div><label>النموذج</label><select id="aiMod"><option value="tiny">صغير</option><option value="base" selected>متوسط</option><option value="small">كبير</option></select></div></div>
  <button id="aiTr" class="pri" style="width:100%">🎙 تفريغ المقطع المحدد → نصوص</button>
  <div class="sec">نص التفريغ <span style="color:var(--mut);font-weight:400">(عدّل أي سطر)</span></div>
  <div style="display:flex;gap:6px;margin-bottom:6px"><button id="aiCopy">نسخ</button><button id="aiTxt">تصدير TXT</button><button id="aiSrt">تصدير SRT</button></div>
  <div id="trList"></div>
  <div class="sec">2) ترجمة النصوص</div>
  <div class="fld"><label>النصوص المراد ترجمتها</label><select id="aiTrk"></select></div>
  <div class="fld row2"><div><label>من</label><select id="aiFrom">${langOpts(false, 'ar')}</select></div><div><label>إلى</label><select id="aiTo">${langOpts(false, 'en')}</select></div></div>
  <div class="fld"><label>الوضع</label><select id="aiMode"><option value="copy">نسخة مترجمة على مسار جديد (الأصل يبقى)</option><option value="replace">استبدال النص الأصلي</option></select></div>
  <button id="aiTl" class="pri" style="width:100%">🌐 ترجمة</button>
  <div class="sec">3) دبلجة (صوت من النص)</div>
  <div class="fld"><label>النصوص المراد دبلجتها</label><select id="aiTrk2"></select></div>
  <div class="fld"><label>لغة الصوت</label><select id="aiTts">${langOpts(true, 'en')}</select></div>
  <div class="fld"><label><span>مستوى الصوت الأصلي أثناء الدبلجة</span><b id="aiOvv">20</b></label><input type="range" id="aiOv" min="0" max="100" value="20" oninput="aiOvv.textContent=this.value"></div>
  <div style="display:flex;gap:6px"><button id="aiDub" class="pri" style="flex:1">🔊 دبلجة</button><button id="aiPrev" title="استماع سريع بصوت الجهاز (للمعاينة فقط)">▶ استماع</button></div>
  <div class="sec">🌍 خط كامل بنقرة</div>
  <p style="color:var(--mut);font-size:12px;margin:0 0 6px">يفرّغ كلام المقطع المحدد (بلغة "لغة الكلام" أعلاه)، يترجمه، ثم يدبله باللغة المختارة.</p>
  <div class="fld"><label>دبلجة إلى</label><select id="aiFull">${langOpts(true, 'en')}</select></div>
  <button id="aiAll" class="pri" style="width:100%">🌍 تفريغ ← ترجمة ← دبلجة</button>
  <div id="aiSt" style="min-height:22px;margin:10px 0;font-size:12px"></div>
  <p style="color:var(--mut);font-size:11px">النماذج تعمل داخل متصفحك دون رفع أي ملف. أول استخدام ينزّل النموذج (Whisper ≈40–250MB، الترجمة ≈600MB، الصوت ≈100MB لكل لغة) ويحتاج إنترنت.</p>`;
  const run = (btn, fn) => async () => { btn.disabled = true; try { await fn(); } catch (e) { aiErr(e); } btn.disabled = false; };
  $('#aiTr').onclick = run($('#aiTr'), async () => {
    const c = selClip(), m = c && mediaOf(c); if (!c || !m || !(c.type === 'video' || c.type === 'audio')) throw new Error('اختر مقطع فيديو أو صوت فيه كلام');
    const segs = await transcribeClip(c, m, {lang:LG($('#aiSrc').value)[2], model:$('#aiMod').value}); aiSt(`تمّ: ${addSegments(segs, false)} سطراً`);
  });
  $('#aiTl').onclick = run($('#aiTl'), async () => aiSt(`تمّت ترجمة ${await translateClips(scopeClips($('#aiTrk').value), $('#aiFrom').value, $('#aiTo').value, $('#aiMode').value)} سطراً`));
  $('#aiDub').onclick = run($('#aiDub'), async () => aiSt(`تمّت دبلجة ${await dubClips(scopeClips($('#aiTrk2').value), $('#aiTts').value, +$('#aiOv').value)} سطراً — صوتها على مسار "دبلجة"`));
  $('#aiAll').onclick = run($('#aiAll'), async () => {
    const c = selClip(), m = c && mediaOf(c); if (!c || !m || !(c.type === 'video' || c.type === 'audio')) throw new Error('اختر مقطع الفيديو أو الصوت أولاً');
    aiSt(`اكتملت الدبلجة (${await fullDub(c, m, $('#aiSrc').value, $('#aiFull').value, null, +$('#aiOv').value, $('#aiMod').value)} مقطع صوت)`);
  });
  $('#aiPrev').onclick = () => { const l = scopeClips($('#aiTrk2').value)[0]; if (l) previewVoice($('#aiTts').value, l.p.text); else alert('لا توجد نصوص'); };
  $('#aiCopy').onclick = () => navigator.clipboard && navigator.clipboard.writeText(textClips().map(c => c.p.text).join('\n')).then(() => aiSt('تم النسخ'));
  $('#aiTxt').onclick = () => { const tx = textClips(); if (!tx.length) return alert('لا توجد نصوص'); dl(new Blob([tx.map(c => `[${fmt(c.start)}] ${c.p.text}`).join('\n')], {type:'text/plain'}), 'transcript.txt'); };
  $('#aiSrt').onclick = exportSrt;
  renderTranscript();
}
function renderTranscript(){
  const box = $('#trList'); if (!box || $('#t4').hidden) return;
  if (box.contains(document.activeElement)) return;
  const sel = id => { const e = $(id); if (!e) return; const v = e.value; e.innerHTML = trackOpts(); if (v !== '__sel' && [...e.options].some(o => o.value === v)) e.value = v; else if (e.options.length > 1) e.selectedIndex = e.options.length - 2; };
  sel('#aiTrk'); sel('#aiTrk2');
  const tx = textClips();
  box.innerHTML = tx.length ? '' : '<div class="empty" style="padding:12px">لا توجد نصوص بعد — فرّغ مقطعاً أو أضف نصاً</div>';
  for (const c of tx){
    const d = document.createElement('div'); d.className = 'fld';
    d.innerHTML = `<label><button class="kb" style="margin:0">${fmt(c.start)}</button><span style="font-size:10px">${(TRACKS.find(t => t.id === c.track) || {}).label || ''}</span></label><textarea rows="2"></textarea>`;
    const ta = d.querySelector('textarea'); ta.value = c.p.text;
    d.querySelector('button').onclick = () => { S.sel = c.id; seek(c.start); renderTimeline(); renderInspector(); };
    ta.oninput = () => { c.p.text = ta.value; render(); }; ta.onchange = () => { commit(); renderTimeline(); };
    box.appendChild(d);
  }
}
const _refresh = refresh; refresh = function(){ _refresh(); renderTranscript(); };
buildAI();
