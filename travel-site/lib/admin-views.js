'use strict';
const { esc, sar, fmtD, layout, STATUS_AR, waLink } = require('./views');
const { DEFAULTS } = require('./db');
const { payBadges } = require('./views');

const A = (title, body) => layout({ title, body: `<section class="wrap">${body}</section>`, admin: true, robots: 'noindex,nofollow' });
const val = (o, k) => esc(o && o[k] != null ? o[k] : '');
const chk = (o, k) => (o && o[k] ? 'checked' : '');

module.exports = {
  login(err, csrf) {
    return layout({ title: 'دخول الإدارة', robots: 'noindex,nofollow', admin: true, body: `<section class="wrap narrow"><h1>دخول الإدارة</h1>${err ? `<p class="alert">${esc(err)}</p>` : ''}
    <form method="post" action="/admin/login" class="form">${csrf}<label>كلمة المرور<input type="password" name="password" required autocomplete="current-password"></label><button class="btn lg">دخول</button></form></section>` }).replace('__CSRF__', '');
  },
  bookings({ rows, stats, filter }) {
    const tabs = [['', 'الكل'], ['confirmed', 'مؤكدة'], ['pending', 'بانتظار الدفع'], ['awaiting_transfer', 'بانتظار الحوالة'], ['pay_later', 'دفع لاحقًا'], ['cancelled', 'ملغاة']];
    return A('الحجوزات', `<h1>الحجوزات</h1>
    <div class="stats"><div><b>${stats.confirmed}</b><span>حجوزات مؤكدة</span></div><div><b>${sar(stats.revenue)}</b><span>إيراد المؤكد</span></div><div><b>${stats.open}</b><span>بانتظار إجراء</span></div></div>
    <p class="tabs">${tabs.map(([k, l]) => `<a class="${filter === k ? 'on' : ''}" href="/admin?status=${k}">${l}</a>`).join('')}</p>
    <div class="tablewrap"><table class="t"><tr><th>الحجز</th><th>النزيل</th><th>الفندق</th><th>الوصول</th><th>الإجمالي</th><th>الحالة</th></tr>
    ${rows.map((b) => `<tr><td><a href="/admin/bookings/${b.id}">${esc(b.ref)}</a><br><small class="muted">${esc(b.created_at.slice(0, 16))}</small></td><td>${esc(b.guest_name)}<br><small dir="ltr">${esc(b.phone)}</small></td><td>${esc(b.hotel_name)}<br><small>${esc(b.room_name)} × ${b.rooms}</small></td><td>${fmtD(b.check_in)}<br><small>${b.nights} ليلة</small></td><td>${sar(b.total)}</td><td><span class="pill s-${b.status}">${esc(STATUS_AR[b.status] || b.status)}</span></td></tr>`).join('') || '<tr><td colspan="6" class="muted">لا توجد حجوزات</td></tr>'}</table></div>`);
  },
  booking({ b, payments, csrf }) {
    const wa = waLink('').replace(/\?text=.*/, '');
    const guestWa = `https://wa.me/${String(b.phone).replace(/\D/g, '').replace(/^0/, '966')}?text=${encodeURIComponent(`السلام عليكم ${b.guest_name}، بخصوص حجزك رقم ${b.ref} في ${b.hotel_name}`)}`;
    return A('حجز ' + b.ref, `<p><a href="/admin">← الحجوزات</a></p><h1>${esc(b.ref)} <span class="pill s-${b.status}">${esc(STATUS_AR[b.status] || b.status)}</span></h1>
    <div class="grid2"><div class="box"><h3>${esc(b.hotel_name)}</h3><p>${esc(b.room_name)} × ${b.rooms} · ${b.guests} نزلاء</p><p>${fmtD(b.check_in)} ← ${fmtD(b.check_out)} (${b.nights} ليلة)</p><p>الإجمالي: <b>${sar(b.total)}</b> (الضريبة ${sar(b.vat)})</p><p>طريقة الدفع: ${esc(b.pay_method || '—')} ${b.paid_at ? '· ' + esc(b.paid_at.slice(0, 16)) : ''}</p></div>
    <div class="box"><h3>النزيل</h3><p>${esc(b.guest_name)}<br><span dir="ltr">${esc(b.phone)}</span><br>${esc(b.email || '')}<br>${esc(b.nationality || '')}</p><p>${esc(b.notes || '')}</p><p><a class="btn sm wa" href="${esc(guestWa)}" target="_blank" rel="noopener">مراسلة النزيل واتساب</a> <a class="btn sm ghost" href="/booking/${esc(b.ref)}" target="_blank">القسيمة</a> <a class="btn sm" href="/admin/links?${new URLSearchParams({ ref: b.ref, amount: b.total, name: b.guest_name, phone: b.phone, desc: 'حجز ' + b.ref + ' - ' + b.hotel_name }).toString()}">إنشاء رابط دفع</a></p></div></div>
    <form method="post" action="/admin/bookings/${b.id}" class="form box">${csrf}<label>الحالة<select name="status">${Object.entries(STATUS_AR).map(([k, l]) => `<option value="${k}" ${b.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>ملاحظة داخلية<textarea name="admin_note" rows="3">${esc(b.admin_note || '')}</textarea></label><button class="btn">حفظ</button> <small class="muted">«مؤكد» يدويًا يُستخدم عند وصول الحوالة أو الدفع في المكتب.</small></form>
    <h3>سجل الدفعات</h3><table class="t"><tr><th>البوابة</th><th>المعرّف</th><th>المبلغ</th><th>الحالة</th><th>الوقت</th></tr>${payments.map((p) => `<tr><td>${esc(p.provider)}</td><td dir="ltr">${esc(p.provider_ref)}</td><td>${sar(p.amount)}</td><td>${esc(p.status)}</td><td>${esc(p.created_at)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">لا يوجد</td></tr>'}</table>`);
  },
  links({ rows, pre, base, csrf, gateways }) {
    const wa = (l) => `https://wa.me/${String(l.phone || '').replace(/\D/g, '').replace(/^0/, '966')}?text=${encodeURIComponent(`السلام عليكم${l.customer_name ? ' ' + l.customer_name : ''}، رابط الدفع (${l.description}) بمبلغ ${l.amount} ر.س:\n${base}/pay/l/${l.token}`)}`;
    return A('روابط الدفع', `<h1>روابط الدفع</h1><p class="muted">أنشئ رابطًا بمبلغ محدد وأرسله للعميل (واتساب/رسالة) ليدفع بمدى أو فيزا. ${gateways.length ? '' : '<b class="warn">لا توجد بوابة دفع مفعّلة بعد.</b>'}</p>
    <form method="post" action="/admin/links" class="form box">${csrf}<div class="row"><label>المبلغ (ر.س شامل الضريبة)<input name="amount" type="number" min="1" required value="${esc(pre.amount)}"></label>
    <label>صلاحية الرابط (ساعة)<input name="hours" type="number" min="1" max="720" value="72"></label></div>
    <label>البيان (يراه العميل)<input name="description" required maxlength="150" value="${esc(pre.desc)}" placeholder="دفعة حجز فندق مكة"></label>
    <div class="row"><label>اسم العميل<input name="customer_name" maxlength="80" value="${esc(pre.name)}"></label><label>جوال العميل<input name="phone" dir="ltr" maxlength="20" value="${esc(pre.phone)}"></label>
    <label>رقم الحجز المرتبط (اختياري)<input name="booking_ref" dir="ltr" maxlength="20" value="${esc(pre.ref)}"></label></div><button class="btn">إنشاء الرابط</button></form>
    <div class="tablewrap"><table class="t"><tr><th>الرمز</th><th>البيان</th><th>المبلغ</th><th>الحالة</th><th>الرابط</th><th></th></tr>
    ${rows.map((l) => `<tr><td>${esc(l.code)}${l.booking_ref ? `<br><small>${esc(l.booking_ref)}</small>` : ''}</td><td>${esc(l.description)}<br><small>${esc(l.customer_name || '')}</small></td><td>${sar(l.amount)}</td><td><span class="pill s-${l.status === 'paid' ? 'confirmed' : 'pending'}">${l.status === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}</span><br><small>ينتهي ${esc((l.expires_at || '').slice(0, 16))}</small></td>
    <td><input readonly dir="ltr" value="${esc(base)}/pay/l/${esc(l.token)}" data-select> ${l.status !== 'paid' ? `<a class="btn sm wa" href="${esc(wa(l))}" target="_blank" rel="noopener">إرسال واتساب</a>` : ''}</td>
    <td>${l.status !== 'paid' ? `<form method="post" action="/admin/links/${l.id}/delete" data-confirm="حذف الرابط؟">${csrf}<button class="linkbtn">حذف</button></form>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">لا توجد روابط</td></tr>'}</table></div>`);
  },
  hotels({ rows, csrf }) {
    return A('الفنادق', `<h1>الفنادق</h1><p><a class="btn" href="/admin/hotels/new">+ فندق جديد</a></p><div class="tablewrap"><table class="t"><tr><th>الفندق</th><th>النجوم</th><th>البعد عن الحرم</th><th>الغرف</th><th>الحالة</th><th></th></tr>
    ${rows.map((h) => `<tr><td>${esc(h.name)}</td><td>${h.stars}</td><td>${h.distance_m ?? '—'} م</td><td>${h.rooms}</td><td>${h.is_active ? 'معروض' : 'مخفي'}</td><td><a href="/admin/hotels/${h.id}">تعديل</a></td></tr>`).join('') || '<tr><td colspan="6" class="muted">أضف أول فندق</td></tr>'}</table></div>`);
  },
  hotelForm({ h, images, rooms, rates, csrf, err }) {
    const isNew = !h || !h.id;
    const f = h || { stars: 4, is_active: 1 };
    let html = `<p><a href="/admin/hotels">← الفنادق</a></p><h1>${isNew ? 'فندق جديد' : esc(f.name)}</h1>${err ? `<p class="alert">${esc(err)}</p>` : ''}
    <form method="post" action="/admin/hotels${isNew ? '' : '/' + f.id}" class="form box" enctype="multipart/form-data">${csrf}
    <label>اسم الفندق<input name="name" required maxlength="120" value="${val(f, 'name')}"></label>
    <div class="row"><label>النجوم<select name="stars">${[1, 2, 3, 4, 5].map((n) => `<option ${Number(f.stars) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>الحي<input name="district" maxlength="60" value="${val(f, 'district')}"></label>
    <label>البعد عن الحرم (متر)<input name="distance_m" type="number" min="0" value="${val(f, 'distance_m')}"></label></div>
    <label>العنوان<input name="address" maxlength="200" value="${val(f, 'address')}"></label>
    <fieldset class="box"><legend>النسخة الإنجليزية (تظهر لمن يختار English)</legend>
    <div class="row"><label>Name<input name="name_en" dir="ltr" maxlength="120" value="${val(f, 'name_en')}"></label><label>District<input name="district_en" dir="ltr" maxlength="60" value="${val(f, 'district_en')}"></label></div>
    <label>Address<input name="address_en" dir="ltr" maxlength="200" value="${val(f, 'address_en')}"></label>
    <label>Description<textarea name="description_en" dir="ltr" rows="3" maxlength="2000">${val(f, 'description_en')}</textarea></label>
    <label>Amenities (comma-separated)<input name="amenities_en" dir="ltr" maxlength="500" value="${val(f, 'amenities_en')}" placeholder="Free Wi-Fi, Prayer room, Parking"></label></fieldset>
    <label>الوصف<textarea name="description" rows="4" maxlength="2000">${val(f, 'description')}</textarea></label>
    <label>المرافق (افصل بفاصلة)<input name="amenities" maxlength="500" value="${val(f, 'amenities')}" placeholder="واي فاي، مصلى، مواقف، مطعم"></label>
    <label>رقم ترخيص المنشأة الفندقية (وزارة السياحة)<input name="license_no" maxlength="60" value="${val(f, 'license_no')}"></label>
    <label class="check"><input type="checkbox" name="kaaba_view" value="1" ${chk(f, 'kaaba_view')}> إطلالة على الكعبة</label>
    <label class="check"><input type="checkbox" name="is_active" value="1" ${chk(f, 'is_active')}> معروض في الموقع</label>
    <label>صور الفندق (JPG/PNG/WebP — الأولى للغلاف)<input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple></label>
    <button class="btn lg">حفظ</button></form>`;
    if (!isNew) {
      html += `<h3>الصور</h3><div class="thumbs">${images.map((i) => `<form method="post" action="/admin/images/${i.id}/delete" data-confirm="حذف الصورة؟">${csrf}<img src="/uploads/${esc(i.filename)}" alt=""><button class="linkbtn">حذف</button></form>`).join('') || '<p class="muted">لا توجد صور</p>'}</div>
      <h3>أنواع الغرف</h3>${rooms.map((r) => roomForm(r, f.id, csrf, rates.filter((x) => x.room_type_id === r.id))).join('')}
      <h4>+ نوع غرفة جديد</h4>${roomForm(null, f.id, csrf, [])}
      <form method="post" action="/admin/hotels/${f.id}/delete" data-confirm="حذف الفندق نهائيًا مع غرفه؟ (لا يؤثر على الحجوزات السابقة)" class="danger-zone">${csrf}<button class="btn danger">حذف الفندق</button></form>`;
    }
    return A(isNew ? 'فندق جديد' : f.name, html);
  },
  settings({ s, csrf, saved, methods, notif }) {
    const I = (k, label, extra = '') => `<label>${label}<input name="${k}" value="${esc(s[k])}" ${extra}></label>`;
    const T = (k, label, ph) => `<label>${label}<textarea name="${k}" rows="6" placeholder="${esc(ph)}">${esc(s[k])}</textarea></label>`;
    return A('الإعدادات', `<h1>الإعدادات</h1>${saved ? '<p class="alert info">تم الحفظ</p>' : ''}
    <form method="post" action="/admin/settings" class="form">${csrf}
    <fieldset class="box"><legend>بيانات الوكالة والتراخيص (تظهر في تذييل الموقع وعلى القسيمة)</legend>
    ${I('agency_name', 'اسم الوكالة')}${I('agency_tagline', 'وصف مختصر')}${I('tourism_license', 'رقم ترخيص وزارة السياحة')}${I('cr_number', 'رقم السجل التجاري')}${I('vat_number', 'الرقم الضريبي')}
    ${I('sbc_cert_no', 'رقم/معرّف توثيق المركز السعودي للأعمال')}${I('sbc_cert_url', 'رابط صفحة التوثيق (https://…)', 'dir="ltr"')}
    ${I('agency_name_en', 'Agency name (EN)', 'dir="ltr"')}${I('agency_tagline_en', 'Tagline (EN)', 'dir="ltr"')}${I('address_en', 'Address (EN)', 'dir="ltr"')}
    ${I('address', 'العنوان')}${I('phone', 'الهاتف', 'dir="ltr"')}${I('whatsapp', 'واتساب بصيغة دولية 9665xxxxxxxx', 'dir="ltr"')}${I('email', 'البريد', 'dir="ltr"')}</fieldset>
    <fieldset class="box"><legend>الأسعار والحجز</legend>${I('vat_rate', 'نسبة ضريبة القيمة المضافة %', 'type="number" min="0" max="30"')}${I('hold_minutes', 'مدة حجز الغرفة أثناء الدفع الإلكتروني (دقيقة)', 'type="number" min="10" max="240"')}${I('cancel_free_hours', 'الإلغاء المجاني قبل الوصول بـ (ساعة)', 'type="number" min="0"')}</fieldset>
    <fieldset class="box"><legend>طرق الدفع</legend>
    <p>البوابات الإلكترونية المفعّلة (تُفعَّل بإضافة المفاتيح في متغيرات البيئة على الخادم، راجع README): <b>${methods.length ? methods.map((m) => esc(m.label)).join('، ') : 'لا شيء بعد'}</b></p>
    <p>مدى وفيزا: يظهر خيار البطاقات من البوابة المفعّلة. لحصر الوسائل على مدى وفيزا فقط عطّل غيرها من لوحة البوابة نفسها.</p>
    <p>إشعارات الحجز الجديد — بريد: <b>${notif.email ? 'مفعّل' : 'غير مفعّل'}</b> · واتساب: <b>${notif.whatsapp ? (notif.template ? 'مفعّل (قالب)' : 'مفعّل (نص)') : 'غير مفعّل'}</b></p>
    <label class="check"><input type="checkbox" name="enable_bank_transfer" value="1" ${s.enable_bank_transfer === '1' ? 'checked' : ''}> تفعيل الحوالة البنكية</label>
    ${I('bank_name', 'اسم البنك')}${I('bank_holder', 'اسم المستفيد')}${I('bank_iban', 'الآيبان', 'dir="ltr"')}${I('transfer_hold_hours', 'مدة حجز الغرفة بانتظار الحوالة (ساعة)', 'type="number" min="1" max="168"')}
    <label class="check"><input type="checkbox" name="enable_pay_later" value="1" ${s.enable_pay_later === '1' ? 'checked' : ''}> السماح بـ«احجز وادفع لاحقًا» (تأكيد يدوي)</label></fieldset>
    <fieldset class="box"><legend>النصوص النظامية (اتركها فارغة لاستخدام النص الافتراضي)</legend>${T('policy_terms', 'الشروط والأحكام', 'النص الافتراضي')}${T('policy_cancel', 'سياسة الإلغاء والاسترداد', 'النص الافتراضي')}${T('policy_privacy', 'سياسة الخصوصية', 'النص الافتراضي')}${T('about_text', 'من نحن', 'النص الافتراضي')}</fieldset>
    <fieldset class="box"><legend>النصوص بالإنجليزية (اتركها فارغة لاستخدام النص الإنجليزي الافتراضي)</legend>${T('policy_terms_en', 'Terms (EN)', 'Default')}${T('policy_cancel_en', 'Cancellation (EN)', 'Default')}${T('policy_privacy_en', 'Privacy (EN)', 'Default')}${T('about_text_en', 'About (EN)', 'Default')}</fieldset>
    <button class="btn lg">حفظ الإعدادات</button></form>
    <div class="box"><h3>كلمة المرور</h3><p class="muted">كلمة مرور الإدارة تأتي من متغير البيئة ADMIN_PASSWORD؛ لتغييرها عدّله على الخادم وأعد التشغيل.</p></div>`);
  },
  compliance({ items }) {
    return A('الامتثال', `<h1>قائمة الامتثال قبل الإطلاق</h1><p class="muted">قائمة مرجعية عامة للمساعدة. المتطلبات الرسمية تُؤكَّد من وزارة السياحة والمركز السعودي للأعمال وهيئة الزكاة والضريبة والجمارك، ومن مستشار قانوني.</p>
    <ul class="check-list">${items.map((i) => `<li class="${i.ok ? 'ok' : 'no'}"><b>${i.ok ? '✓' : '✗'}</b> ${esc(i.label)}${i.hint ? `<small>${esc(i.hint)}</small>` : ''}</li>`).join('')}</ul>`);
  },
};

function roomForm(r, hid, csrf, rates) {
  const f = r || { capacity: 2, total_rooms: 1, is_active: 1 };
  return `<form method="post" action="/admin/hotels/${hid}/rooms${r ? '/' + r.id : ''}" class="form box">${csrf}
  <div class="row"><label>الاسم<input name="name" required maxlength="80" value="${val(f, 'name')}" placeholder="غرفة مزدوجة / ثلاثية / رباعية"></label>
  <label>السعة<input name="capacity" type="number" min="1" max="20" value="${val(f, 'capacity')}"></label>
  <label>عدد الغرف المتاحة للبيع<input name="total_rooms" type="number" min="0" max="500" value="${val(f, 'total_rooms')}"></label>
  <label>السعر الأساسي / الليلة (ر.س شامل الضريبة)<input name="base_price" type="number" min="1" required value="${val(f, 'base_price')}"></label></div>
  <label>وصف<input name="description" maxlength="300" value="${val(f, 'description')}"></label>
  <div class="row"><label>Room name (EN)<input name="name_en" dir="ltr" maxlength="80" value="${val(f, 'name_en')}" placeholder="Double room"></label><label>Description (EN)<input name="description_en" dir="ltr" maxlength="300" value="${val(f, 'description_en')}"></label></div>
  <label class="check"><input type="checkbox" name="breakfast" value="1" ${chk(f, 'breakfast')}> شامل الإفطار</label>
  <label class="check"><input type="checkbox" name="is_active" value="1" ${chk(f, 'is_active')}> معروض</label>
  <button class="btn sm">${r ? 'حفظ' : 'إضافة'}</button></form>
  ${r ? `<div class="rates"><b>أسعار المواسم لهذه الغرفة:</b>${rates.map((x) => `<form method="post" action="/admin/rates/${x.id}/delete" class="inline">${csrf}<span>${esc(x.from_date)} → ${esc(x.to_date)}: ${sar(x.price)} ${esc(x.label || '')}</span> <button class="linkbtn">حذف</button></form>`).join('') || ' <span class="muted">لا يوجد</span>'}
  <form method="post" action="/admin/rooms/${r.id}/rates" class="row inlineform">${csrf}<input type="date" name="from_date" required><input type="date" name="to_date" required><input type="number" name="price" min="1" placeholder="السعر/الليلة" required><input name="label" placeholder="مثال: رمضان" maxlength="40"><button class="btn sm">+ سعر موسم</button></form></div>` : ''}`;
}
