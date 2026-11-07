const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+__dirname+'/voco.html');await p.waitForTimeout(1200);
for(const t of [1.0,2.6,5.6,8.2,12.0,15.5,18.5,23.5]){await p.evaluate(t=>setT(t),t);await p.screenshot({path:process.argv[2]+'/t'+String(t).padStart(5,'0')+'.png'});}
await b.close()})();
