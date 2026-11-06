'use strict';
// قاموس الترجمة العربية → الإنجليزية لواجهة الزوار. المفاتيح نصوص كاملة (بعد توحيد المسافات)،
// وPATTERNS للنصوص التي تحوي أرقامًا أو بيانات. أي نص عربي غير مترجم يكشفه `npm test`.
const s = (n, one, many) => `${n} ${Number(n) === 1 ? one : many}`;
const EXACT = {
  // التنقل والتذييل
  'الرئيسية': 'Home', 'الفنادق': 'Hotels', 'تتبّع حجزي': 'Track my booking', 'من نحن': 'About us', 'واتساب': 'WhatsApp',
  'بيانات المنشأة': 'Business details', 'روابط': 'Links', 'لم تُضف بعد': 'Not added yet',
  'ترخيص وزارة السياحة:': 'Ministry of Tourism license:', 'السجل التجاري:': 'Commercial Registration:', 'الرقم الضريبي:': 'VAT number:', 'توثيق المركز السعودي للأعمال:': 'Saudi Business Center certification:',
  'الشروط والأحكام': 'Terms & Conditions', 'سياسة الإلغاء والاسترداد': 'Cancellation & Refund Policy', 'سياسة الخصوصية': 'Privacy Policy', 'تتبّع الحجز': 'Track booking',
  'مدى': 'mada', 'وزارة السياحة': 'Ministry of Tourism', 'وزارة التجارة': 'Ministry of Commerce', 'ر.س': 'SAR',
  // الرئيسية
  'فندقك في مكة المكرمة، قريب من الحرم': 'Your hotel in Makkah, close to the Haram',
  'أسعار واضحة شاملة الضريبة': 'Clear VAT-inclusive prices', 'تأكيد فوري': 'Instant confirmation', 'دفع آمن': 'Secure payment', 'دعم عبر الواتساب': 'WhatsApp support',
  'فنادق مختارة': 'Featured hotels', 'لا توجد فنادق معروضة حاليًا.': 'No hotels are listed right now.', 'لا توجد نتائج.': 'No results.',
  'أسعار شاملة': 'All-inclusive prices', 'السعر النهائي شامل ضريبة القيمة المضافة 15%': 'The final price includes 15% VAT',
  'مدى وفيزا عبر بوابات دفع مرخّصة': 'mada and Visa via licensed payment gateways',
  'قسيمة فورية': 'Instant voucher', 'رقم حجز وقسيمة تأكيد بمجرد السداد': 'Booking number and confirmation voucher as soon as you pay',
  'جهة مرخّصة': 'Licensed agency', 'وكالة مرخّصة من وزارة السياحة': 'Agency licensed by the Ministry of Tourism',
  'احجز فندقك في مكة المكرمة بأسعار واضحة شاملة الضريبة، قريب من الحرم المكي، ودفع آمن عبر مدى وبطاقات الائتمان.': 'Book your hotel in Makkah at clear VAT-inclusive prices, close to the Holy Mosque, with secure payment by mada and credit cards.',
  'أسعار واضحة وشاملة': 'Clear all-inclusive prices', 'السعر المعروض هو السعر النهائي بالريال السعودي': 'The displayed price is the final price in Saudi Riyals', 'السعر النهائي': 'Final price',
  'تُضاف إلى الإجمالي عند تأكيد الحجز.': 'Added to the total when the booking is confirmed.',
  // البحث والفنادق
  'الوصول': 'Check-in', 'المغادرة': 'Check-out', 'عدد الغرف': 'Rooms', 'عدد النزلاء': 'Guests', 'ابحث عن غرفة': 'Search rooms',
  'فنادق مكة المكرمة': 'Makkah hotels', 'مكة المكرمة': 'Makkah', '← كل الفنادق': '← All hotels', 'إطلالة على الكعبة': 'Kaaba view',
  'ابتداءً من': 'From', '/ الليلة': '/ night', 'غير متاح في هذه التواريخ': 'Not available for these dates', 'شامل الضريبة': 'VAT included', 'شامل الإفطار': 'Breakfast included',
  'الغرف والأسعار': 'Rooms & prices', 'احجز': 'Book', 'اختر التواريخ لعرض السعر والتوفر': 'Choose dates to see price and availability', 'لا توجد غرف معروضة.': 'No rooms are listed.',
  'تاريخ غير صحيح': 'Invalid date', 'تاريخ الوصول يجب ألا يكون في الماضي': 'Check-in date cannot be in the past', 'تاريخ المغادرة يجب أن يكون بعد الوصول': 'Check-out must be after check-in',
  'أقصى مدة للحجز عبر الموقع 30 ليلة، تواصل معنا للمدد الأطول': 'The maximum online stay is 30 nights; contact us for longer stays',
  'غير متاح': 'Unavailable',
  // طلبات الحجز والأسعار المستوردة
  'توصيل للحرم': 'Shuttle to the Haram', 'اطلب الحجز': 'Request booking', 'إرسال طلب الحجز': 'Send booking request', 'التأكيد بعد التحقق من التوفر': 'Confirmed after availability check',
  'بدون وجبات': 'No meals', 'إضافات اختيارية': 'Optional extras', 'تُضاف إلى الإجمالي عند تأكيد الحجز، شاملة الضريبة.': 'Added to the total when the booking is confirmed, VAT included.',
  'بانتظار تأكيد التوفر': 'Awaiting availability confirmation', 'تم استلام طلب الحجز': 'Booking request received',
  'سنتحقق من توفر الغرف مع الفندق ونرسل لك رابط الدفع عبر الواتساب. يتأكد الحجز بعد السداد. لا يُسحب أي مبلغ قبل ذلك.': 'We will check room availability with the hotel and send you a payment link via WhatsApp. The booking is confirmed after payment. Nothing is charged before then.',
  'هذا طلب حجز: نتحقق من توفر الغرف مع الفندق ثم نرسل لك رابط الدفع عبر الواتساب. لا يُسحب أي مبلغ الآن.': 'This is a booking request: we check availability with the hotel, then send you a payment link via WhatsApp. Nothing is charged now.',
  'الأسعار غير متوفرة لهذه التواريخ — تواصل معنا': 'Prices are not available for these dates — please contact us',
  // الحجز
  'بيانات النزيل': 'Guest details', 'الاسم الكامل (كما في الهوية)': 'Full name (as on ID)', 'رقم الجوال (واتساب)': 'Mobile number (WhatsApp)', 'البريد الإلكتروني (اختياري)': 'Email (optional)',
  'الجنسية': 'Nationality', 'ملاحظات (اختياري)': 'Notes (optional)', 'أوافق على': 'I agree to the', 'و': ' and ', 'متابعة إلى الدفع': 'Continue to payment', 'ملخص الحجز': 'Booking summary',
  'اكتب الاسم الكامل': 'Please enter your full name', 'رقم الجوال غير صحيح': 'Invalid mobile number', 'البريد الإلكتروني غير صحيح': 'Invalid email address', 'يجب الموافقة على الشروط والأحكام': 'You must accept the terms and conditions',
  'نفدت الغرف لهذه التواريخ للتو': 'Rooms for these dates have just sold out', 'الغرفة غير موجودة': 'Room not found', 'اختر التواريخ أولًا': 'Please choose your dates first',
  'إتمام الحجز': 'Complete your booking',
  // المبالغ
  'الصافي قبل الضريبة': 'Net before VAT', 'الإجمالي': 'Total',
  // الدفع
  'الدفع': 'Payment', 'اختر طريقة الدفع': 'Choose a payment method', 'رقم الحجز:': 'Booking no.:', 'رقم الحجز': 'Booking number', '— الغرفة محجوزة لك مؤقتًا حتى إتمام الدفع.': '— The room is held for you temporarily until payment is complete.',
  'حوالة بنكية': 'Bank transfer', 'احجز الآن وادفع لاحقًا (تأكيد عبر الواتساب)': 'Book now, pay later (confirmation via WhatsApp)',
  'لا توجد وسيلة دفع مفعّلة حاليًا. تواصل معنا عبر الواتساب لإتمام الحجز.': 'No payment method is available right now. Contact us on WhatsApp to complete your booking.',
  '🔒 تتم معالجة بيانات البطاقة لدى بوابة الدفع مباشرة، ولا تمر عبر خوادمنا.': '🔒 Card details are processed directly by the payment gateway and never pass through our servers.',
  'تعذّر بدء الدفع الآن، حاول مجددًا أو اختر طريقة أخرى': 'Could not start payment right now. Try again or choose another method',
  'تعذّر بدء الدفع الآن، حاول مجددًا': 'Could not start payment right now. Please try again',
  'مدى / فيزا (ميسر)': 'mada / Visa (Moyasar)', 'مدى / فيزا (تاب)': 'mada / Visa (Tap)', 'مدى / فيزا (باي تابس)': 'mada / Visa (PayTabs)', 'دفع تجريبي (للاختبار فقط)': 'Test payment (testing only)',
  'جارٍ التحويل': 'Redirecting', 'جارٍ تحويلك إلى بوابة الدفع الآمنة…': 'Redirecting you to the secure payment gateway…', 'اضغط هنا إن لم يتم التحويل': 'Click here if you are not redirected',
  // القسيمة
  'بانتظار الدفع': 'Awaiting payment', 'بانتظار الحوالة': 'Awaiting transfer', 'حجز مبدئي': 'Provisional booking', 'مؤكد': 'Confirmed', 'ملغي': 'Cancelled', 'تم إلغاء الحجز': 'Booking cancelled',
  'بيانات الحوالة': 'Transfer details', 'المبلغ:': 'Amount:', '— اكتب رقم الحجز': '— write the booking number', 'في بيان الحوالة وأرسل صورة الإيصال عبر الواتساب.': 'in the transfer reference and send the receipt by WhatsApp.',
  'الآيبان:': 'IBAN:', 'إكمال الدفع': 'Complete payment', 'الوصول:': 'Check-in:', 'المغادرة:': 'Check-out:', 'النزيل': 'Guest',
  'طباعة / حفظ PDF': 'Print / Save PDF', 'تواصل عبر الواتساب': 'Contact via WhatsApp', 'إلغاء الحجز': 'Cancel booking', 'هل تريد إلغاء الحجز؟': 'Do you want to cancel this booking?',
  // التتبع والأخطاء
  'تتبّع حجزي ': 'Track my booking', 'رقم الجوال المستخدم في الحجز': 'Mobile number used for the booking', 'عرض الحجز': 'View booking', 'لم نجد حجزًا بهذه البيانات': "We couldn't find a booking with these details",
  'الصفحة غير موجودة': 'Page not found', 'العودة للرئيسية': 'Back to home', 'غير موجود': 'Not found', 'الرابط غير صالح أو انتهت صلاحيته': 'This link is invalid or has expired',
  // رابط الدفع
  'رابط دفع': 'Payment link', 'شامل ضريبة القيمة المضافة': 'VAT included', 'تم السداد بنجاح — شكرًا لك': 'Payment received — thank you',
  'الدفع الإلكتروني غير مفعّل حاليًا، تواصل معنا.': 'Online payment is not available right now, please contact us.',
};
const P = [
  [/^(.*?)(?:، ([\d,]+) م عن الحرم)?\. احجز الآن بسعر (?:شامل الضريبة|نهائي)\.$/, (a, d) => `${a}${d ? `, ${d} m from the Haram` : ''}. Book now at the final price.`],
  [/^([\d,]+) م عن الحرم$/, (d) => `${d} m from the Haram`],
  [/^السعر يبدأ من ([\d,]+)$/, (n) => `Price from ${n}`],
  [/^(\d+) نزلاء كحدٍّ أقصى$/, (n) => `Up to ${n} guests`],
  [/^الإجمالي لـ (\d+) ليلة × (\d+) غرفة$/, (n, r) => `Total for ${s(n, 'night', 'nights')} × ${s(r, 'room', 'rooms')}`],
  [/^متبقي (\d+) فقط$/, (n) => `Only ${n} left`],
  [/^متبقي (\d+) غرفة من هذا النوع لهذه التواريخ\.$/, (n) => `${s(n, 'room', 'rooms')} of this type left for these dates.`],
  [/^(\d+) ليلة$/, (n) => s(n, 'night', 'nights')], [/^(\d+) نزلاء$/, (n) => s(n, 'guest', 'guests')],
  [/^ضريبة القيمة المضافة (\d+)%$/, (n) => `VAT ${n}%`],
  [/^سعة الغرفة (\d+) نزلاء — زد عدد الغرف$/, (n) => `Room capacity is ${n} guests — add more rooms`],
  [/^متاح (\d+) غرفة فقط$/, (n) => `Only ${s(n, 'room', 'rooms')} available`],
  [/^ترخيص المنشأة الفندقية: (.*)$/, (a) => `Hotel license: ${a}`],
  [/^© (\d+) (.*) — جميع الأسعار بالريال السعودي( وشاملة ضريبة القيمة المضافة)?$/, (y, n, v) => `© ${y} ${n} — All prices are in Saudi Riyals${v ? ' and include VAT' : ''}`],
  [/^ادفع ([\d,]+) ر\.س — (.*)$/, (a, l) => `Pay ${a} SAR — ${l}`],
  [/^ادفع الآن — (.*)$/, (l) => `Pay now — ${l}`],
  [/^رابط دفع رقم (.*)$/, (c) => `Payment link no. ${c}`], [/^العميل: (.*)$/, (c) => `Customer: ${c}`],
  [/^البنك: (.*)$/, (c) => `Bank: ${c}`], [/^اسم المستفيد: (.*)$/, (c) => `Beneficiary: ${c}`],
  [/^تُحجز الغرفة لمدة (\d+) ساعة ثم يُلغى الحجز تلقائيًا إن لم تصل الحوالة\.$/, (h) => `The room is held for ${h} hours, then the booking is cancelled automatically if the transfer does not arrive.`],
  [/^الحجز (AS-[\w-]+)$/, (r) => `Booking ${r}`],
  [/^(.*) — ترخيص وزارة السياحة (.*?)(?: — الرقم الضريبي (.*))?$/, (a, l, v) => `${a} — Ministry of Tourism license ${l}${v ? ` — VAT no. ${v}` : ''}`],
  [/^يُرجى إحضار هوية سارية عند تسجيل الدخول\. (.*)$/, (rest) => `Please bring a valid ID at check-in. ${rest}`],
];
module.exports = { EXACT, PATTERNS: P };
