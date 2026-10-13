// أغلفة الهايلايت 1080x1920 (المنطقة الآمنة: دائرة في الوسط). تشغيل: NODE_PATH=... node build.js
const {chromium}=require('playwright-core');const fs=require('fs'),path=require('path');
const S='stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const A='stroke="#2884FF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const icons={
 hotels:`<g ${S}><rect x="70" y="40" width="140" height="200" rx="6"/><path d="M40 240h200"/></g><g ${A}><path d="M105 85h12M143 85h12M105 125h12M143 125h12M105 165h12M143 165h12"/><path d="M125 240v-40"/></g>`,
 haram:`<g ${S}><rect x="60" y="70" width="160" height="160" rx="6"/><path d="M60 110h160"/></g><g ${A}><path d="M100 230v-60a40 40 0 0 1 80 0v60"/><path d="M60 70l20-30h120l20 30"/></g>`,
 luggage:`<g ${S}><rect x="55" y="80" width="170" height="150" rx="22"/><path d="M105 80V55a14 14 0 0 1 14-14h42a14 14 0 0 1 14 14v25"/></g><g ${A}><path d="M105 125v70M175 125v70"/></g>`,
 questions:`<g ${S}><path d="M50 60h180a15 15 0 0 1 15 15v110a15 15 0 0 1-15 15H125l-45 40v-40H50a15 15 0 0 1-15-15V75a15 15 0 0 1 15-15z"/></g><g ${A}><path d="M115 110a25 25 0 1 1 33 24c-8 4-8 10-8 18"/><path d="M140 178h.5"/></g>`,
 book:`<g ${S}><rect x="50" y="60" width="180" height="170" rx="18"/><path d="M50 110h180M100 40v40M180 40v40"/></g><g ${A}><path d="M100 170l30 30 55-60"/></g>`
};

const R=path.join(__dirname,'..');
const b64=f=>fs.readFileSync(f).toString('base64');
const font=w=>`@font-face{font-family:C;font-weight:${w};src:url(data:font/ttf;base64,${b64(path.join(R,'fonts','Cairo-'+w+'.ttf'))})}`;
const names={hotels:'الفنادق',haram:'الحرم',luggage:'الأمتعة',questions:'أسئلتكم',book:'احجز'};
const photos={hotels:'carousel/bg/jabal-omar-towers.jpg',haram:'carousel/bg/haram-wide.jpg',luggage:'carousel/bg/luggage-center2.jpg',questions:'carousel/bg/haram-courtyard-a.jpg',book:'carousel/bg/haram-courtyard-b.jpg'};
const page=(k)=>`<html><head><meta charset=utf-8><style>${font(900)}
body{margin:0;width:1080px;height:1920px;position:relative;overflow:hidden;background:#1F2449;font-family:C}
.ph{position:absolute;inset:0;background:url(data:image/jpeg;base64,${b64(path.join(R,photos[k]))}) center/cover;filter:saturate(.85) brightness(.95)}
.ov{position:absolute;inset:0;background:radial-gradient(45% 30% at 50% 50%,rgba(22,26,56,.78),rgba(31,36,73,.55) 100%)}
.c{position:absolute;left:50%;top:50%;width:700px;height:700px;margin:-350px 0 0 -350px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.c svg{margin-top:-30px}
.n{color:#fff;font-weight:900;font-size:128px;margin-top:6px;line-height:1.3;text-shadow:0 4px 24px rgba(0,0,0,.5)}
.u{width:170px;height:12px;border-radius:6px;background:#2884FF;margin-top:6px}
</style></head><body><div class=ph></div><div class=ov></div><div class=c><svg width="440" height="440" viewBox="0 0 280 280">${icons[k]}</svg><div class=n>${names[k]}</div><div class=u></div></div></body></html>`;
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await br.newPage({viewport:{width:1080,height:1920}});
fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
for(const k of Object.keys(icons)){await p.setContent(page(k));await p.waitForTimeout(300);await p.screenshot({path:path.join(__dirname,'out',`cover-${k}.png`)});}
const cards=Object.keys(icons).map(k=>`<div style="text-align:center;font-family:sans-serif;color:#fff"><div style="width:200px;height:200px;border-radius:50%;overflow:hidden;border:4px solid #2884FF"><img src="data:image/png;base64,${b64(path.join(__dirname,'out',`cover-${k}.png`))}" style="width:200px;height:355px;margin-top:-77px"></div><div style="margin-top:12px;font-size:26px">${names[k]}</div></div>`).join('');
await p.setViewportSize({width:1200,height:330});
await p.setContent(`<html><body style="margin:0;background:#111;direction:rtl;display:flex;gap:30px;padding:40px;justify-content:center">${cards}</body></html>`);
await p.waitForTimeout(500);await p.screenshot({path:path.join(__dirname,'out','preview.png')});
await br.close();})();
