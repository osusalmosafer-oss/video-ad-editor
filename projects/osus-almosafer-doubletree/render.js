const puppeteer=require(process.env.PUPPETEER_CORE || 'puppeteer-core');
const fs=require('fs'), path=require('path');
const WORK=__dirname, FPS=30;
const theme=JSON.parse(fs.readFileSync(path.join(WORK,'theme.json'),'utf8'));
const CHROME=process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const mode=process.argv[2]||'all';
const args=process.argv.slice(3).map(Number);

function planConsts(){
  const src=fs.readFileSync(path.join(WORK,'plan.js'),'utf8');
  const g={window:{}}; new Function('window','return eval('+JSON.stringify(src)+')')(g.window);
  return g.window;
}
const P=planConsts();
const SRC_END=P.SRC_END, TOTAL=P.TOTAL;
const NF=Math.round(TOTAL*FPS);

const framePath=t=>{                       // بعد نهاية الفيديو نثبّت آخر فريم ليذوب تحت كرت النهاية
  const i=Math.min(Math.round(t*FPS)+1, Math.round(SRC_END*FPS));
  return 'file://'+path.join(WORK,'vfr',String(i).padStart(5,'0')+'.jpg');
};

(async()=>{
  const browser=await puppeteer.launch({executablePath:CHROME, headless:'new',
    args:['--allow-file-access-from-files','--disable-web-security','--font-render-hinting=none',
          '--force-device-scale-factor=1','--hide-scrollbars','--no-sandbox','--disable-gpu']});
  const N=Number(process.env.WORKERS||3);
  const outDir=path.join(WORK, mode==='preview'?'prev':'out');
  fs.mkdirSync(outDir,{recursive:true});

  let list=[];
  if(mode==='preview'){ list=args.map(t=>({t, f:null, name:('t'+t.toFixed(2)+'.jpg')})); }
  else if(mode==='range'){
    const a=Math.round(args[0]*FPS), b=Math.round(args[1]*FPS);
    for(let i=a;i<b;i++) list.push({i, t:i/FPS, name:String(i+1).padStart(5,'0')+'.jpg'});
  } else {
    for(let i=0;i<NF;i++){
      const name=String(i+1).padStart(5,'0')+'.jpg';
      if(process.argv.includes('--force') || !fs.existsSync(path.join(outDir,name)))
        list.push({i, t:i/FPS, name});
    }
  }
  console.log('frames to render:', list.length, '/', NF);

  const chunks=Array.from({length:N},()=>[]);
  list.forEach((it,k)=>chunks[k%N].push(it));
  let done=0;
  await Promise.all(chunks.map(async(chunk)=>{
    if(!chunk.length) return;
    const page=await browser.newPage();
    await page.setViewport({width:1080,height:1920});
    await page.goto('file://'+path.join(WORK,'compose.html'),{waitUntil:'networkidle0'});
    await page.evaluate(t=>window.__boot(t), theme);
    const el=await page.$('#c');
    for(const it of chunk){
      await page.evaluate((t,f)=>window.__frame(t,f), it.t, framePath(it.t));
      await el.screenshot({path:path.join(outDir,it.name), type:'jpeg', quality:93});
      if(++done%120===0) console.log(' ..',done,'/',list.length);
    }
    await page.close();
  }));
  await browser.close();
  console.log('done', done, '->', outDir);
})().catch(e=>{console.error(e); process.exit(1);});
