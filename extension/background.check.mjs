import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { EXTENSION_ID } from "./protocol.js";
import { APP_URL } from "./config.js";
let local = {}, session = {}, tabs = [], failOpen = false, failNotify = false;
const notifications=[];
const listeners = {}, updates = [], created = [], focused = [];
const storage = getter => ({
  get: async keys => structuredClone(Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(k => [k, getter()[k]]))),
  set: async values => Object.assign(getter(), structuredClone(values)),
  remove: async keys => { for (const key of Array.isArray(keys) ? keys : [keys]) delete getter()[key]; },
});
globalThis.chrome = {
  runtime: { id: EXTENSION_ID, getManifest:()=>({version:"0.2.1"}), getURL: p => `chrome-extension://${EXTENSION_ID}/${p}`, onMessage: { addListener: f => listeners.internal = f }, onMessageExternal: { addListener: f => listeners.external = f } },
  storage: { local: storage(() => local), session: storage(() => session) },
  tabs: {
    sendMessage: async (...args) => {notifications.push(args);if(failNotify)throw Error("No receiver");return {ok:true};},
    query: async () => structuredClone(tabs),
    create: async options => { if (failOpen) throw Error("blocked"); created.push(options); const tab = {id:99, windowId:1, url:options.url}; tabs.push(tab); return tab; },
    update: async (id, options) => { if (failOpen) throw Error("closed"); updates.push({id, options}); return tabs.find(t=>t.id===id); },
  },
  windows: { update: async (id, options) => focused.push({id, options}) },
};
await import("./background.js");
const popup = { id: EXTENSION_ID, url: `chrome-extension://${EXTENSION_ID}/popup.html` };
const app = (id=10) => ({ url:APP_URL, frameId:0, tab:{id} });
const call = (kind,message,sender=popup) => new Promise(resolve=>{if(!listeners[kind](message,sender,resolve))resolve(undefined);});
const add = (id="azNG-AU0eGg") => call("internal",{type:"basket.add",item:{kind:"video",id}});
const send = () => call("internal",{type:"basket.send"});
const ack = (id,tab=10) => call("external",{type:"loopy.ack",requestId:id},app(tab));
beforeEach(()=>{local={};session={};tabs=[{id:10,windowId:1,url:APP_URL,lastAccessed:1}];failOpen=false;failNotify=false;notifications.length=0;updates.length=0;created.length=0;focused.length=0;});

