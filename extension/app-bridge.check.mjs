import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
test("relays only internal payload-free notifications",()=>{
  let listener;const posted=[], replies=[];
  vm.runInNewContext(readFileSync(new URL("./app-bridge.js",import.meta.url),"utf8"),{
    chrome:{runtime:{id:"extension",onMessage:{addListener:fn=>listener=fn}}},
    window:{postMessage:(data,origin)=>posted.push({data,origin})},location:{origin:"https://loopy.bearsharks.dev"},
  });
  const reply=value=>replies.push(value);
  listener({type:"loopy.delivery.available"},{id:"other"},reply);
  listener({type:"loopy.delivery.available",items:[]},{id:"extension"},reply);
  listener({type:"loopy.import"},{id:"extension"},reply);assert.equal(posted.length,0);
  listener({type:"loopy.delivery.available"},{id:"extension"},reply);
  assert.equal(JSON.stringify(posted),JSON.stringify([{data:{type:"loopy.delivery.available"},origin:"https://loopy.bearsharks.dev"}]));assert.equal(replies.length,1);
});
