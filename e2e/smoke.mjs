import fs from 'node:fs';
import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),headless:true,args:['--no-sandbox']});
try {
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]) {
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.fulfill({status:200,contentType:'text/plain',body:''}));
  await page.addInitScript(()=>{
   window.YT={Player:class {
    constructor(host,config){queueMicrotask(()=>config.events.onReady());}
    destroy(){} stopVideo(){} getPlayerState(){return 0;} getDuration(){return 0;} getCurrentTime(){return 0;} getVolume(){return 100;} isMuted(){return false;} loadVideoById(){}
   }};
  });
  await page.goto('http://127.0.0.1:4173/simple-music-player/');
  await page.getByText('name',{exact:true}).waitFor();
  await page.screenshot({path:`/tmp/music-player-${viewport.width}.png`,fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  console.log(JSON.stringify({viewport,errors,overflow,title:await page.title()}));
  if(errors.length || overflow) throw new Error('Browser smoke check failed');
  await page.close();
 }
} finally {await browser.close();}
