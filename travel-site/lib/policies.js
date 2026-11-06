'use strict';
// نصوص افتراضية للسياسات. يمكن تعديلها من لوحة الإدارة → الإعدادات. يُنصح بمراجعتها مع مستشار قانوني قبل الإطلاق.
const EN = {
  terms: `1. Definitions: "the Agency" is {agency}, Ministry of Tourism license no. {license}, Commercial Registration no. {cr}.
2. Service: the Agency is an intermediary for hotel bookings in Makkah. Hotel services are provided by the booked hotel.
3. Prices: all prices are in Saudi Riyals (SAR){vat}. The final total is shown before you confirm.
4. Confirmation: a booking is confirmed once full payment (or the bank transfer) is received and a booking number and voucher are issued.
5. Guest details: the guest must provide accurate information and present a valid ID (national ID / iqama / passport) at check-in.
6. Check-in and check-out: according to the hotel's policy, as stated on the booking voucher.
7. Cancellation and changes: per the Cancellation and Refund Policy.
8. Liability: the Agency is not liable for delays caused by circumstances beyond its control and will assist the guest with any issue with the hotel.
9. Governing law: these terms are governed by the laws of the Kingdom of Saudi Arabia and disputes fall under the competent Saudi authorities.
10. Complaints: contact us through the details on the site; you may also file a complaint with the Ministry of Tourism through its official channels.`,
  privacy: `We comply with the Saudi Personal Data Protection Law.
• Data we collect: name, mobile number, email (optional), nationality and booking details.
• Purposes: to fulfil your booking, contact you about it, issue invoices and vouchers, and comply with regulations.
• Sharing: we share necessary guest details with the booked hotel and with the payment gateway to complete the transaction only. We never sell your data.
• Card data: processed entirely by the licensed payment gateway; it never passes through or is stored on our servers.
• Retention: we keep data for the period required by law, then delete it.
• Your rights: access, correct or request deletion of your data by contacting us.
• Cookies: we use only technical cookies necessary to run and protect the site.`,
  cancel: `• Free cancellation: {hours} hours or more before arrival, with a full refund to the original payment method within the period set by banks (usually 5 to 14 business days).
• Later cancellation: at least one night may be charged, per the hotel's policy.
• No-show: no refund.
• Changes: subject to availability and any price difference; contact us before arrival.
• Bank transfer: the room and price are held for a limited time and the booking is cancelled automatically if the transfer does not arrive.
• Refunds are made only to the original payment method.`,
  about: `{agency} is a Saudi travel and tourism agency specialised in Makkah hotel bookings for Umrah pilgrims, focusing on proximity to the Holy Mosque and pilgrim comfort, with clear VAT-inclusive prices and direct support via WhatsApp.`,
};
module.exports.EN = EN;
module.exports = Object.assign(module.exports, {
  terms: `1. التعريف: «الوكالة» هي {agency}، ترخيص وزارة السياحة رقم {license}، سجل تجاري رقم {cr}.
2. الخدمة: الوكالة وسيط حجوزات فندقية في مكة المكرمة، وتتم الخدمة الفندقية من قِبل الفندق المحجوز.
3. الأسعار: جميع الأسعار المعروضة بالريال السعودي{vat}، ويظهر الإجمالي النهائي قبل تأكيد الحجز.
4. تأكيد الحجز: يُعدّ الحجز مؤكدًا بعد سداد المبلغ كاملًا (أو اعتماد الحوالة البنكية) وصدور رقم الحجز وقسيمة التأكيد.
5. بيانات النزيل: على العميل إدخال بيانات صحيحة، وتقديم هوية سارية (هوية وطنية/إقامة/جواز سفر) عند تسجيل الدخول للفندق.
6. تسجيل الدخول والمغادرة: وفق نظام الفندق المحجوز، ويُحدَّد الوقت في قسيمة الحجز.
7. الإلغاء والتعديل: وفق «سياسة الإلغاء والاسترداد».
8. المسؤولية: لا تتحمل الوكالة مسؤولية التأخر الناتج عن ظروف خارجة عن إرادتها، وتلتزم بمساعدة العميل في حل أي مشكلة مع الفندق.
9. الاختصاص: تخضع هذه الشروط لأنظمة المملكة العربية السعودية، والجهة المختصة بنظر النزاعات هي الجهات القضائية في المملكة.
10. الشكاوى: يمكن التواصل معنا عبر بيانات الاتصال في الموقع، كما يحق للعميل رفع شكواه لوزارة السياحة عبر قنواتها الرسمية.`,

  privacy: `نلتزم بنظام حماية البيانات الشخصية في المملكة العربية السعودية.
• البيانات التي نجمعها: الاسم، رقم الجوال، البريد الإلكتروني (اختياري)، الجنسية، وتفاصيل الحجز.
• أغراض الاستخدام: تنفيذ الحجز والتواصل معك بشأنه وإصدار الفواتير والقسائم، والالتزام بالأنظمة.
• المشاركة: نشارك بيانات النزيل الضرورية مع الفندق المحجوز، ومع بوابة الدفع لإتمام العملية فقط. لا نبيع بياناتك.
• بيانات البطاقة: تتم معالجتها بالكامل لدى بوابة الدفع المرخّصة ولا تمر عبر خوادمنا ولا نخزنها.
• الاحتفاظ: نحتفظ بالبيانات للمدة اللازمة نظامًا ثم نحذفها.
• حقوقك: الاطلاع على بياناتك وتصحيحها وطلب إتلافها بالتواصل معنا عبر بيانات الاتصال.
• ملفات الارتباط: نستخدم ملفات ارتباط تقنية ضرورية فقط لتشغيل الموقع وحمايته.`,

  cancel: `• الإلغاء المجاني: قبل موعد الوصول بـ {hours} ساعة أو أكثر، ويُسترد المبلغ كاملًا إلى وسيلة الدفع نفسها خلال مدة تحددها البنوك (عادةً من 5 إلى 14 يوم عمل).
• الإلغاء بعد ذلك: قد تُخصم ليلة واحدة على الأقل، وفق سياسة الفندق المحجوز.
• عدم الحضور: لا يُسترد المبلغ.
• التعديل: يخضع للتوفر وفرق السعر، ويتم بالتواصل معنا قبل الوصول.
• الحوالة البنكية: يُحجز لك السعر والغرفة لمدة محدودة ويُلغى الحجز تلقائيًا إن لم تصل الحوالة.
• استرداد المبلغ لا يتم عبر طريقة مختلفة عن طريقة الدفع الأصلية.`,

  about: `{agency} وكالة سفر وسياحة سعودية متخصصة في حجوزات فنادق مكة المكرمة للمعتمرين، تركّز على القرب من الحرم المكي وراحة المعتمر، وتقدّم أسعارًا واضحة شاملة الضريبة ودعمًا مباشرًا عبر الواتساب.`,
});
