// Design-only preview: no production IndexedDB or real YouTube playback.
import fs from 'node:fs';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
try {
  fs.mkdirSync('test-results', { recursive: true });
  for (const viewport of [{width:1440,height:960},{width:390,height:844}]) {
    for (const scene of ['library','detail','queue','error','empty']) {
      const page = await browser.newPage({ viewport });
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`http://127.0.0.1:4174/docs/design/electric-night/prototype/index.html?fresh=1&scene=${scene}`);
      await page.waitForFunction(()=>document.querySelector('#main-panel')?.children.length > 0);
      await page.screenshot({path:`test-results/prototype-${scene}-${viewport.width}.png`,fullPage:true});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth);
      console.log(JSON.stringify({prototype:scene,viewport,errors,overflow}));
      if(errors.length || overflow) throw new Error(`Prototype ${scene}: runtime/overflow failure`);
      await page.close();
    }
  }
} finally { await browser.close(); }