test("validates sender and ID-only payload; ACK alone clears delivered entries",async()=>{
  assert.equal(await call("internal",{type:"basket.add",item:{kind:"video",id:"azNG-AU0eGg"}},{id:"wrong",url:"https://www.youtube.com/"}),undefined);
  assert.equal((await call("internal",{type:"basket.add",item:{kind:"video",id:"azNG-AU0eGg",html:"bad"}})).ok,false);
  await add();await send();const request=session.delivery.request;
  assert.deepEqual(request.items,[{kind:"video",id:"azNG-AU0eGg"}]);assert.equal(local.basket.length,1);
  assert.equal(await call("external",{type:"loopy.pull"},{...app(),url:"https://evil.test/"}),undefined);
  assert.equal(await call("external",{type:"loopy.pull"},{...app(),frameId:1}),undefined);
  assert.deepEqual((await call("external",{type:"loopy.pull"},app())).request,request);
  await ack("wrong");assert.equal(local.basket.length,1);
  await ack(request.requestId);assert.equal(local.basket.length,0);assert.equal(session.delivery,null);
});
test("opens an existing Loopy tab without navigation, delivery or basket changes",async()=>{
  await add();await send();const before=structuredClone({local,session});updates.length=0;focused.length=0;
  assert.equal((await call("internal",{type:"app.open"})).ok,true);
  assert.deepEqual(updates,[{id:10,options:{active:true}}]);assert.deepEqual(focused,[{id:1,options:{focused:true}}]);
  assert.equal(created.length,0);assert.deepEqual({local,session},before);
});
test("opens only the production URL when no allowed tab exists, even with an empty basket",async()=>{
  tabs=[{id:67,url:"http://127.0.0.1:4187/simple-music-player/",windowId:1}];
  assert.equal((await call("internal",{type:"app.open"})).ok,true);
  assert.deepEqual(created,[{url:APP_URL,active:true}]);assert.deepEqual(local,{});assert.deepEqual(session,{});
});
test("rejects non-popup or malformed open requests and preserves state on focus failure",async()=>{
  assert.equal((await call("internal",{type:"app.open"},{id:EXTENSION_ID,url:"https://www.youtube.com/"})).ok,false);
  assert.equal((await call("internal",{type:"app.open",url:"https://evil.test/"})).ok,false);
  await add();const before=structuredClone({local,session});failOpen=true;
  assert.equal((await call("internal",{type:"app.open"})).ok,false);assert.deepEqual({local,session},before);
});
test("keeps sanitized preview metadata locally and sends only kind/id",async()=>{
  await call("internal",{type:"basket.add",item:{kind:"video",id:"azNG-AU0eGg"},preview:{title:"  My\n song  ",thumbnailVideoId:"javascript:bad",thumbnailUrl:"https://evil.test/track"}});
  assert.equal(local.basket[0].title,"My song");assert.equal(local.basket[0].thumbnailVideoId,"azNG-AU0eGg");assert.equal(local.basket[0].thumbnailUrl,undefined);
  await send();assert.deepEqual(session.delivery.request.items,[{kind:"video",id:"azNG-AU0eGg"}]);
});
test("refreshes existing titleless entries only from the YouTube content script",async()=>{
  local.basket=[{kind:"playlist",id:"PLVKdYxm17gBYbyZYbHWZDr7NU3ZwtFiB5"}];
  const entries=[{item:local.basket[0],preview:{title:"Playlist title",thumbnailVideoId:"azNG-AU0eGg"}}];
  assert.equal((await call("internal",{type:"basket.preview",entries})).ok,false);
  await call("internal",{type:"basket.preview",entries},{id:EXTENSION_ID,url:"https://www.youtube.com/playlist?list=PLVKdYxm17gBYbyZYbHWZDr7NU3ZwtFiB5"});
  assert.equal(local.basket[0].title,"Playlist title");assert.equal(local.basket[0].thumbnailVideoId,"azNG-AU0eGg");
});
test("preserves newly added duplicate occurrences while clearing only sent keys",async()=>{
  await add();await add();await send();const request=session.delivery.request;
  await add();const newKey=local.basket[2].key;
  await ack(request.requestId);
  assert.equal(local.basket.length,1);assert.equal(local.basket[0].key,newKey);
});
test("selects one existing recent app tab without navigation; other tabs cannot receive or acknowledge",async()=>{
  tabs.push({id:20,windowId:2,url:APP_URL+"playlist/keep",lastAccessed:200});
  await add();await send();const request=session.delivery.request;
  assert.equal(session.delivery.targetTabId,20);assert.equal(created.length,0);
  assert.deepEqual(notifications,[[20,{type:"loopy.delivery.available"},{frameId:0}]]);
  assert.deepEqual(updates,[{id:20,options:{active:true}}]);assert.deepEqual(focused,[{id:2,options:{focused:true}}]);
  assert.equal((await call("external",{type:"loopy.pull"},app(10))).request,null);
  await ack(request.requestId,10);assert.equal(local.basket.length,1);
  await ack(request.requestId,20);assert.equal(local.basket.length,0);
});
test("keeps the delivery for initial/manual pull when no notification receiver exists",async()=>{
  failNotify=true;await add();assert.equal((await send()).ok,true);
  assert.equal(local.basket.length,1);assert.equal(session.delivery.targetTabId,10);
  const {request}=await call("external",{type:"loopy.pull"},app());await ack(request.requestId);
  assert.equal(local.basket.length,0);
});
test("creates a fresh app tab only when none exists and waits for its readiness",async()=>{
  tabs=[];await add();await send();assert.deepEqual(created,[{url:APP_URL,active:true}]);
  assert.equal(local.basket.length,1);const request=session.delivery.request;
  assert.equal((await call("external",{type:"loopy.pull"},app(99))).request.requestId,request.requestId);
  await ack(request.requestId,99);assert.equal(local.basket.length,0);
});
test("ignores lookalike and disallowed local tabs",async()=>{
   tabs=[{id:66,windowId:1,url:"https://loopy.bearsharks.dev.evil.test/",lastAccessed:999},{id:67,windowId:1,url:"http://localhost:9000/simple-music-player/",lastAccessed:999},{id:68,windowId:1,url:"http://127.0.0.1:4187/simple-music-player/",lastAccessed:999}];
  await add();await send();assert.equal(session.delivery.targetTabId,99);assert.equal(created.length,1);
});
test("failed focus, timeout and browser restart keep unsent basket",async()=>{
  await add();failOpen=true;assert.equal((await send()).ok,false);assert.equal(local.basket.length,1);
  failOpen=false;session.lastSent=0;await send();const request=session.delivery.request;
  session.delivery.expiresAt=Date.now()-1;
  await ack(request.requestId);assert.equal(local.basket.length,1);assert.equal(session.delivery,null);
  session={};const result=await call("internal",{type:"basket.get"});assert.equal(result.basket.length,1);assert.equal(result.waiting,false);
});
test("stale ACK cannot clear newer delivery, and legacy basket migrates without losing repeated items",async()=>{
  local.basket=[{kind:"video",id:"azNG-AU0eGg"},{kind:"video",id:"azNG-AU0eGg"}];
  await send();const first=session.delivery.request;
  const keys=local.basket.map(x=>x.key);assert.equal(new Set(keys).size,2);
  session.lastSent=0;await add("hWhgrA2dhrk");await send();const second=session.delivery.request;
  await ack(first.requestId);assert.equal(local.basket.length,3);
  await ack(second.requestId);assert.equal(local.basket.length,0);
});
