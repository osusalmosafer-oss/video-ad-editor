// ── خطة المشاهد — كل الأوقات بثواني على تايم-لاين الفيديو الأصلي (0 .. 37.60)
window.SRC_END = 37.60;
window.OUTRO   = 5.60;
window.TOTAL   = window.SRC_END + window.OUTRO;

// نبضات الإيقاع: لحظة القطع/الانتقال (زوم بانش + كشيدة زرقاء)
window.BEATS = [
  {t: 6.25, sweep: true,  dir: 1},
  {t:11.00, sweep: true,  dir:-1},
  {t:15.60, sweep: false, dir: 1},
  {t:17.90, sweep: false, dir:-1},
  {t:20.80, sweep: true,  dir: 1},
  {t:25.40, sweep: false, dir:-1},
  {t:29.20, sweep: false, dir: 1},
  {t:32.40, sweep: true,  dir:-1},
  {t:34.90, sweep: false, dir: 1},
  {t:37.60, sweep: true,  dir: 1}
];

window.SCENES = {
  title: {s: 0.30, e: 5.40},

  // «انتبه» — عند لحظة إشارته لبرج الفندق
  alert: {s: 6.25, e: 9.10, x: 250, y: 330, w: 780, h: 236},

  // «وهذا موقعه على الخريطة» — المرة الأولى: دبل تري جبل عمر
  map1:  {s:11.00, e:15.55, img:'assets/map_jabalomar.png',
          x: 530, y: 240, w: 480, h: 853,  from:[300,1210]},

  // المرة الثانية: دبل تري العزيزية
  map2:  {s:20.80, e:25.35, img:'assets/map_aziziyah.png',
          x: 530, y: 240, w: 480, h: 853,  from:[330,1240]},

  // «لحجز هذا أو هذا» — الإشارة الأولى (جبل عمر) ثم الثانية جهة اليسار (العزيزية)
  book1: {s:32.40, e:37.60, img:'assets/hotel_jabalomar.jpg', label:'دبل تري جبل عمر',
          x: 566, y: 556, w: 444, h: 444},
  book2: {s:34.90, e:37.60, img:'assets/hotel_aziziyah.jpg',  label:'دبل تري العزيزية',
          x:  70, y: 556, w: 444, h: 444}
};

window.TEXTS = {
  titleTop: 'دبل تري من هيلتون',
  titleSub: 'مكة المكرمة · فندقان بموقعين مختلفين',
  alert:    'انتبه',
  ctaTop:   'للحجز والاستفسار',
  phone:    '+966 56 640 3939',
  phoneRaw: '+966566403939',
  wa:       'واتساب'
};
