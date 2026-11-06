'use strict';
// قوالب الصفحات (عربية RTL) — كل المخرجات تمر عبر esc() لمنع XSS
const fs = require('node:fs');
const path = require('node:path');
const { setting, allSettings, toMs } = require('./db');
const POLICIES = require('./policies');
const I = require('./i18n');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sar = (n) => `${Number(n || 0).toLocaleString('en-US')} <small>ر.س</small>`;
const sarText = (n) => `${Number(n || 0).toLocaleString('en-US')} ر.س`;
const fmtD = (s) => new Intl.DateTimeFormat(I.isEn() ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(toMs(s));
const hijri = (s) => new Intl.DateTimeFormat(I.isEn() ? 'en-u-ca-islamic-umalqura-nu-latn' : 'ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(toMs(s));
const stars = (n) => '★'.repeat(Math.max(0, Math.min(5, n || 0)));
const baseUrl = () => (process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const L = I.L;
const vatOn = () => setting('vat_registered') === '1';
const sx = (s, k) => (I.isEn() && s[k + '_en'] ? s[k + '_en'] : s[k]);
const waLink = (msg) => { const n = setting('whatsapp'); return n ? `https://wa.me/${n}?text=${encodeURIComponent(msg || '')}` : ''; };
const fill = (t, s) => String(t)
  .replace(/\{agency\}/g, sx(s, 'agency_name')).replace(/\{license\}/g, s.tourism_license || '—')
  .replace(/\{cr\}/g, s.cr_number || '—').replace(/\{hours\}/g, s.cancel_free_hours)
  .replace(/\{vat\}/g, s.vat_registered === '1' ? (I.isEn() ? ' and include ' + s.vat_rate + '% VAT' : ' وشاملة ضريبة القيمة المضافة ' + s.vat_rate + '%') : '');
const policyText = (key, s) => {
  const k = key === 'about' ? 'about_text' : 'policy_' + key;
  if (I.isEn()) return fill(s[k + '_en'] || POLICIES.EN[key], s);
  return fill(s[k] || POLICIES[key], s);
};

const STATUS_AR = { request: 'بانتظار تأكيد التوفر', pending: 'بانتظار الدفع', awaiting_transfer: 'بانتظار الحوالة', pay_later: 'حجز مبدئي', confirmed: 'مؤكد', cancelled: 'ملغي' };

function layout({ title, desc, body, canonical, jsonld, admin, robots }) {
  const s = allSettings();
  const wa = waLink('السلام عليكم، أرغب بالاستفسار عن حجز فندق في مكة');
  const full = (title ? title + ' | ' : '') + sx(s, 'agency_name');
  const en = I.isEn(), st = I.store(), B = baseUrl();
  const pfx = en ? '/en' : '';
  if (canonical && en) canonical = canonical.replace(B, B + '/en').replace(/\/en\/$/, '/en');
  const here = String(st.url || '/').split('?')[0];
  const alt = !admin && B ? `<link rel="alternate" hreflang="ar" href="${esc(B + here)}"><link rel="alternate" hreflang="en" href="${esc(B + '/en' + (here === '/' ? '' : here))}"><link rel="alternate" hreflang="x-default" href="${esc(B + here)}">` : '';
  const sw = admin ? '' : en ? `<a class="langsw" href="${esc(st.url || '/')}" hreflang="ar" lang="ar">العربية</a>` : `<a class="langsw" href="${esc('/en' + (st.url === '/' ? '' : st.url || ''))}" hreflang="en" lang="en">English</a>`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc || sx(s, 'agency_tagline'))}">
${robots ? `<meta name="robots" content="${robots}">` : ''}
<meta name="theme-color" content="#1F2449">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}${alt}
<meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc || sx(s, 'agency_tagline'))}"><meta property="og:locale" content="ar_SA"><meta property="og:type" content="website">
<link rel="icon" href="/brand/icon-color.png">
<link rel="stylesheet" href="/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head><body class="${admin ? 'admin' : ''}">
<header class="top"><div class="wrap bar">
  <a class="brand" href="${admin ? '/admin' : pfx + '/'}"><img src="/brand/logo-horizontal-on-dark.png" alt="${esc(sx(s, 'agency_name'))}"></a>
  <nav>${admin
    ? `<a href="/admin">الحجوزات</a><a href="/admin/hotels">الفنادق</a><a href="/admin/links">روابط الدفع</a><a href="/admin/compliance">الامتثال</a><a href="/admin/settings">الإعدادات</a><a href="/" target="_blank">الموقع</a><form method="post" action="/admin/logout" class="inline">__CSRF__<button class="linkbtn">خروج</button></form>`
    : `<a href="/">الرئيسية</a><a href="/hotels">الفنادق</a><a href="/booking-lookup">تتبّع حجزي</a><a href="/about">من نحن</a>${wa ? `<a class="btn sm wa" href="${esc(wa)}" rel="noopener">واتساب</a>` : ''}${sw}`}</nav>
