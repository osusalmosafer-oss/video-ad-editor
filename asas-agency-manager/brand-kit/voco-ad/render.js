const {chromium}=require('playwright');const fs=require('fs');
const OUT=process.argv[2];const DUR=25;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+__dirname+'/voco.html');await p.waitForTimeout(1200);
fs.mkdirSync(OUT,{recursive:true});const N=DUR*30;
for(let n=0;n<N;n++){await p.evaluate(t=>setT(t),n/30);await p.screenshot({path:`${OUT}/f${String(n).padStart(4,'0')}.png`});}
await b.close();console.log('frames',N)})();
