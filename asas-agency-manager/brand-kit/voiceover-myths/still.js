const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+__dirname+'/myths.html');await p.waitForTimeout(1500);
const D='/tmp/claude-0/-home-user-video-ad-editor/b83edbaa-5c4f-52bb-9e3a-37a0f403f8a9/scratchpad/mythstill';require('fs').mkdirSync(D,{recursive:true});
const ts=[0.5,1.2,2.6,4.6,7.4,9.6,10.4,12.6,14.8,17.4,19.6,21.4,24,26.5,29.2,31.5,33.6];
for(const t of ts){await p.evaluate(t=>setT(t),t);await p.screenshot({path:D+'/s'+t+'.png'});}
await b.close()})();
