import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const base=process.env.TEST_URL||'http://127.0.0.1:4173/simple-music-player/';
fs.mkdirSync('test-results',{recursive:true});
try {
 for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:960}});
  const page=await context.newPage();
  const requests=[];
  page.on('request',r=>requests.push(r.url()));
  // A fresh context and disabled HTTP cache exercise the first-open path.
  const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.goto(base);
  await expect(page.getByRole('button',{name:'새 재생목록',exact:true})).toBeVisible();
  await page.evaluate(async()=>{
   const r=indexedDB.open('simple-music-player-local-v1',1);
   const db=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
   await new Promise((ok,no)=>{const tx=db.transaction('playlists','readwrite');tx.oncomplete=ok;tx.onerror=no;
    tx.objectStore('playlists').put({info:{id:'cold-menu',name:'첫 열림 검수',description:'',createdAt:1,itemCount:0,thumbnails:[]},items:[]});
   });db.close();
  });
  // Deliberate font failure: menu icons must still render without an icon font.
  await page.route(/\.(woff2?|ttf)(\?|$)/,route=>route.abort());
  await page.reload({waitUntil:'domcontentloaded'});
  const trigger=page.getByRole('button',{name:'첫 열림 검수 더보기',exact:true});
  await expect(trigger).toBeVisible();
  await trigger.click();
  const menu=page.getByRole('menu',{name:'선택 메뉴'});
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem')).toHaveCount(5);
  await expect(menu.getByText('불러오는 중…')).toHaveCount(0);
  const boxes=await menu.getByRole('menuitem').evaluateAll(items=>items.map(e=>{
   const s=e.querySelector('svg');const r=s.getBoundingClientRect();
   return {width:r.width,height:r.height,text:e.textContent,legacy:!!e.querySelector('.material-icons')};
  }));
  for(const b of boxes){expect(b.legacy).toBe(false);expect(b.width).toBeGreaterThan(0);expect(b.width).toBeLessThanOrEqual(22);expect(b.height).toBeGreaterThan(0);}
  expect(requests.some(u=>/material-icons/.test(u))).toBe(false);
  await page.screenshot({path:`test-results/cold-menu-no-font-${width}.png`});
  await page.keyboard.press('Escape');await expect(menu).toHaveCount(0);await expect(trigger).toBeFocused();
  await context.close();
 }
 console.log('Cold-cache menus: inline SVG, font failure, responsive layout and Escape passed');
} finally {await browser.close();}
