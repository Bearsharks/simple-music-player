import fs from 'node:fs';
import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),headless:true,args:['--no-sandbox']});
try {
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]) {
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.fulfill({status:200,contentType:'text/plain',body:''}));
  await page.goto('http://127.0.0.1:4173/simple-music-player/');
  await page.getByRole('heading',{name:'내 재생목록',exact:true}).waitFor();
  await page.getByLabel('YouTube 재생목록 URL').fill('https://youtube.com/playlist?list=PLexample123');
  await page.getByLabel('목록 이름 (선택)').fill('테스트 목록');
  await page.getByRole('button',{name:'목록 저장',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'테스트 목록',exact:true}).waitFor();
  await page.screenshot({path:`/tmp/music-player-${viewport.width}.png`,fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  console.log(JSON.stringify({viewport,errors,overflow,title:await page.title()}));
  if(errors.length || overflow) throw new Error('Browser smoke check failed');
  await page.close();
 }
} finally {await browser.close();}
