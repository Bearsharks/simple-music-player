import fs from 'node:fs';
import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,headless:true});
try {
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]) {
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.fulfill({status:200,contentType:'text/plain',body:''}));
  await page.addInitScript(()=>{window.YT={Player:class {
   constructor(_host,config){queueMicrotask(()=>config.events.onReady());}
   destroy(){} stopVideo(){} getPlayerState(){return 0;} getDuration(){return 0;} getCurrentTime(){return 0;} getVolume(){return 100;} isMuted(){return false;} loadVideoById(){}
  }};});
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173/simple-music-player/');
  await page.getByText('새 재생목록',{exact:true}).waitFor();
  await page.evaluate(()=>new Promise((resolve,reject)=>{
   const req=indexedDB.open('simple-music-player-local-v1',1);
   req.onsuccess=()=>{const db=req.result;const tx=db.transaction('playlists','readwrite');tx.objectStore('playlists').put({info:{id:'browser-test',name:'브라우저 검증 목록',description:'',itemCount:0,thumbnails:[]},items:[]});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};req.onerror=()=>reject(req.error);
  }));
  await page.reload();await page.getByText('브라우저 검증 목록',{exact:true}).click();
  await page.getByLabel('추가할 영상 URL').fill('https://youtu.be/abcdefghijk');
  await page.getByLabel('곡 이름 (선택)').fill('저장 검증 곡');
  await page.getByRole('button',{name:'곡 추가',exact:true}).click();
  await page.getByText('저장 검증 곡',{exact:true}).waitFor();
  await page.reload();await page.getByText('저장 검증 곡',{exact:true}).waitFor();
  fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:`test-results/music-player-${viewport.width}.png`,fullPage:true});
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  if (!csp?.includes("object-src 'none'") || csp.includes("script-src 'self' 'unsafe-inline'")) throw new Error('Missing script policy');
  const blocked = await page.evaluate(() => new Promise(resolve => {
    const timeout = setTimeout(() => resolve(false), 2000);
    document.addEventListener('securitypolicyviolation', function listener(e) {
      if (e.violatedDirective.startsWith('script-src')) { clearTimeout(timeout); document.removeEventListener('securitypolicyviolation',listener); resolve(true); }
    });
    const script = document.createElement('script'); script.textContent = 'window.__smpInjected = true'; document.head.append(script);
  }));
  if (!blocked || await page.evaluate(() => window.__smpInjected === true)) throw new Error('Inline script not blocked');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  console.log(JSON.stringify({viewport,errors,overflow}));
  if(errors.length) throw new Error('Browser runtime errors');
  await page.close();
 }
} finally {await browser.close();}
