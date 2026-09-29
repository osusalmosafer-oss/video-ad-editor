# داشبورد انستقرام — أسس المسافر

مستقل تماماً عن `../tiktok-dashboard` (لا يشترك معه إلا في نسخة Chart.js المضمّنة).

- `instagram-dashboard.html`: الداشبورد النهائي. ملف واحد يعمل بدون إنترنت (Chart.js مضمّن؛ الخط من Google Fonts اختياري).
- `meta-criteria.md`: المصدر الأول — معايير ميتا المنقولة من ملف «Real Talk Creative Playbook» مع أرقام الصفحات، وما لا يغطيه الملف.
- `data/windsor_raw.py`: نتائج Windsor (موصّل `instagram`) كما رجعت، بلا تقدير. الكابشن مقطوع قبل الهاشتاقات.
- `data/build.py`: يبني `data/data.json` و `instagram-dashboard.html`. يحوي أيضاً التصنيف اليدوي لنمط كل ريل (A–E).
- `src/template.html`: القالب.

إعادة البناء بعد تحديث `windsor_raw.py`:

```bash
cd instagram-dashboard/data && python3 build.py
```

## حدود البيانات (مكتوبة أيضاً داخل الداشبورد)
- كل المنشورات المسحوبة (45) Reels؛ لا Carousel ولا صور ولا Stories، فلا توجد مقارنة بينها.
- `media_follows` و`media_profile_visits` فارغة للريلز.
- الجمهور والمتابعون الجدد اليومية: آخر 30 يوماً فقط (قيد من Windsor).
- ملف ميتا دليل إبداعي لإعلانات Reels: لا يتضمن حدود الفيروسية ولا أوقات النشر ولا مقارنة الأنواع.
