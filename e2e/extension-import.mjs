import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { EXTENSION_ID } from "../extension/protocol.js";

const base=process.env.TEST_URL||"http://127.0.0.1:4187/simple-music-player/";
const output=process.env.IMPORT_REPORT_DIR||"test-results/extension-import";
fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"loopy-extension-"));
const extension=path.resolve(process.env.EXTENSION_DIR || "extension");
const launchOptions={headless:true,channel:"chromium",executablePath:process.env.CHROMIUM_PATH||undefined,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`],viewport:{width:1440,height:1000}};
let context=await chromium.launchPersistentContext(profile,launchOptions);
const ids=["azNG-AU0eGg","hWhgrA2dhrk","yDv6qdiw_WE"];
const playlist="PLVKdYxm17gBYbyZYbHWZDr7NU3ZwtFiB5";
const errors=[];
context.on("page",p=>p.on("pageerror",e=>errors.push(e.message)));
const mockAPI=`window.YT={Player:class {
 constructor(node,options){this.o=options;this.state=-1;this.volume=70;this.node=typeof node==='string'?document.getElementById(node):node;this.node.textContent='YouTube test player';this.node.style.height='220px';this.node.style.background='#111';setTimeout(()=>options.events?.onReady?.({target:this}),10);}
 getPlaylist(){return ${JSON.stringify(ids)}} getPlayerState(){return this.state} getDuration(){return 120} getCurrentTime(){return 0}
 loadVideoById(id){this.id=id;this.state=1;this.o.events?.onStateChange?.({data:1,target:this});} cueVideoById(id){this.id=id;this.state=5;}
 pauseVideo(){this.state=2;this.o.events?.onStateChange?.({data:2,target:this});} playVideo(){this.state=1;this.o.events?.onStateChange?.({data:1,target:this});}
 setVolume(v){this.volume=v;window.__previewVolume=v;} getVolume(){return this.volume} isMuted(){return false} mute(){} unMute(){} seekTo(){} destroy(){this.node?.remove();}
}};window.onYouTubeIframeAPIReady?.();`;
try {
  await context.route("https://www.youtube.com/iframe_api",r=>r.fulfill({contentType:"text/javascript",body:mockAPI}));
  await context.route("https://www.youtube.com/oembed?**",r=>{
    const id=new URL(new URL(r.request().url()).searchParams.get("url")).searchParams.get("v");
    return r.fulfill({contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({title:`곡 ${ids.indexOf(id)+1}`,author_name:"채널"})});
  });
  await context.route("https://i.ytimg.com/**",r=>r.abort());
  await context.route("https://www.youtube.com/results?**",r=>r.fulfill({contentType:"text/html; charset=utf-8",body:`<!doctype html><html><head><style>body{background:#181818;color:white;font:16px sans-serif;min-height:1600px}ytd-video-renderer,ytd-playlist-renderer{display:block;margin:48px}ytd-thumbnail{display:block;width:240px;height:135px;background:#444;border-radius:12px;overflow:hidden}a{display:block;width:100%;height:100%;color:white;text-align:center}</style></head><body><ytd-video-renderer><ytd-thumbnail><a href="/watch?v=${ids[0]}">영상</a></ytd-thumbnail><h3>첫 영상 제목</h3></ytd-video-renderer><ytd-playlist-renderer><ytd-thumbnail><a href="/playlist?list=${playlist}"><img src="https://i.ytimg.com/vi/${ids[1]}/mqdefault.jpg" alt=""></a></ytd-thumbnail><h3>재생목록 제목</h3></ytd-playlist-renderer></body></html>`}));
  const app=await context.newPage();await app.goto(base);await app.getByRole("textbox",{name:"YouTube 검색어"}).waitFor();
  const youtube=await context.newPage();await youtube.goto("https://www.youtube.com/results?search_query=loopy");
  const videoCollect=youtube.locator(`.loopy-collect[data-loopy-id="${ids[0]}"]`);
  const playlistCollect=youtube.locator(`.loopy-collect[data-loopy-id="${playlist}"]`);
  await videoCollect.click();
  await playlistCollect.click();
  expect(youtube.url()).toBe("https://www.youtube.com/results?search_query=loopy");
  const icon=await videoCollect.boundingBox();const thumbnail=await youtube.locator("ytd-video-renderer ytd-thumbnail").boundingBox();
  expect(icon.width).toBe(26);expect(icon.height).toBe(26);expect(icon.x+icon.width).toBeLessThan(thumbnail.x);expect(icon.y+icon.height/2).toBe(thumbnail.y+thumbnail.height/2);
  await youtube.evaluate(()=>scrollTo(0,140));await expect(videoCollect).not.toBeVisible();await expect(playlistCollect).toBeVisible();
  await youtube.evaluate(()=>scrollTo(0,0));await expect(videoCollect).toBeVisible();
  await expect(youtube.getByRole("status")).toHaveText("2개 담음");
  const worker=context.serviceWorkers()[0]||await context.waitForEvent("serviceworker");
  await worker.evaluate(()=>{
    globalThis.fetch=async url=>{
      if(url!=="https://api.github.com/repos/Bearsharks/simple-music-player/releases/latest")throw Error("unexpected extension network request");
      return new Response(JSON.stringify({tag_name:"v99.0.0",draft:false,prerelease:false,assets:[{name:"loopy-extension.zip"}]}),{status:200});
    };
  });
  const pageCount=context.pages().length;
  await youtube.getByRole("button",{name:"연동하기",exact:true}).click();
  const panel=youtube.getByRole("dialog",{name:"loopy 담은 목록"});
  await expect(panel).toBeVisible();expect(context.pages().length).toBe(pageCount);
  const popup=youtube.frameLocator("#loopy-import-overlay iframe");
  await expect(popup.locator("#count")).toHaveText("2");
  await expect(popup.locator(".basket-copy strong")).toHaveText(["첫 영상 제목","재생목록 제목"]);
  await expect(popup.getByRole("link",{name:"업데이트",exact:true})).toHaveAttribute("href","https://github.com/Bearsharks/simple-music-player/releases/download/v99.0.0/loopy-extension.zip");
  await popup.getByRole("button",{name:"저장",exact:true}).focus();await youtube.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();await expect(youtube.getByRole("button",{name:"연동하기",exact:true})).toBeFocused();
  await youtube.getByRole("button",{name:"연동하기",exact:true}).click();
  await expect(popup.locator("#count")).toHaveText("2");
  await panel.evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
  await youtube.screenshot({path:path.join(output,"youtube-overlay.png")});
  await popup.getByRole("button",{name:"저장",exact:true}).click();
  const dialog=app.getByRole("dialog",{name:"목록 편집"});await expect(dialog).toBeVisible();
  await expect(app.locator(".li-track")).toHaveCount(4);
  await expect(popup.getByRole("status")).toHaveText("Loopy에서 수신했습니다.");
  await expect(popup.locator("#count")).toHaveText("0");expect(context.pages().length).toBe(pageCount);
  await expect(app.getByText("플레이어가 제공한 곡만 포함됩니다. 원본 전체가 아닐 수 있습니다.")).toBeVisible();
  const nameInput=app.getByLabel("재생목록 이름",{exact:true});
  await nameInput.fill("   ");await nameInput.press("Tab");
  await expect(app.getByRole("button",{name:"재생목록 저장",exact:true})).toBeDisabled();
  await expect(app.locator("#li-title-error")).toHaveText("재생목록 이름을 입력하세요.");
  const inputBox=await nameInput.boundingBox(),errorBox=await app.locator("#li-title-error").boundingBox();
  expect(errorBox.y).toBeGreaterThanOrEqual(inputBox.y+inputBox.height);
  await nameInput.fill("확장 연동 검증");
  await expect(app.locator("#li-title-error")).toHaveCount(0);
  await app.getByLabel("설명",{exact:true}).fill("설명\n".repeat(70));
  const textarea=await app.getByLabel("설명",{exact:true}).evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,resize:getComputedStyle(el).resize}));
  expect(textarea.resize).toBe("none");expect(textarea.scroll).toBeGreaterThan(textarea.height);
  const handles=app.getByRole("button",{name:/순서 드래그/});
  await handles.nth(3).focus();await app.keyboard.press("Space");await app.keyboard.press("ArrowUp");await app.keyboard.press("Space");
  await expect(app.locator(".li-track").nth(2)).toContainText("곡 3");
  // Pointer reorder uses the same handle, and Escape must cancel without closing.
  const handle=app.getByRole("button",{name:"곡 2 순서 드래그",exact:true});
  const from=await handle.boundingBox(),to=await handles.first().boundingBox();
  await app.mouse.move(from.x+20,from.y+20);await app.mouse.down();await app.mouse.move(from.x+20,from.y+10,{steps:3});
  await expect(app.locator("[data-dragging]" )).toHaveCount(1);
  await app.mouse.move(to.x+20,to.y+10,{steps:20});await app.mouse.up();
  await expect(app.locator(".li-track").first()).toContainText("곡 2");
  await handle.focus();await app.keyboard.press("Space");await app.keyboard.press("Escape");await expect(dialog).toBeVisible();
  await app.evaluate(()=>{window.__mainPaused=0;window.player={getPlayerState:()=>1,pauseVideo:()=>window.__mainPaused++};});
  await app.getByRole("button",{name:"곡 3 미리듣기",exact:true}).click();
  await expect.poll(()=>app.evaluate(()=>window.__mainPaused)).toBeGreaterThan(0);
  await expect(app.locator('section[aria-label="미리듣기"] .yi-preview-controls')).toHaveCount(0);
  // Second real extension save stages a request without overwriting the edit.
  const collectVideo=async()=>{
    await youtube.bringToFront();
    if(await panel.isVisible())await youtube.getByRole("button",{name:"담은 목록 닫기",exact:true}).click();
    await videoCollect.click();
    await youtube.getByRole("button",{name:"연동하기",exact:true}).click();
    await expect(popup.locator("#count")).toHaveText("1");
    await panel.evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
    await expect.poll(()=>popup.locator("body").evaluate(async()=>Date.now()-((await chrome.storage.session.get("lastSent")).lastSent||0))).toBeGreaterThanOrEqual(2000);
  };
  await collectVideo();
  await popup.getByRole("button",{name:"저장",exact:true}).click();await expect(app.getByRole("region",{name:"최신 요청 교체 확인"})).toBeVisible();
  await expect(app.getByLabel("재생목록 이름",{exact:true})).toHaveValue("확장 연동 검증");
  await app.screenshot({path:path.join(output,"desktop-pending.png")});
  await app.getByRole("button",{name:"현재 편집 유지"}).click();
  for(const width of [390,320]){await app.setViewportSize({width,height:844});await app.screenshot({path:path.join(output,`mobile-${width}.png`)});expect(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await app.setViewportSize({width:1440,height:1000});
  await app.getByRole("button",{name:"재생목록 저장",exact:true}).click();await expect(dialog).toHaveCount(0);
  await expect(app.getByText("확장 연동 검증",{exact:true}).first()).toBeVisible();
  await app.reload();await expect(app.getByText("확장 연동 검증",{exact:true}).first()).toBeVisible();
  // The editing dialog is entered only through the real extension delivery.
  await expect(app.getByRole("button",{name:"담은 목록",exact:true})).toHaveCount(0);
  await expect(app.getByRole("button",{name:"확장 프로그램 다운로드",exact:true})).toHaveCount(0);
  await expect(popup.locator("#count")).toHaveText("0");
  await collectVideo();
  await popup.getByRole("button",{name:"저장",exact:true}).click();
  await expect(app.locator(".li-track")).toHaveCount(1);await app.getByRole("button",{name:"대기열에 추가",exact:true}).click();
  await expect(dialog).toBeVisible();await expect(app.getByRole("status").filter({hasText:"추가되었습니다."})).toBeVisible();
  await app.keyboard.press("Escape");await expect(dialog).toBeVisible();
  await app.mouse.click(2,2);await expect(dialog).toBeVisible();
  await app.locator('.li-track button[aria-label$="대기열 작업"]').first().click();
  await app.getByRole("menuitem",{name:"다음 재생",exact:true}).click();await expect(dialog).toBeVisible();
  await expect(app.getByRole("button",{name:"목록 편집 닫기"})).toBeEnabled();
  await app.getByRole("button",{name:"목록 편집 닫기"}).click();await expect(dialog).toHaveCount(0);
  // The standard new-playlist form accepts a mix via the actual production parser.
  await app.getByRole("button",{name:"재생목록 만들기",exact:true}).click();
  await app.getByLabel("YouTube 재생목록 URL (선택)").fill(`https://www.youtube.com/watch?v=${ids[0]}&list=RD${ids[0]}`);
  await app.getByLabel("YouTube 재생목록 URL (선택)").press("Tab");
  await app.getByRole("textbox",{name:/^이름/}).fill("믹스 검증");
  await expect(app.getByRole("button",{name:"만들기",exact:true})).toBeEnabled();
  await app.getByRole("button",{name:"만들기",exact:true}).click();
  await expect(app.getByRole("heading",{name:"믹스 검증",exact:true})).toBeVisible();
  await app.screenshot({path:path.join(output,"desktop-applied.png")});
  // Discover current tabs at send time: exactly one target, no navigation of existing pages.
  await app.evaluate(()=>window.__keptDraft="untouched");const beforeUrl=app.url();
  const secondApp=await context.newPage();await secondApp.goto(base);await secondApp.getByRole("textbox",{name:"YouTube 검색어"}).waitFor();
  const multipleCount=context.pages().length;await collectVideo();await popup.getByRole("button",{name:"저장",exact:true}).click();
  await expect.poll(async()=>await secondApp.getByRole("dialog",{name:"목록 편집"}).count()+await app.getByRole("dialog",{name:"목록 편집"}).count()).toBe(1);
  expect(app.url()).toBe(beforeUrl);expect(await app.evaluate(()=>window.__keptDraft)).toBe("untouched");
  expect(context.pages().length).toBe(multipleCount);await expect(popup.locator("#count")).toHaveText("0");
  await secondApp.close();await app.close();
  await collectVideo();const newTab=context.waitForEvent("page").catch(()=>null);await popup.getByRole("button",{name:"저장",exact:true}).click();const opened=await newTab;
  if(!opened){console.log("Delivery diagnostic",await popup.locator("body").evaluate(async()=>({status:document.querySelector("#status").textContent,tabs:await chrome.tabs.query({url:["http://127.0.0.1/*","http://localhost/*","https://loopy.bearsharks.dev/*"]}),state:await chrome.storage.session.get(["delivery","lastSent","outcome"])})));throw Error("No new Loopy tab");}
  await expect(opened).toHaveURL(base);await expect(opened.getByRole("dialog",{name:"목록 편집"})).toBeVisible();
  await expect(popup.locator("#count")).toHaveText("0");
  // Unsent local basket survives an actual browser context restart.
  await collectVideo();await context.close();context=await chromium.launchPersistentContext(profile,launchOptions);
  const restored=await context.newPage();await restored.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
  await expect(restored.locator("#count")).toHaveText("1");
  expect(await restored.locator("body").evaluate(el=>el.getBoundingClientRect().width)).toBe(400);
  expect(await restored.locator("body").evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  const popupWorker=context.serviceWorkers()[0]||await context.waitForEvent("serviceworker");
  const cdp=await context.browser().newBrowserCDPSession();
  const existingTargets=new Set((await cdp.send("Target.getTargets")).targetInfos.map(target=>target.targetId));
  await popupWorker.evaluate(()=>chrome.action.openPopup());
  const targets=(await cdp.send("Target.getTargets")).targetInfos;
  const popupTarget=targets.find(target=>target.url===`chrome-extension://${EXTENSION_ID}/popup.html`&&!existingTargets.has(target.targetId));
  if(!popupTarget)throw Error(`Native popup target missing: ${JSON.stringify(targets.map(t=>({type:t.type,url:t.url})))}`);
  const {sessionId}=await cdp.send("Target.attachToTarget",{targetId:popupTarget.targetId,flatten:false});
  const measured=new Promise(resolve=>cdp.on("Target.receivedMessageFromTarget",event=>{const data=JSON.parse(event.message);if(event.sessionId===sessionId&&data.id===1)resolve(data.result.result.value);}));
  await cdp.send("Target.sendMessageToTarget",{sessionId,message:JSON.stringify({id:1,method:"Runtime.evaluate",params:{expression:"({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})",returnByValue:true}})});
  expect(await measured).toEqual({width:400,overflow:false});
  await cdp.detach();
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(output,"report.json"),JSON.stringify({extensionId:EXTENSION_ID,realExtensionTransport:true,realIndexedDB:true,overlay:true,thumbnailIconSize:26,singleTarget:true,createdTabWhenAbsent:true,clearedOnAck:true,basketSurvivedBrowserRestart:true,extensionUpdateLinkVerified:true,externalMetadataAndPlayer:"mocked",githubRelease:"mocked",textarea,errors},null,2));
  console.log("PASS: YouTube overlay/Escape, targeted delivery/reuse/new tab, ACK clearing, browser-restart basket persistence, modal edits/queue/storage; desktop + 390/320.");
}catch(error){
  for(const page of context.pages()){
    if(page.url().startsWith("https://www.youtube.com/")){
      const frame=page.frames().find(f=>f.url().startsWith(`chrome-extension://${EXTENSION_ID}/popup.html`));
      if(frame)console.log("Overlay failure diagnostic",await frame.evaluate(async()=>({status:document.querySelector("#status")?.textContent,saveDisabled:document.querySelector("#save")?.disabled,state:await chrome.storage.session.get(["delivery","lastSent","outcome"]),basket:(await chrome.storage.local.get("basket")).basket?.length})).catch(()=>null));
      await page.screenshot({path:path.join(output,"failure-overlay.png")}).catch(()=>{});
    }
  }
  throw error;
}finally{await context.close();fs.rmSync(profile,{recursive:true,force:true});}
