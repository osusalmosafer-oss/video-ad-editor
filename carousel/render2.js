const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
await p.goto('file://'+process.cwd()+'/carousel2.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
for(let i=1;i<=8;i++){await (await p.$('#s'+i)).screenshot({path:`mecca-${i}.png`});}
await b.close()})();
