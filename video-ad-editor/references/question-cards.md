# بطاقات «أسئلة من التعليقات» فوق الفيديو
السكربت: `scripts/17_question_cards.py فيديو.mp4 cards.json خرج.mp4`
البطاقات الشفافة جاهزة في `asas-agency-manager/brand-kit/question-card/` (مجلدات luggage وdoors وbuses وtoday، الملفات `*_video-overlay.png`).
مثال cards.json:
[{"png":"l2_video-overlay.png","start":2.0,"dur":3.0},{"png":"l1_video-overlay.png","start":14.5,"dur":3.0}]
- start ثانية الظهور، dur المدة (3 ثواني مناسبة)، تدخل وتخرج بتلاشٍ ربع ثانية.
- تتمدد البطاقة لحجم الفيديو تلقائياً (جُرّب على 2160x3840).
- الصوت يبقى كما هو. شغّله بعد الكابشن والمؤثرات وقبل التصدير النهائي إن كان الخط يعيد ترميز الفيديو.
