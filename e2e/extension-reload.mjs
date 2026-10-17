import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {chromium,expect} from "@playwright/test";
import {EXTENSION_ID} from "../extension/protocol.js";

const extension=path.resolve(process.env.EXTENSION_DIR||"extension");
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"loopy-context-reload-"));
const output=process.env.IMPORT_REPORT_DIR||"test-results/extension-reload";
fs.mkdirSync(output,{recursive:true});
const options={headless:true,channel:"chromium",executablePath:process.env.CHROMIUM_PATH||undefined,
  args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`],viewport:{width:1000,height:760}};
const fixture=async context=>context.route("https://www.youtube.com/results?**",r=>r.fulfill({contentType:"text/html",body:
  '<style>ytd-video-renderer{display:block;margin:80px}ytd-thumbnail{display:block;width:240px;height:135px;background:#bbb}</style><ytd-video-renderer><ytd-thumbnail><a href="/watch?v=azNG-AU0eGg">Video</a></ytd-thumbnail><h3>Test video</h3></ytd-video-renderer>'}));
let context=await chromium.launchPersistentContext(profile,options);
try{
  await fixture(context);const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("https://www.youtube.com/results?search_query=loopy");
  await page.locator(".loopy-collect").click();
  await expect(page.locator("#loopy-bridge-tools [role=status]")).toHaveText("1개 담음");
  const worker=context.serviceWorkers()[0]||await context.waitForEvent("serviceworker");
  const before=await worker.evaluate(async()=>(await chrome.storage.local.get("basket")).basket);
  const closed=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error("Extension worker did not reload")),15000);
    worker.once("close",()=>{clearTimeout(timer);resolve();});
  });
  await worker.evaluate(()=>chrome.runtime.reload()).catch(error=>{if(!/closed|destroyed|context/i.test(error.message))throw error;});
  await closed;
  await page.evaluate(()=>document.querySelector("ytd-video-renderer a").setAttribute("href","/watch?v=hWhgrA2dhrk"));
  await expect(page.getByRole("button",{name:"새로고침",exact:true})).toBeVisible();
  await expect(page.locator("#loopy-thumbnail-actions")).toHaveCount(0);
  await expect(page.locator("#loopy-import-overlay")).toHaveCount(0);
  await page.evaluate(()=>{
    document.querySelector("ytd-video-renderer a").setAttribute("href","/watch?v=yDv6qdiw_WE");
    document.dispatchEvent(new Event("yt-navigate-finish"));window.dispatchEvent(new Event("resize"));
  });
  await page.waitForTimeout(500);expect(errors).toEqual([]);
  await page.screenshot({path:path.join(output,"reload-required.png")});
  // Command-line loaded extensions are loaded afresh with the same persistent profile.
  await context.close();context=await chromium.launchPersistentContext(profile,options);await fixture(context);
  const popup=await context.newPage();await popup.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
  await expect(popup.locator("#count")).toHaveText("1");
  const restored=context.serviceWorkers()[0]||await context.waitForEvent("serviceworker");
  expect(await restored.evaluate(async()=>(await chrome.storage.local.get("basket")).basket)).toEqual(before);
  const fresh=await context.newPage();await fresh.goto("https://www.youtube.com/results?search_query=loopy");
  await expect(fresh.locator(".loopy-collect")).toBeVisible();await expect(fresh.getByRole("button",{name:"연동하기",exact:true})).toBeVisible();
  console.log("PASS: real context invalidation, stopped observers/UI, no page errors, preserved basket and fresh content initialization");
}finally{await context.close();fs.rmSync(profile,{recursive:true,force:true});}