</div></header>
<main>${body}</main>
${admin ? '' : footer(s)}
<script src="/app.js" defer></script></body></html>`;
}

const logoFile = (f) => fs.existsSync(path.join(__dirname, '..', 'public', 'brand', f));
const govLogos = () => [['mot-logo.png', 'وزارة السياحة'], ['moc-logo.png', 'وزارة التجارة']].filter(([f]) => logoFile(f)).map(([f, a]) => `<img src="/brand/${f}" alt="${a}" class="gov">`).join('');
const payBadges = () => '<span class="badges"><i class="bd mada">مدى</i><i class="bd visa">VISA</i></span>';

function footer(s) {
  const rows = [
    s.tourism_license && `<li>ترخيص وزارة السياحة: <b>${esc(s.tourism_license)}</b></li>`,
    s.cr_number && `<li>السجل التجاري: <b>${esc(s.cr_number)}</b></li>`,
    s.vat_number && `<li>الرقم الضريبي: <b>${esc(s.vat_number)}</b></li>`,
    s.sbc_cert_no && `<li>توثيق المركز السعودي للأعمال: ${s.sbc_cert_url && /^https:\/\//.test(s.sbc_cert_url) ? `<a href="${esc(s.sbc_cert_url)}" target="_blank" rel="noopener"><b>${esc(s.sbc_cert_no)}</b></a>` : `<b>${esc(s.sbc_cert_no)}</b>`}</li>`,
  ].filter(Boolean).join('');
  return `<footer><div class="wrap fgrid">
  <div><img class="flogo" src="/brand/logo-horizontal-on-dark.png" alt=""><p>${esc(sx(s, 'agency_tagline'))}</p>
    <p class="muted">${esc(sx(s, 'address'))}</p>
    ${s.phone ? `<p dir="ltr" class="muted">${esc(s.phone)}</p>` : ''}${s.email ? `<p dir="ltr" class="muted">${esc(s.email)}</p>` : ''}</div>
  <div><h4>بيانات المنشأة</h4><ul class="lic">${rows || '<li class="muted">لم تُضف بعد</li>'}</ul><div class="govs">${govLogos()}</div></div>
  <div><h4>روابط</h4><ul class="lic"><li><a href="/terms">الشروط والأحكام</a></li><li><a href="/cancellation">سياسة الإلغاء والاسترداد</a></li><li><a href="/privacy">سياسة الخصوصية</a></li><li><a href="/booking-lookup">تتبّع الحجز</a></li></ul>
    <div class="pay">${payBadges()}</div></div>
</div><div class="copy">© ${new Date().getFullYear()} ${esc(sx(s, 'agency_name'))} — جميع الأسعار بالريال السعودي${vatOn() ? ' وشاملة ضريبة القيمة المضافة' : ''}</div></footer>`;
}

