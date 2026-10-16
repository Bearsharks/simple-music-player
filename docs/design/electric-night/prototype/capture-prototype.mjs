import fs from 'node:fs';
import { chromium } from '@playwright/test';
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4180/index.html';
const output=process.env.PROTOTYPE_OUTPUT||'test-results/electric-night-prototype';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
const results=[];
try{
 for(const viewport of [{width:1440,height:960},{width:390,height:844}]){
  for(const scene of ['library','detail','queue','playing','empty','error','import']){
   const page=await browser.newPage({viewport});const errors=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin&&!r.url().startsWith('data:'))external.push(r.url());});
   const url=new URL(base);url.searchParams.set('fresh','1');if(scene!=='library')url.searchParams.set('scene',scene);
   await page.goto(url.href);await page.waitForFunction(()=>Boolean(window.SMPPrototype));await page.waitForTimeout(200);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   let firstCardY=null,fourthCardBottom=null;
   if(scene==='library'){firstCardY=(await page.locator('.playlist-card').first().boundingBox()).y;fourthCardBottom=await page.locator('.playlist-card').nth(3).locator('.card-title').evaluate(e=>e.getBoundingClientRect().bottom);}
   await page.screenshot({path:`${output}/${scene}-${viewport.width}.png`,fullPage:true});
   const result={scene,viewport,errors,external,overflow,firstCardY,fourthCardBottom};results.push(result);console.log(JSON.stringify(result));
   if(errors.length||external.length||overflow)throw new Error(`Runtime/overflow/external request failure: ${scene}-${viewport.width}`);
   if(viewport.width===390&&scene==='library'&&(firstCardY>240||fourthCardBottom>viewport.height-72))throw new Error('Mobile library density acceptance failed');
   await page.close();
  }
 }
}finally{fs.writeFileSync(`${output}/capture-results.json`,JSON.stringify(results,null,2));await browser.close();}
