# سورة البيّنة — القارئ محمد اللحيدان

تصميم عمودي 1080×1920: نص الآيات من حزمة `quran-json` (منسوخ آلياً، بلا تعديل يدوي)، وخط أميري قرآن.

```bash
pip install playwright
python3 make_video.py recitation.mp3 bayyinah.mp4            # فواصل الآيات تُكتشف من السكتات
python3 make_video.py recitation.mp3 bayyinah.mp4 --timings timings.json   # أو توقيت يدوي [[بداية,نهاية]]×8
```
- ملف التلاوة لازم يوفّره المستخدم (بيئة الجلسة تحجب مواقع التلاوات).
- تمييز الكلمات تقريبي (يتوزع بحسب عدد الحروف داخل الآية)، لا توقيت كلمة بكلمة.
- `design-preview.png` معاينة التصميم.
