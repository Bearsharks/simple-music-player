import { test } from "node:test";
import assert from "node:assert/strict";
import { releaseUpdate, checkUpdate } from "./updates.js";

const release = tag_name => ({tag_name,assets:[{name:"loopy-extension.zip",browser_download_url:"https://untrusted.invalid/file"}]});
test("only a newer published release with the expected asset yields a fixed GitHub download URL",()=>{
  assert.deepEqual(releaseUpdate(release("v0.3.0"),"0.2.1"),{version:"0.3.0",url:"https://github.com/Bearsharks/loop-yt-player/releases/download/v0.3.0/loopy-extension.zip"});
  for(const data of [release("v0.2.1"),release("v0.1.9"),release("../../bad"),{...release("v0.3.0"),draft:true},{...release("v0.3.0"),prerelease:true},{tag_name:"v0.3.0",assets:[]},{tag_name:"v0.3.0",assets:{}}])assert.equal(releaseUpdate(data,"0.2.1"),null);
});
test("checks only GitHub without credentials, caches the result, and tolerates failure",async()=>{
  let data={}, calls=0;
  globalThis.chrome={storage:{session:{get:async()=>data,set:async value=>Object.assign(data,value)}}};
  const originalFetch=globalThis.fetch;
  try{
    globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,"https://api.github.com/repos/Bearsharks/loop-yt-player/releases/latest");assert.equal(options.credentials,"omit");assert.equal(options.redirect,"error");assert.equal(options.cache,"no-store");return new Response(JSON.stringify(release("v0.3.0")),{status:200});};
    assert.equal((await checkUpdate("0.2.1")).update.version,"0.3.0");
    await checkUpdate("0.2.1");assert.equal(calls,1);
    await checkUpdate("0.2.1",true);assert.equal(calls,2);
    globalThis.fetch=async()=>{calls++;throw Error("offline");};assert.deepEqual(await checkUpdate("0.2.1",true),{ok:false});
    await checkUpdate("0.2.1");assert.equal(calls,3);
    globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify(release("v0.3.1")),{status:200});};
    assert.equal((await checkUpdate("0.2.1",true)).update.version,"0.3.1");assert.equal(calls,4);
  }finally{globalThis.fetch=originalFetch;}
});
