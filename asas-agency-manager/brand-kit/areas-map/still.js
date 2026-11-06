const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+__dirname+'/areas.html');await p.waitForTimeout(1500);
const D='/tmp/claude-0/-home-user-video-ad-editor/b83edbaa-5c4f-52bb-9e3a-37a0f403f8a9/scratchpad/mapstill';require('fs').mkdirSync(D,{recursive:true});
for(const t of [1.2,2.2,4.5,8.5,13,17,20.5,24.5]){await p.evaluate(t=>setT(t),t);await p.screenshot({path:D+'/s'+t+'.png'});}
await b.close()})();