// ---------- مكوّنات ----------
function searchForm(v = {}, today, action = '/hotels') {
  return `<form class="search" method="get" action="${action}">
  <label>الوصول<input type="date" name="in" min="${today}" value="${esc(v.in || '')}" required></label>
  <label>المغادرة<input type="date" name="out" min="${today}" value="${esc(v.out || '')}" required></label>
  <label>عدد الغرف<select name="rooms">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<option ${Number(v.rooms) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
  <label>عدد النزلاء<select name="guests">${[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((n) => `<option ${Number(v.guests || 2) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
  <button class="btn">ابحث عن غرفة</button></form>`;
}
const cover = (h) => h.cover ? `<img src="/uploads/${esc(h.cover)}" alt="${esc(L(h, 'name'))}" loading="lazy">` : `<div class="ph"><img src="/brand/icon-color.png" alt=""></div>`;
function hotelCard(h, qs = '') {
  return `<a class="card" href="/hotels/${esc(h.slug)}${qs}"><div class="img">${cover(h)}${h.kaaba_view ? '<span class="tag">إطلالة على الكعبة</span>' : ''}${h.transfer ? '<span class="tag tag2">توصيل للحرم</span>' : ''}</div>
  <div class="pad"><div class="stars">${stars(h.stars)}</div><h3>${esc(L(h, 'name'))}</h3>
  <p class="muted">${esc(L(h, 'district') || 'مكة المكرمة')}${h.distance_m != null ? ` · ${Number(h.distance_m).toLocaleString('en-US')} م عن الحرم` : ''}</p>
  <p class="from">${h.price_from ? `ابتداءً من <b>${sar(h.price_from)}</b> / الليلة` : ''}${h.unavailable ? '<span class="soldout">غير متاح في هذه التواريخ</span>' : ''}</p></div></a>`;
}
const hid = (v) => ['in', 'out', 'rooms', 'guests'].map((k) => `<input type="hidden" name="${k}" value="${esc(v[k] || '')}">`).join('');

// ---------- صفحات الزوار ----------
const pages = {
  home({ hotels, today, v }) {
    return layout({
      title: '', desc: 'احجز فندقك في مكة المكرمة بأسعار واضحة شاملة الضريبة، قريب من الحرم المكي، ودفع آمن عبر مدى وبطاقات الائتمان.', canonical: baseUrl() + '/',
      jsonld: { '@context': 'https://schema.org', '@type': 'TravelAgency', name: setting('agency_name'), url: baseUrl() || undefined, telephone: setting('phone') || undefined, address: setting('address') },
      body: `<section class="hero"><div class="wrap"><h1>فندقك في مكة المكرمة، قريب من الحرم</h1>
      <p>${vatOn() ? 'أسعار واضحة شاملة الضريبة' : 'أسعار واضحة وشاملة'} · تأكيد فوري · دفع آمن · دعم عبر الواتساب</p>${searchForm(v, today)}</div></section>
      <section class="wrap"><h2 class="sec">فنادق مختارة</h2>${hotels.length ? `<div class="grid">${hotels.map((h) => hotelCard(h)).join('')}</div>` : '<p class="muted">لا توجد فنادق معروضة حاليًا.</p>'}</section>
      <section class="wrap feats"><div><b>أسعار شاملة</b><span>${vatOn() ? 'السعر النهائي شامل ضريبة القيمة المضافة 15%' : 'السعر المعروض هو السعر النهائي بالريال السعودي'}</span></div><div><b>دفع آمن</b><span>مدى وفيزا عبر بوابات دفع مرخّصة</span></div><div><b>قسيمة فورية</b><span>رقم حجز وقسيمة تأكيد بمجرد السداد</span></div><div><b>جهة مرخّصة</b><span>وكالة مرخّصة من وزارة السياحة</span></div></section>`,
    });
  },
  hotels({ hotels, today, v, searched }) {
    const qs = searched ? '?' + new URLSearchParams({ in: v.in, out: v.out, rooms: v.rooms, guests: v.guests }) : '';
    return layout({
      title: 'فنادق مكة المكرمة', canonical: baseUrl() + '/hotels',
      body: `<section class="wrap"><h1>فنادق مكة المكرمة</h1>${searchForm(v, today)}
      ${hotels.length ? `<div class="grid">${hotels.map((h) => hotelCard(h, qs)).join('')}</div>` : '<p class="muted">لا توجد نتائج.</p>'}</section>`,
    });
  },
  hotel({ h, images, rooms, v, today, searched, err }) {
    const amen = (L(h, 'amenities') || '').split(/[،,\n]/).map((x) => x.trim()).filter(Boolean);
    const g = images.length ? `<div class="gallery">${images.map((i) => `<img src="/uploads/${esc(i.filename)}" alt="${esc(L(h, 'name'))}" loading="lazy">`).join('')}</div>` : '';
    return layout({
      title: L(h, 'name'), desc: `${L(h, 'name')} — ${L(h, 'district') || 'مكة المكرمة'}${h.distance_m != null ? '، ' + h.distance_m + ' م عن الحرم' : ''}. احجز الآن بسعر ${vatOn() ? 'شامل الضريبة' : 'نهائي'}.`, canonical: baseUrl() + '/hotels/' + h.slug,
      jsonld: { '@context': 'https://schema.org', '@type': 'Hotel', name: L(h, 'name'), starRating: h.stars ? { '@type': 'Rating', ratingValue: h.stars } : undefined, address: L(h, 'address') || 'مكة المكرمة', description: L(h, 'description') || undefined, image: images[0] ? `${baseUrl()}/uploads/${images[0].filename}` : undefined },
      body: `<section class="wrap"><p><a href="/hotels">← كل الفنادق</a></p>
      <div class="stars">${stars(h.stars)}</div><h1>${esc(L(h, 'name'))}</h1>
      <p class="muted">${esc(L(h, 'address') || L(h, 'district') || 'مكة المكرمة')}${h.distance_m != null ? ` · ${Number(h.distance_m).toLocaleString('en-US')} م عن الحرم` : ''}${h.kaaba_view ? ' · إطلالة على الكعبة' : ''}</p>${g}
      ${L(h, 'description') && !/^(مسودة|Draft)/.test(L(h, 'description')) ? `<p class="desc">${esc(L(h, 'description')).replace(/\n/g, '<br>')}</p>` : ''}
      ${amen.length ? `<ul class="chips">${amen.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
      ${h.license_no ? `<p class="muted">ترخيص المنشأة الفندقية: ${esc(h.license_no)}</p>` : ''}
      <h2 class="sec" id="rooms">الغرف والأسعار</h2>${searchForm(v, today, `/hotels/${esc(h.slug)}#rooms`)}
      ${err ? `<p class="alert">${esc(err)}</p>` : ''}
      ${rooms.length ? `<div class="rooms">${rooms.map((r) => roomRow(r, v, searched)).join('')}</div>` : '<p class="muted">لا توجد غرف معروضة.</p>'}${extrasBlock(h)}</section>`,
    });
  },
  book({ h, r, v, q: qt, avail, err, csrf, form }) {
    const f = form || {};
    return layout({
      title: 'إتمام الحجز', robots: 'noindex',
      body: `<section class="wrap two"><div><h1>بيانات النزيل</h1>${err ? `<p class="alert">${esc(err)}</p>` : ''}
      <form method="post" action="/book" class="form">${csrf}<input type="hidden" name="room" value="${r.id}">${hid(v)}
        <label>الاسم الكامل (كما في الهوية)<input name="name" required maxlength="80" value="${esc(f.name)}" autocomplete="name"></label>
        <label>رقم الجوال (واتساب)<input name="phone" required inputmode="tel" dir="ltr" placeholder="05xxxxxxxx" maxlength="20" value="${esc(f.phone)}" autocomplete="tel"></label>
        <label>البريد الإلكتروني (اختياري)<input name="email" type="email" dir="ltr" maxlength="100" value="${esc(f.email)}" autocomplete="email"></label>
        <label>الجنسية<input name="nationality" maxlength="40" value="${esc(f.nationality)}"></label>
        <label>ملاحظات (اختياري)<textarea name="notes" rows="3" maxlength="500">${esc(f.notes)}</textarea></label>
        <label class="check"><input type="checkbox" name="agree" value="1" required> أوافق على <a href="/terms" target="_blank">الشروط والأحكام</a> و<a href="/cancellation" target="_blank">سياسة الإلغاء والاسترداد</a> و<a href="/privacy" target="_blank">سياسة الخصوصية</a></label>
        <button class="btn lg">${r.on_request ? 'إرسال طلب الحجز' : 'متابعة إلى الدفع'}</button></form></div>
      <aside class="sum">${summary({ hotel_name: L(h, 'name'), room_name: L(r, 'name'), check_in: v.in, check_out: v.out, nights: qt.nights, rooms: Number(v.rooms), guests: Number(v.guests), total: qt.total, vat: qt.vat })}${r.on_request ? '<p class="alert info">هذا طلب حجز: نتحقق من توفر الغرف مع الفندق ثم نرسل لك رابط الدفع عبر الواتساب. لا يُسحب أي مبلغ الآن.</p>' : `<p class="muted">متبقي ${avail} غرفة من هذا النوع لهذه التواريخ.</p>`}</aside></section>`,
    });
  },
  pay({ b, methods, s, csrf, err }) {
    const btn = (id, label) => `<form method="post" action="/booking/${esc(b.ref)}/pay" class="paybtn">${csrf}<input type="hidden" name="method" value="${id}"><button class="btn lg block">${esc(label)}</button></form>`;
    const bank = s.enable_bank_transfer === '1';
    return layout({
      title: 'الدفع', robots: 'noindex',
      body: `<section class="wrap two"><div><h1>اختر طريقة الدفع</h1><p class="muted">رقم الحجز: <b>${esc(b.ref)}</b> — الغرفة محجوزة لك مؤقتًا حتى إتمام الدفع.</p>
      ${err ? `<p class="alert">${esc(err)}</p>` : ''}
      ${methods.map((m) => btn(m.id, 'ادفع ' + sarText(b.total) + ' — ' + m.label)).join('')}
      ${bank ? btn('bank_transfer', 'حوالة بنكية') : ''}
      ${s.enable_pay_later === '1' ? btn('pay_later', 'احجز الآن وادفع لاحقًا (تأكيد عبر الواتساب)') : ''}
      ${!methods.length && !bank && s.enable_pay_later !== '1' ? '<p class="alert">لا توجد وسيلة دفع مفعّلة حاليًا. تواصل معنا عبر الواتساب لإتمام الحجز.</p>' : ''}
      <p>${payBadges()}</p><p class="muted">🔒 تتم معالجة بيانات البطاقة لدى بوابة الدفع مباشرة، ولا تمر عبر خوادمنا.</p></div>
      <aside class="sum">${summary(b)}</aside></section>`,
    });
  },
  payLink({ l, methods, csrf, s, err }) {
    const paid = l.status === 'paid';
    return layout({ title: 'رابط دفع', robots: 'noindex', body: `<section class="wrap narrow"><div class="box center-box"><small class="muted">رابط دفع رقم ${esc(l.code)}</small><h1>${esc(l.description)}</h1>
      ${l.customer_name ? `<p>العميل: ${esc(l.customer_name)}</p>` : ''}<p class="bigprice">${sar(l.amount)}</p>${vatOn() ? '<p class="muted">شامل ضريبة القيمة المضافة</p>' : ''}
      ${paid ? '<p class="alert info">تم السداد بنجاح — شكرًا لك</p>' : `${err ? `<p class="alert">${esc(err)}</p>` : ''}
        ${methods.map((m) => `<form method="post" action="/pay/l/${esc(l.token)}" class="paybtn">${csrf}<input type="hidden" name="method" value="${m.id}"><button class="btn lg block">ادفع الآن — ${esc(m.label)}</button></form>`).join('') || '<p class="alert">الدفع الإلكتروني غير مفعّل حاليًا، تواصل معنا.</p>'}
        <p>${payBadges()}</p><p class="muted">🔒 تتم معالجة بيانات البطاقة لدى بوابة الدفع مباشرة.</p>`}
      <p class="muted">${esc(sx(s, 'agency_name'))} — ترخيص وزارة السياحة ${esc(s.tourism_license || '—')}</p></div></section>` });
  },
  redirecting(url) {
    return layout({ title: 'جارٍ التحويل', robots: 'noindex', body: `<section class="wrap center"><meta http-equiv="refresh" content="0;url=${esc(url)}"><h1>جارٍ تحويلك إلى بوابة الدفع الآمنة…</h1><p><a class="btn" href="${esc(url)}">اضغط هنا إن لم يتم التحويل</a></p></section>` });
  },
  voucher({ b, s, csrf, notice }) {
    const st = STATUS_AR[b.status] || b.status;
    const hl = b.status === 'confirmed' ? 'ok' : b.status === 'cancelled' ? 'bad' : 'wait';
    const wa = waLink(`السلام عليكم، بخصوص الحجز رقم ${b.ref}`);
    const bank = b.status === 'awaiting_transfer';
    return layout({
      title: 'الحجز ' + b.ref, robots: 'noindex',
      body: `<section class="wrap voucher"><div class="vhead ${hl}"><div><small>رقم الحجز</small><h1>${esc(b.ref)}</h1></div><span class="pill">${esc(st)}</span></div>
      ${notice ? `<p class="alert info">${esc(notice)}</p>` : ''}
      ${bank ? `<div class="box"><h3>بيانات الحوالة</h3><p>المبلغ: <b>${sar(b.total)}</b> — اكتب رقم الحجز <b>${esc(b.ref)}</b> في بيان الحوالة وأرسل صورة الإيصال عبر الواتساب.</p><p>البنك: ${esc(s.bank_name)}<br>اسم المستفيد: ${esc(s.bank_holder)}<br>الآيبان: <b dir="ltr">${esc(s.bank_iban)}</b></p><p class="muted">تُحجز الغرفة لمدة ${esc(s.transfer_hold_hours)} ساعة ثم يُلغى الحجز تلقائيًا إن لم تصل الحوالة.</p></div>` : ''}
      ${b.status === 'request' ? '<div class="box"><h3>تم استلام طلب الحجز</h3><p>سنتحقق من توفر الغرف مع الفندق ونرسل لك رابط الدفع عبر الواتساب. يتأكد الحجز بعد السداد. لا يُسحب أي مبلغ قبل ذلك.</p></div>' : ''}
      ${b.status === 'pending' ? `<p><a class="btn" href="/booking/${esc(b.ref)}/pay">إكمال الدفع</a></p>` : ''}
      <div class="grid2"><div class="box"><h3>${esc((I.isEn() && b.hotel_name_en || b.hotel_name))}</h3><p>${esc((I.isEn() && b.room_name_en || b.room_name))} × ${b.rooms}</p>
        <p>الوصول: <b>${fmtD(b.check_in)}</b><br><small class="muted">${hijri(b.check_in)}</small></p>
        <p>المغادرة: <b>${fmtD(b.check_out)}</b><br><small class="muted">${hijri(b.check_out)}</small></p><p>${b.nights} ليلة · ${b.guests} نزلاء</p></div>
        <div class="box"><h3>النزيل</h3><p>${esc(b.guest_name)}<br><span dir="ltr">${esc(b.phone)}</span></p>${b.nationality ? `<p>${esc(b.nationality)}</p>` : ''}${summaryMoney(b)}</div></div>
      <p class="muted">يُرجى إحضار هوية سارية عند تسجيل الدخول. ${esc(sx(s, 'agency_name'))} — ترخيص وزارة السياحة ${esc(s.tourism_license || '—')}${s.vat_number ? ' — الرقم الضريبي ' + esc(s.vat_number) : ''}</p>
      <p class="noprint"><button class="btn" data-print>طباعة / حفظ PDF</button> ${wa ? `<a class="btn ghost" href="${esc(wa)}" rel="noopener">تواصل عبر الواتساب</a>` : ''}
      ${['confirmed', 'pending', 'awaiting_transfer', 'pay_later', 'request'].includes(b.status) ? `<form method="post" action="/booking/${esc(b.ref)}/cancel" class="inline" data-confirm="هل تريد إلغاء الحجز؟">${csrf}<button class="btn danger">إلغاء الحجز</button></form>` : ''}</p></section>`,
    });
  },
  lookup({ err, csrf }) {
    return layout({ title: 'تتبّع حجزي', robots: 'noindex', body: `<section class="wrap narrow"><h1>تتبّع حجزي</h1>${err ? `<p class="alert">${esc(err)}</p>` : ''}
      <form method="post" action="/booking-lookup" class="form">${csrf}<label>رقم الحجز<input name="ref" required dir="ltr" placeholder="AS-XXXXXXXX" maxlength="20"></label>
      <label>رقم الجوال المستخدم في الحجز<input name="phone" required dir="ltr" inputmode="tel" maxlength="20"></label><button class="btn lg">عرض الحجز</button></form></section>` });
  },
  text(title, text, key) {
    const body = esc(text).split(/\n+/).map((p) => `<p>${p}</p>`).join('');
    return layout({ title, canonical: baseUrl() + '/' + key, body: `<section class="wrap narrow prose"><h1>${esc(title)}</h1>${body}</section>` });
  },
  notFound() { return layout({ title: 'غير موجود', robots: 'noindex', body: `<section class="wrap center"><h1>الصفحة غير موجودة</h1><p><a class="btn" href="/">العودة للرئيسية</a></p></section>` }); },
};

function extrasBlock(h) {
  let list; try { list = JSON.parse(h.extras || '[]'); } catch { list = []; }
  if (!list.length) return '';
  const m = Number(setting('markup_percent')) || 0;
  return `<div class="box extras"><h3>إضافات اختيارية</h3><ul>${list.map((x) => `<li>${esc(I.isEn() && x.en ? x.en : x.ar)}: <b>${sar(Math.ceil((x.cost * (100 + m)) / 100 - 1e-9))}</b></li>`).join('')}</ul><p class="muted">تُضاف إلى الإجمالي عند تأكيد الحجز${vatOn() ? '، شاملة الضريبة' : ''}.</p></div>`;
}
function roomRow(r, v, searched) {
  const meta = `${r.capacity} نزلاء كحدٍّ أقصى${r.breakfast ? ' · شامل الإفطار' : r.on_request ? ' · بدون وجبات' : ''}`;
  let action;
  if (!searched) action = '<span class="muted">اختر التواريخ لعرض السعر والتوفر</span>';
  else if (r.err) action = `<span class="soldout">${esc(r.err)}</span>`;
  else action = `<div class="priceb"><b>${sar(r.quote.total)}</b><small>الإجمالي لـ ${r.quote.nights} ليلة × ${v.rooms} غرفة · ${vatOn() ? 'شامل الضريبة' : 'السعر النهائي'}</small>
    <form method="get" action="/book">${hid(v)}<input type="hidden" name="room" value="${r.id}"><button class="btn">${r.on_request ? 'اطلب الحجز' : 'احجز'}</button></form>${r.on_request ? '<small class="warn">التأكيد بعد التحقق من التوفر</small>' : ''}${r.avail <= 3 ? `<small class="warn">متبقي ${r.avail} فقط</small>` : ''}</div>`;
  return `<div class="room"><div><h3>${esc(L(r, 'name'))}</h3><p class="muted">${meta}</p>${L(r, 'description') ? `<p>${esc(L(r, 'description'))}</p>` : ''}<p class="muted">السعر يبدأ من ${sar(r.base_price)} / الليلة</p></div>${action}</div>`;
}
function summaryMoney(b) {
  if (!vatOn()) return `<table class="money"><tr class="tot"><td>الإجمالي</td><td>${sar(b.total)}</td></tr></table>`;
  return `<table class="money"><tr><td>الصافي قبل الضريبة</td><td>${sar(b.total - b.vat)}</td></tr><tr><td>ضريبة القيمة المضافة ${esc(setting('vat_rate'))}%</td><td>${sar(b.vat)}</td></tr><tr class="tot"><td>الإجمالي</td><td>${sar(b.total)}</td></tr></table>`;
}
function summary(b) {
  return `<h3>ملخص الحجز</h3><p><b>${esc((I.isEn() && b.hotel_name_en || b.hotel_name))}</b><br>${esc((I.isEn() && b.room_name_en || b.room_name))} × ${b.rooms}</p><p>${fmtD(b.check_in)} ${I.isEn() ? '→' : '←'} ${fmtD(b.check_out)}<br>${b.nights} ليلة · ${b.guests} نزلاء</p>${summaryMoney(b)}`;
}

module.exports = { payBadges, govLogos, esc, sar, sarText, fmtD, layout, pages, STATUS_AR, policyText, waLink, baseUrl, fill, hid };
