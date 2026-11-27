'use strict';
/* ============ مستشار التسويق: تحليل المقطع، التعلّم من الأداء، اقتراح مقاطع جديدة ============ */
const LEARN_KEY = 'vedit-learn', BASE_KEY = 'vedit-baseline';
const BASE = (() => { try { return JSON.parse(localStorage.getItem(BASE_KEY) || 'null') || window.BASELINE || null; } catch (_) { return window.BASELINE || null; } })();
const RE = {
  urgency:/حتى\s*[\d٠-٩]|ينتهي|آخر\s*(يوم|فرصة)|لفترة محدودة|اليوم فقط|متبقي|العرض\s*حتى/,
  perk:/مجان|هدية|خصم|إضافي|أزيدك|بدون\s*رسوم|شامل|يكفي/,
  unit:/للغرفة|لليلة|للشخص|للفرد|للعائلة|لكل\s*(غرفة|شخص|فرد)/,
  hookStrong:/\d|؟|مجان|خصم|عرض|كيف|ليش|لماذا|كم|اكتشف|لا\s*تفوت|سكن|احجز|أرخص|أقل/,
  ctaBio:/الرابط|البايو|البيو|في\s*الوصف/, ctaWa:/واتس|\+?966[\s\d-]{7,}|\b05\d{8}\b|wa\.me/i, ctaDm:/راسلنا|الخاص|رسائل|تواصل|اتصل/, ctaBook:/للحجز|احجز|احجزوا/,
};
const allTexts = () => S.clips.filter(c => c.type === 'text' && c.p.text !== undefined).map(c => ({c, t:c.p.counter ? (c.p.cPrefix + c.p.cTo + c.p.cSuffix) : c.p.text}));
const wc = s => s.trim().split(/\s+/).filter(Boolean).length;

/* ---------- قياسات الصوت من الموجة ---------- */
function speechTimeline(step = .1){
  const T = total(), out = [];
  for (let t = 0; t < T; t += step){
    let loud = false;
    for (const c of S.clips){
      if ((c.type !== 'video' && c.type !== 'audio') || S.muted[c.track] || t < c.start || t >= c.start + c.dur || (c.p.volume ?? 100) < 15) continue;
      const m = mediaOf(c); if (!m || !m.peaks) continue; const i = Math.floor((c.in + (t - c.start) * (c.p.speed || 1)) * PPS);
      let mx = 0; for (let j = i - 3; j <= i + 3; j++) mx = Math.max(mx, m.peaks[j] || 0);
      if (mx > .1){ loud = true; break; }
    }
    out.push(loud);
  }
  return out;
}

