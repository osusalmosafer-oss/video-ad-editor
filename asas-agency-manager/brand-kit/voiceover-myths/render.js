const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+__dirname+'/myths.html');await p.waitForTimeout(1200);
fs.mkdirSync('/tmp/claude-0/-home-user-video-ad-editor/b83edbaa-5c4f-52bb-9e3a-37a0f403f8a9/scratchpad/myths',{recursive:true});
const N=Math.round(34.4*30);
for(let n=0;n<N;n++){await p.evaluate(t=>setT(t),n/30);await p.screenshot({path:`/tmp/claude-0/-home-user-video-ad-editor/b83edbaa-5c4f-52bb-9e3a-37a0f403f8a9/scratchpad/myths/f${String(n).padStart(4,'0')}.png`});}
await b.close();console.log('frames',N)})();
