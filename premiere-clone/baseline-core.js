/* حساب معايير الأداء من بيانات تيك توك (نفس بنية tiktok-dashboard/data/data.json). يعمل في المتصفح وفي Node. */
(function (root, factory){ if (typeof module === 'object' && module.exports) module.exports = factory(); else root.buildBaseline = factory(); })(typeof self !== 'undefined' ? self : this, function (){
  const n = x => x || 0, med = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }, mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const GUIDE = /كيف|طريقة|مكان|الأبواب|دليل|وين|كم |أماكن|مواقف|خريطة|باركود/, HOTEL = /فندق|فنادق|أجنحة|برج|عرض/;
  return function buildBaseline(data){
    const V = (data.videos || []).filter(v => v.views && v.dur).map(v => { const k = Math.max(1, v.views), c = v.caption || '';
      return {views:v.views, dur:v.dur, full:n(v.fullRate), ret:n(v.avgWatch) / v.dur, save:n(v.saves) / k * 1000, share:n(v.shares) / k * 1000, fol:n(v.newFollowers) / k * 1000, caption:c, curve:v.retention || null,
              cat:GUIDE.test(c) ? 'guide' : HOTEL.test(c) ? 'hotel' : 'other', offer:/حتى|ينتهي|آخر/.test(c) && /عرض/.test(c), price:/\d+\s*ريال|بـ\s*\d+/.test(c)}; });
    const agg = g => g.length ? {n:g.length, medViews:Math.round(med(g.map(v => v.views))), full:+(mean(g.map(v => v.full)) * 100).toFixed(1), save:+mean(g.map(v => v.save)).toFixed(1), share:+mean(g.map(v => v.share)).toFixed(1), fol:+mean(g.map(v => v.fol)).toFixed(1)} : null;
    const withCurve = V.filter(v => v.curve && v.curve.length >= 6), len = Math.min(12, ...withCurve.map(v => v.curve.length));
    const avgCurve = withCurve.length ? Array.from({length:len}, (_, i) => +(mean(withCurve.map(v => v.curve[i])) * 100).toFixed(0)) : [];
    const top = [...withCurve].sort((a, b) => b.views - a.views).filter(v => !/مكارم/.test(v.caption)).slice(0, 6), topCurve = top.length ? Array.from({length:Math.min(len, 6)}, (_, i) => +(mean(top.map(v => v.curve[i])) * 100).toFixed(0)) : [];
    const ex = (arr, f) => [...arr].filter(v => !/مكارم/.test(v.caption)).sort(f).slice(0, 3).map(v => ({caption:v.caption.replace(/\s+/g, ' ').slice(0, 70), views:v.views, full:+(v.full * 100).toFixed(1), save:+(v.save + v.share).toFixed(0), dur:+v.dur.toFixed(0)}));
    return {
      range:data.range || null, videos:V.length, totalViews:V.reduce((a, v) => a + v.views, 0), medViews:Math.round(med(V.map(v => v.views))),
      avgCurve, topCurve,
      byCat:{guide:agg(V.filter(v => v.cat === 'guide')), hotel:agg(V.filter(v => v.cat === 'hotel')), other:agg(V.filter(v => v.cat === 'other'))},
      byDur:{'<20':agg(V.filter(v => v.dur < 20)), '20-30':agg(V.filter(v => v.dur >= 20 && v.dur < 30)), '30-45':agg(V.filter(v => v.dur >= 30 && v.dur < 45)), '45+':agg(V.filter(v => v.dur >= 45))},
      offerHotel:agg(V.filter(v => v.cat === 'hotel' && v.offer)), noOfferHotel:agg(V.filter(v => v.cat === 'hotel' && !v.offer)),
      topByCompletion:ex(V, (a, b) => b.full - a.full), topBySavesShares:ex(V, (a, b) => (b.save + b.share) - (a.save + a.share)),
      sources:(() => { const s = (data.videos || []).map(v => v.sources).filter(Boolean); const g = k => +(mean(s.map(x => n(x[k]))) * 100).toFixed(0); return s.length ? {foryou:g('foryou'), search:g('search'), profile:g('profile')} : null; })(),
    };
  };
});