/* ---------- التحليل ---------- */
function analyzeProject(){
  const T = total(), texts = allTexts(), blob = texts.map(x => x.t).join(' \n '), B = BASE;
  if (!S.clips.length) return null;
  const sp = speechTimeline(), firstSpeech = sp.indexOf(true) < 0 ? null : sp.indexOf(true) * .1;
  const gaps = []; { let run = 0, start = 0; sp.forEach((v, i) => { if (!v){ if (!run) start = i; run++; } else { if (run >= 8 && start > 0) gaps.push(run * .1); run = 0; } }); }
  const caps = texts.filter(x => !x.c.p.counter && x.c.p.y >= 55 && !x.c._card), capsSorted = caps.map(x => x.c).sort((a, b) => a.start - b.start);
  const hookTexts = texts.filter(x => x.c.start < 3 && !x.c._card).map(x => x.t), hookLine = hookTexts.join(' ').trim();
  const visualStarts = [...new Set(S.clips.filter(c => c.type === 'video' || c.type === 'image').filter(c => !c._bug && !c._card).map(c => +c.start.toFixed(2)))].sort((a, b) => a - b);
  const cuts10 = visualStarts.length / Math.max(1, T / 10), cutIn3 = visualStarts.filter(t => t > .05 && t <= 3).length;
  const prices = texts.filter(x => PRICE_RE.test(x.t)).map(x => x.t.match(PRICE_RE)[0]), hasPrice = prices.length > 0;
  const priceUnit = hasPrice ? RE.unit.test(blob) : null;
  const urgency = RE.urgency.test(blob), perk = RE.perk.test(blob);
  const ctaTypes = ['ctaBio', 'ctaWa', 'ctaDm', 'ctaBook'].filter(k => RE[k].test(blob)), contactTypes = ['ctaBio', 'ctaWa', 'ctaDm'].filter(k => RE[k].test(blob));
  const ctaClips = texts.filter(x => RE.ctaBio.test(x.t) || RE.ctaBook.test(x.t) || RE.ctaWa.test(x.t) || RE.ctaDm.test(x.t)), lastCta = ctaClips.length ? Math.max(...ctaClips.map(x => x.c.start)) : null;
  const endCard = S.clips.some(c => c._card) || texts.some(x => RE.ctaWa.test(x.t) && x.c.start > T - 5), cardDur = S.clips.filter(c => c._card).reduce((m, c) => Math.max(m, c.dur), 0);
  const hasLogo = S.clips.some(c => c._bug) || S.clips.some(c => c.type === 'image' && /شعار|logo/i.test((mediaOf(c) || {}).name || ''));
  const words = caps.map(x => wc(x.t)), avgChunk = words.length ? words.reduce((a, b) => a + b, 0) / words.length : 0;
  const unsafe = caps.filter(x => x.c.p.y < 15 || x.c.p.y > 78).length, tiny = caps.filter(x => x.c.p.size < 4.2).length;
  const cats = [];
  const add = (id, name, weight, f) => { const r = {id, name, weight, score:100, good:[], bad:[], tips:[]}; f(r, p => { r.score = Math.max(0, r.score - p); }); cats.push(r); };
  const retNote = B && B.avgCurve.length > 2 ? `في حسابك: يبقى ${B.avgCurve[2]}% فقط بعد الثانية 2 (أفضل مقاطعك ${B.topCurve[2]}%)` : '';

  add('hook', 'الهوك (أول 3 ثوانٍ)', 25, (r, pen) => {
    if (firstSpeech === null && !hookLine){ pen(45); r.bad.push('لا كلام ولا نص ظاهر في البداية'); }
    else {
      if (firstSpeech !== null && firstSpeech <= .6) r.good.push(`الكلام يبدأ فوراً (${firstSpeech.toFixed(1)} ث)`);
      else if (firstSpeech !== null){ pen(15); r.bad.push(`الكلام يتأخر ${firstSpeech.toFixed(1)} ث`); r.tips.push('اقصّ الصمت الأول؛ كل ثانية ضائعة تُخسرك مشاهدين.'); }
    }
    if (hookLine){ r.good.push('يوجد نص في أول 3 ثوانٍ'); if (!RE.hookStrong.test(hookLine)){ pen(10); r.bad.push('نص الهوك لا يحمل رقماً ولا سؤالاً ولا فائدة صريحة'); r.tips.push('ابدأ برقم أو سؤال أو فائدة محددة (مثل السعر أو المسافة).'); } else r.good.push('الهوك فيه رقم/سؤال/فائدة'); if (wc(hookLine) > 10){ pen(10); r.bad.push('سطر الهوك طويل (أكثر من 10 كلمات)'); } }
    else { pen(30); r.bad.push('لا نص في أول 3 ثوانٍ (من يشاهد بلا صوت لن يفهم)'); r.tips.push('ضع سطر هوك مكتوباً في الثانية 0 إلى 2.5.'); }
    if (cutIn3 === 0 && T > 15){ pen(8); r.bad.push('لا تغيير بصري في أول 3 ثوانٍ'); }
    if (PRICE_RE.test(hookLine) && !RE.unit.test(hookLine)){ pen(12); r.bad.push('السعر في الهوك بلا وحدة؛ قد يفهمه المشاهد «للشخص» لا «للغرفة»'); r.tips.push('اكتب الوحدة في الهوك نفسه: «بـ85 ريال للغرفة».'); }
    if (retNote) r.tips.push(retNote + ' — الهوك هو أهم ما يصلحه المونتاج.');
  });
  add('content', 'المحتوى والبنية', 20, (r, pen) => {
    if (T < 12){ pen(15); r.bad.push(`قصير جداً (${T.toFixed(0)} ث)`); } else if (T > 45){ pen(20); r.bad.push(`طويل (${T.toFixed(0)} ث)`); if (B) r.tips.push(`في حسابك: إكمال المقاطع فوق 45 ث ${B.byDur['45+'].full}% مقابل ${B.byDur['20-30'].full}% لـ20 إلى 30 ث.`); }
    else r.good.push(`المدة مناسبة (${T.toFixed(0)} ث)`);
    if (!caps.length){ pen(35); r.bad.push('لا كابشن'); r.tips.push('أضف كابشن؛ أغلب المشاهدة بلا صوت.'); } else r.good.push(`كابشن موجود (${caps.length} مقطع)`);
    const vTracks = new Set(S.clips.filter(c => c.type === 'video' || c.type === 'image').map(c => c.track)); if (vTracks.size < 2 && T > 15){ pen(10); r.bad.push('لقطة واحدة متصلة بلا لقطات مساندة'); r.tips.push('أضف لقطات مساندة (B-roll) تُثبت ما تقوله.'); } else if (vTracks.size >= 2) r.good.push('لقطات مساندة تدعم الكلام');
    if (B && B.byCat.guide && B.byCat.hotel) r.tips.push(`درس من أرقامك: محتوى الإرشاد (طرق/أماكن/أبواب) متوسط مشاهداته ${B.byCat.guide.medViews} مقابل ${B.byCat.hotel.medViews} لعروض الفنادق (${B.byCat.guide.n} و${B.byCat.hotel.n} مقطعاً) — اجعل العرض يقدّم معلومة مفيدة.`);
  });
  add('pace', 'الإيقاع', 15, (r, pen) => {
    if (cuts10 < 1.5 && T > 15){ pen(15); r.bad.push(`قليل التغيير البصري (${cuts10.toFixed(1)} لكل 10 ث)`); } else if (cuts10 > 12){ pen(8); r.bad.push('تقطيع مفرط'); } else r.good.push(`إيقاع بصري جيد (${cuts10.toFixed(1)} تغيير لكل 10 ث)`);
    if (caps.length){ if (avgChunk > 5){ pen(10); r.bad.push(`مقاطع الكابشن طويلة (${avgChunk.toFixed(1)} كلمات)`); r.tips.push('قطّع الكابشن إلى 2 أو 3 كلمات (زر «نمط أسس» يفعل ذلك).'); } else r.good.push(`كابشن مقطّع (${avgChunk.toFixed(1)} كلمة/مقطع)`); }
    if (gaps.length){ pen(Math.min(15, gaps.length * 5)); r.bad.push(`${gaps.length} فجوة صمت أطول من 0.8 ث`); r.tips.push('استخدم «إزالة سكتات».'); } else if (sp.some(Boolean)) r.good.push('بلا فجوات صمت طويلة');
  });
  add('offer', 'الحافز والجائزة (ماذا يربح المشاهد؟)', 15, (r, pen) => {
    r.score = 30;
    if (hasPrice){ r.score += 25; r.good.push(`سعر ظاهر: «${prices[0]}»`); if (!priceUnit){ r.score -= 15; r.bad.push('السعر بلا وحدة (للغرفة؟ للشخص؟ لليلة؟)'); r.tips.push('اكتب الوحدة بجانب السعر؛ الالتباس يقتل الثقة.'); } } else { r.bad.push('لا سعر ولا قيمة رقمية'); r.tips.push('الأرقام تثبّت الانتباه: اذكر السعر أو القيمة.'); }
    if (urgency){ r.score += 20; r.good.push('يوجد موعد/إلحاح'); } else { r.bad.push('لا موعد انتهاء ولا إلحاح'); r.tips.push(B && B.offerHotel && B.offerHotel.n ? `من أرقامك: منشور الفندق الذي ذكر موعد انتهاء العرض حقق ${B.offerHotel.fol} متابعاً لكل ألف مشاهدة مقابل ${B.noOfferHotel.fol} لغيره (عيّنة واحدة فقط، اعتبرها إشارة لا قاعدة).` : 'أضف موعد انتهاء حقيقياً للعرض.'); }
    if (perk){ r.score += 15; r.good.push('يوجد ميزة/هدية إضافية'); } else { r.bad.push('لا ميزة إضافية'); }
    r.score = Math.min(100, Math.max(0, r.score));
    if (urgency && !texts.some(x => RE.urgency.test(x.t) && x.c.start < T * .5)){ r.score -= 12; r.bad.push('موعد العرض يظهر في آخر الفيديو فقط'); r.tips.push('قدّمه للنصف الأول أو أبرزه بحجم أكبر؛ من لا يكمل المشاهدة لن يراه (متوسط إكمال المقاطع في حسابك أقل من 10%).'); }
    r.score = Math.max(0, r.score);
  });
  add('close', 'الختام والدعوة (CTA)', 15, (r, pen) => {
    if (!ctaClips.length){ pen(55); r.bad.push('لا دعوة واضحة للحجز/التواصل'); r.tips.push('ختم بدعوة واحدة: «للحجز الرابط في البايو».'); }
    else {
      r.good.push('دعوة للحجز موجودة'); if (lastCta !== null && lastCta < T - 6 && !endCard){ pen(15); r.bad.push('الدعوة في منتصف الفيديو لا في الختام'); r.tips.push('كرّر الدعوة في آخر 4 ثوانٍ.'); }
      if (contactTypes.length >= 2){ pen(10); r.bad.push('أكثر من وسيلة تواصل (' + contactTypes.map(k => ({ctaBio:'رابط البايو', ctaWa:'واتساب', ctaDm:'الخاص'})[k]).join(' + ') + ')'); r.tips.push('اختر وسيلة رئيسية واحدة وضعها أولاً؛ تعدد الخيارات يشتت. (إن كان مقصوداً لمنصة معيّنة فتجاهل هذا.)'); } else r.good.push('وسيلة تواصل واحدة واضحة');
    }
    if (endCard){ r.good.push(`بطاقة ختامية${cardDur ? ' (' + cardDur.toFixed(1) + ' ث)' : ''}`); if (cardDur && cardDur < 2.5){ pen(8); r.bad.push('البطاقة الختامية قصيرة'); } } else { pen(12); r.bad.push('لا بطاقة ختامية'); }
    if (texts.some(x => RE.ctaWa.test(x.t))) r.tips.push('تنبيه: الرقم ظاهر داخل الفيديو؛ لا تنشر هذه النسخة على فيسبوك (قرار المالك) — استخدم متغيّر «نسخة فيسبوك بلا بطاقة الرقم».');
  });
  add('brand', 'الهوية والمظهر', 10, (r, pen) => {
    if (hasLogo) r.good.push('الشعار ظاهر'); else { pen(25); r.bad.push('لا شعار'); }
    if (S.aspect !== '9:16'){ pen(15); r.bad.push('المقاس ليس 9:16'); } else r.good.push('مقاس عمودي 9:16');
    if (unsafe){ pen(20); r.bad.push(`${unsafe} كابشن خارج المنطقة الآمنة`); } else if (caps.length) r.good.push('الكابشن داخل المنطقة الآمنة');
    if (tiny){ pen(15); r.bad.push('كابشن صغير الحجم'); }
  });
  const score = Math.round(cats.reduce((a, c) => a + c.score * c.weight, 0) / cats.reduce((a, c) => a + c.weight, 0));
  const priorities = [...cats].sort((a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight).filter(c => c.bad.length).slice(0, 3).map(c => ({cat:c.name, issue:c.bad[0], fix:c.tips[0] || ''}));
  return {score, cats, priorities, facts:{T:+T.toFixed(1), firstSpeech, hookLine, hasPrice, priceUnit, urgency, perk, ctaTypes, lastCta, endCard, hasLogo, cuts10:+cuts10.toFixed(1), avgChunk:+avgChunk.toFixed(1), gaps:gaps.length, caps:caps.length}};
}

/* ---------- مكتبة «ما تعلّمته» ---------- */
const loadLearn = () => { try { return JSON.parse(localStorage.getItem(LEARN_KEY) || '[]'); } catch (_) { return []; } };
const saveLearn = a => { try { localStorage.setItem(LEARN_KEY, JSON.stringify(a.slice(0, 60))); } catch (_) {} };
function learnInsights(){
  const L = loadLearn().filter(x => x.perf && x.perf.views > 0);
  if (L.length < 4) return `أضف أرقام الأداء لـ4 مقاطع على الأقل لأقارن (عندك ${L.length}).`;
  const s = [...L].sort((a, b) => b.perf.views - a.perf.views), h = s.slice(0, Math.ceil(s.length / 2)), l = s.slice(Math.ceil(s.length / 2));
  const m = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / arr.length, out = [];
  for (const [k, n] of [['hook', 'الهوك'], ['offer', 'الحافز'], ['close', 'الختام'], ['pace', 'الإيقاع'], ['content', 'المحتوى']]){
    const d = m(h, x => x.cats[k] || 0) - m(l, x => x.cats[k] || 0); if (Math.abs(d) >= 8) out.push(`${n}: الأعلى مشاهدة ${d > 0 ? 'أقوى' : 'أضعف'} بـ${Math.abs(d).toFixed(0)} نقطة`);
  }
  const dd = m(h, x => x.facts.T) - m(l, x => x.facts.T); if (Math.abs(dd) >= 4) out.push(`المدة: الأعلى مشاهدة ${dd > 0 ? 'أطول' : 'أقصر'} بـ${Math.abs(dd).toFixed(0)} ث`);
  return out.length ? out.join(' · ') + ` (على ${L.length} مقاطع — عيّنة صغيرة)` : 'لا فروق واضحة بين الأعلى والأدنى بعد.';
}

/* ---------- أفكار مقاطع جديدة + بناء هيكل ---------- */
function ideas(){
  const B = BASE, g = B && B.byCat.guide, h = B && B.byCat.hotel, I = [];
  I.push({id:'guide', n:'دليل وصول: «كم تمشي من الفندق للحرم؟» (بتجربة مصوَّرة)', hook:'كم تمشي من الفندق للحرم؟ جرّبتها بنفسي ⏱', beats:['[المدة بالدقائق بعد قياسها فعلاً]', '[المسار مصوَّراً من باب الفندق إلى الحرم]', '[نصيحة واحدة مفيدة للمعتمر]'],
    why:g && h ? `محتوى الإرشاد عندك: متوسط مشاهدات ${g.medViews} وإكمال ${g.full}% مقابل ${h.medViews} و${h.full}% لعروض الفنادق.` : 'المحتوى الإرشادي أقوى عادةً.', note:'لا تكتب رقماً قبل أن تقيسه.'});
  I.push({id:'rooms', n:'غرفة بغرفة: سلسلة (ثنائية، ثلاثية، رباعية، خماسية)', hook:'هذه الغرفة تكفي [العدد] أشخاص بـ[السعر] ريال', beats:['[الغرفة من الداخل 8 ثوانٍ]', '[السعر للغرفة والسعة]', '[ما يميّزها]'],
    why:'لقطاتك الحالية للغرف ثانيتان فقط؛ كل غرفة بمقطع مستقل تعطي 4 مقاطع من نفس التصوير، ومقاطع الحفظ/المشاركة عندك تأتي من المحتوى المفصّل.', note:'استخدم «دمج المتشابه بالاسم» لتجميعها في مقطع جامع.'});
  I.push({id:'perperson', n:'تكلفة الفرد: «الغرفة الخماسية = [السعر ÷ 5] للفرد»', hook:'سكن مكة بـ[السعر ÷ العدد] ريال للفرد؟', beats:['[الحساب مكتوباً على الشاشة]', '[لقطة الغرفة]', '[شرط: لخمسة أشخاص / ما يشمله السعر]'],
    why:'الرقم المحسوب يلفت الانتباه ويوضّح القيمة.', note:'عملية حسابية مشتقة (مثلاً 85 ÷ 5 = 17) — تحتاج تأكيدك أن السعر للغرفة يكفي 5 أشخاص فعلاً قبل أي نشر.'});
  I.push({id:'deadline', n:'نفس الإعلان بموعد انتهاء في أول 5 ثوانٍ (اختبار)', hook:'العرض ينتهي [التاريخ]! سكن بمكة بـ[السعر]', beats:['[السعر والوحدة]', '[لقطات الغرف]', '[الدعوة]'],
    why:B && B.offerHotel && B.offerHotel.n ? `منشور العرض بموعد انتهاء حقق ${B.offerHotel.fol} متابعاً/ألف مقابل ${B.noOfferHotel.fol} (عيّنة واحدة — اختبره ولا تعتمد عليه).` : 'الإلحاح الحقيقي يرفع التحويل عادةً.', note:'الموعد يجب أن يكون حقيقياً.'});
  I.push({id:'transport', n:'المواصلات المجانية: كيف تعمل؟ (مواعيد/نقطة الركوب)', hook:'مواصلات مجانية من الفندق للحرم — كيف تركب؟ 🚌', beats:['[نقطة الركوب مصوَّرة]', '[المواعيد الفعلية]', '[المدة]'],
    why:'تحوّل ميزة ذُكرت بجملة واحدة إلى مقطع إرشادي كامل، وأسئلة المسافات والمواصلات متكررة في تعليقاتك.', note:'المواعيد من المالك فقط.'});
  return I;
}
function buildSkeleton(idea){
  if (S.clips.length && !confirm('سيُضاف هيكل المقطع فوق المشروع الحالي. متابعة؟')) return;
  const T = 25, tr = topGfx();
  mk('text', tr, 0, 2.6, {text:idea.hook, size:7, y:34, aIn:'pop', aInDur:.4, strokeW:5, fadeIn:0});
  idea.beats.forEach((b, i) => { const s = 3 + i * 6.5; mk('text', freeGfx(s, 6), s, 6, {text:b, size:5.5, y:70}); });
  if (typeof addEndCard === 'function') addEndCard(T, 3.4);
  S.sel = null; syncEls(); commit(); seek(0);
}

/* ---------- الواجهة ---------- */
let lastReport = null;
const sc = v => v >= 80 ? 'var(--acc2)' : v >= 60 ? 'var(--gold)' : 'var(--red)';
function renderAdvisor(){
  const box = $('#t6'); if (!box || box.hidden) return;
  const B = BASE, r = lastReport;
  let h = `<div class="sec">🧠 مستشار التسويق</div><p style="color:var(--mut);font-size:12px;margin:0 0 6px">يحلّل المشروع الحالي ويقارنه بأرقام حسابك الفعلية${B ? ` (${B.videos} فيديو${B.range ? '، ' + B.range.from + ' إلى ' + B.range.to : ''})` : ''}.</p>
  <button id="adRun" class="pri" style="width:100%">🔍 حلّل المشروع الحالي</button><div id="adOut">`;
  if (r){
    h += (r.priorities.length ? `<div style="background:var(--panel2);border-radius:8px;padding:8px;margin-top:8px;font-size:12px"><b>أهم الأولويات</b>${r.priorities.map((p, i) => `<div style="margin-top:4px">${i + 1}. <b>${esc(p.cat)}:</b> ${esc(p.issue)}${p.fix ? '<br><span style="color:var(--mut)">💡 ' + esc(p.fix) + '</span>' : ''}</div>`).join('')}</div>` : '') + `<div style="text-align:center;margin:10px 0"><div style="font-size:38px;font-weight:900;color:${sc(r.score)}">${r.score}<span style="font-size:14px;color:var(--mut)">/100</span></div></div>`;
    for (const c of r.cats) h += `<div class="fld"><label><span>${c.name}</span><b style="color:${sc(c.score)}">${Math.round(c.score)}</b></label><div style="height:6px;background:var(--bg);border-radius:3px"><i style="display:block;height:100%;width:${Math.round(c.score)}%;background:${sc(c.score)};border-radius:3px"></i></div>
      ${c.good.map(x => `<div style="font-size:12px;color:var(--acc2)">✅ ${esc(x)}</div>`).join('')}${c.bad.map(x => `<div style="font-size:12px;color:var(--red)">⚠ ${esc(x)}</div>`).join('')}${c.tips.map(x => `<div style="font-size:12px;color:var(--mut)">💡 ${esc(x)}</div>`).join('')}</div>`;
    h += `<div class="sec">💾 تعلّم من هذا المقطع</div><div class="fld"><input type="text" id="lnName" placeholder="اسم المقطع"></div>
      <div class="fld row2"><div><label>مشاهدات</label><input type="number" id="lnV"></div><div><label>إكمال %</label><input type="number" id="lnF" step=".1"></div></div>
      <div class="fld row2"><div><label>حفظ+مشاركة</label><input type="number" id="lnS"></div><div><label>متابعون جدد</label><input type="number" id="lnN"></div></div>
      <button id="lnSave" style="width:100%">احفظ في مكتبة التعلّم</button>`;
  }
  h += `</div><div class="sec">📚 ما تعلّمتُه</div><div id="lnList"></div><div style="font-size:12px;color:var(--acc2);margin:6px 0">${esc(learnInsights())}</div>`;
  if (B){
    h += `<div class="sec">📊 معايير حسابك (تيك توك)</div><div style="font-size:12px;line-height:1.7">
      • من يبقى بعد ثانية 2: <b>${B.avgCurve[2]}%</b> في المتوسط، و<b>${B.topCurve[2]}%</b> في أفضل المقاطع<br>
      • محتوى الإرشاد: متوسط مشاهدات <b>${B.byCat.guide.medViews}</b> (إكمال ${B.byCat.guide.full}%) — عروض الفنادق: <b>${B.byCat.hotel.medViews}</b> (إكمال ${B.byCat.hotel.full}%)<br>
      • المدة: أقل من 20 ث إكمال ${B.byDur['<20'].full}% · 20–30 ث ${B.byDur['20-30'].full}% · 45+ ث ${B.byDur['45+'].full}% (لكن حفظ ومشاركة أعلى للأطول)<br>
      • المصدر: For You ${B.sources.foryou}% · بحث ${B.sources.search}% · الملف ${B.sources.profile}%</div>
      <div class="fld" style="margin-top:6px"><label>حدّث المعايير من ملف data.json جديد</label><input type="file" id="adData" accept=".json"></div>`;
  }
  h += `<div class="sec">💡 أفكار مقاطع جديدة</div><div id="adIdeas"></div>`;
  box.innerHTML = h;
  $('#adRun').onclick = () => { lastReport = analyzeProject(); if (!lastReport) return alert('المشروع فارغ'); renderAdvisor(); };
  if ($('#lnSave')) $('#lnSave').onclick = () => {
    const a = loadLearn(), v = +$('#lnV').value; a.unshift({id:Date.now(), name:$('#lnName').value.trim() || 'مقطع', date:new Date().toISOString().slice(0, 10), score:lastReport.score, cats:Object.fromEntries(lastReport.cats.map(c => [c.id, Math.round(c.score)])), facts:lastReport.facts,
      perf:v ? {views:v, full:+$('#lnF').value || null, saves:+$('#lnS').value || null, follows:+$('#lnN').value || null} : null}); saveLearn(a); renderAdvisor();
  };
  const ll = $('#lnList'); const L = loadLearn();
  if (!L.length) ll.innerHTML = '<div class="empty" style="padding:8px">لا شيء بعد — حلّل مقطعاً واحفظه</div>';
  L.forEach((x, i) => { const d = document.createElement('div'); d.className = 'mi'; d.style.cursor = 'default';
    d.innerHTML = `<div class="nm"><b></b><span>${x.date} · تقييم ${x.score}${x.perf ? ' · ' + x.perf.views + ' مشاهدة' : ''}</span></div><button class="danger">✕</button>`; d.querySelector('b').textContent = x.name;
    d.querySelector('button').onclick = () => { const a = loadLearn(); a.splice(i, 1); saveLearn(a); renderAdvisor(); }; ll.appendChild(d); });
  if ($('#adData')) $('#adData').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const nb = buildBaseline(JSON.parse(await f.text())); nb.generatedAt = new Date().toISOString().slice(0, 10); localStorage.setItem(BASE_KEY, JSON.stringify(nb)); alert('حُدّثت المعايير — أعد تحميل الصفحة لتطبيقها'); } catch (_) { alert('ملف غير صالح'); } };
  const il = $('#adIdeas');
  ideas().forEach(x => { const d = document.createElement('div'); d.className = 'fld';
    d.innerHTML = `<details><summary>${esc(x.n)}</summary><div style="font-size:12px;line-height:1.7"><b>الهوك:</b> ${esc(x.hook)}<br><b>البنية:</b> ${x.beats.map(esc).join(' ← ')}<br><b>لماذا:</b> ${esc(x.why)}<br><span style="color:var(--gold)">⚠ ${esc(x.note)}</span></div><button style="margin-top:6px">🏗 أنشئ هيكلاً في المحرر</button></details>`;
    d.querySelector('button').onclick = () => buildSkeleton(x); il.appendChild(d); });
}
