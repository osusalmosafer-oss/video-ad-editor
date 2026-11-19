const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.cwd()+'/jumua.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
const names=['jumua-poster','jumua-1','jumua-2','jumua-3','jumua-4','jumua-5'];
for(let i=0;i<6;i++){await (await p.$('#s'+i)).screenshot({path:names[i]+'.png'});}
await b.close()})();
