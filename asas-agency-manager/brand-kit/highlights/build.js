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
const names={hotels:'الفنادق',haram:'الحرم',luggage:'الأمتعة',questions:'أسئلتكم',book:'احجز'};
const page=(svg)=>`<html><body style="margin:0;width:1080px;height:1920px;background:radial-gradient(70% 45% at 50% 50%,#2C3570 0%,#1F2449 70%,#161A38 100%);display:flex;align-items:center;justify-content:center">
<svg width="640" height="640" viewBox="0 0 280 280">${svg}</svg></body></html>`;
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await br.newPage({viewport:{width:1080,height:1920}});
fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
for(const k of Object.keys(icons)){await p.setContent(page(icons[k]));await p.screenshot({path:path.join(__dirname,'out',`cover-${k}.png`)});}
// معاينة بدوائر كما تظهر في إنستقرام
const cards=Object.keys(icons).map(k=>`<div style="text-align:center;font-family:sans-serif;color:#fff"><div style="width:200px;height:200px;border-radius:50%;overflow:hidden;border:4px solid #2884FF"><img src="data:image/png;base64,${fs.readFileSync(path.join(__dirname,'out',`cover-${k}.png`)).toString('base64')}" style="width:200px;height:355px;margin-top:-77px"></div><div style="margin-top:12px;font-size:26px">${names[k]}</div></div>`).join('');
await p.setViewportSize({width:1200,height:330});
await p.setContent(`<html><body style="margin:0;background:#111;direction:rtl;display:flex;gap:30px;padding:40px;justify-content:center">${cards}</body></html>`);
await p.waitForTimeout(500);await p.screenshot({path:path.join(__dirname,'out','preview.png')});
await br.close();})();
