# داشبورد تيك توك — أسس المسافر

- `tiktok-dashboard.html`: الداشبورد النهائي. ملف واحد يعمل بدون إنترنت (Chart.js مضمّن داخله).
- `tiktok-criteria.md`: ملف معايير تيك توك (المصدر الأول)، من مواقع تيك توك الرسمية.
- `data/raw/*.json`: نتائج Windsor (tiktok_organic) كما هي بدون تعديل.
- `data/daily.py`: بيانات الحساب اليومية.
- `src/template.html`: قالب الداشبورد.

إعادة البناء بعد تحديث ملفات `data/raw`:

```bash
cd tiktok-dashboard/data && python3 build.py
```
