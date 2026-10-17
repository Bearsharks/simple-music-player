import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM,VirtualConsole} from "jsdom";

const source=readFileSync(new URL("./content.js",import.meta.url),"utf8");
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({initialReadFailure=false}={}) {
  const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on("jsdomError",error=>errors.push(error.message));
  const dom=new JSDOM('<ytd-video-renderer><ytd-thumbnail><a href="/watch?v=azNG-AU0eGg">video</a></ytd-thumbnail><h3>Title</h3></ytd-video-renderer>',{
    url:"https://www.youtube.com/results?search_query=test",runScripts:"outside-only",pretendToBeVisual:true,virtualConsole,
  });
  const state={mode:"ok",alive:true,calls:0,mutationsDisconnected:0,resizesDisconnected:0,storageListener:null,basket:[{kind:"video",id:"azNG-AU0eGg"}]};
  const {window}=dom;
  const Observer=window.MutationObserver;
  window.MutationObserver=class extends Observer {disconnect(){state.mutationsDisconnected++;super.disconnect();}};
  window.ResizeObserver=class {observe(){}unobserve(){}disconnect(){state.resizesDisconnected++;}};
  window.chrome={runtime:{get id(){return state.alive?"lpkemppmemlhcggfjcdimmcpfbdjgfdb":undefined;},sendMessage(){
    state.calls++;
    if(state.mode==="sync")throw Error("Extension context invalidated.");
    if(state.mode==="async")return Promise.reject(Error("Extension context invalidated."));
    if(state.mode==="temporary")return Promise.reject(Error("Receiving end does not exist."));
    return Promise.resolve({ok:true,count:state.basket.length});
  }},storage:{local:{
    get(){if(initialReadFailure)throw Error("Extension context invalidated.");return Promise.resolve({youtubeUiVisible:true});},
    set(){if(state.mode==="storage")throw Error("Extension context invalidated.");return Promise.resolve();},
  },onChanged:{addListener(fn){state.storageListener=fn;},removeListener(fn){if(state.storageListener===fn)state.storageListener=null;}}}};
  window.eval(source);
  const scan=()=>window.document.dispatchEvent(new window.Event("yt-navigate-finish"));
  return {dom,window,state,errors,scan};
}
for(const mode of ["sync","async"])test(`stops invalidated content scripts after a ${mode} send failure`,async()=>{
  const f=fixture();try{
    await tick();const basket=JSON.stringify(f.state.basket);f.state.mode=mode;
    f.window.document.querySelector("a").href="/watch?v=hWhgrA2dhrk";f.scan();await tick();
    const calls=f.state.calls;
    assert.equal(f.window.document.querySelector("#loopy-thumbnail-actions"),null);
    assert.equal(f.window.document.querySelector("#loopy-import-overlay"),null);
    assert.match(f.window.document.querySelector('[role="status"]').textContent,/새로고침/);
    assert.equal(f.state.mutationsDisconnected,1);assert.equal(f.state.resizesDisconnected,1);assert.equal(f.state.storageListener,null);
    f.window.document.querySelector("a").href="/watch?v=yDv6qdiw_WE";f.scan();
    f.window.dispatchEvent(new f.window.Event("resize"));f.window.document.dispatchEvent(new f.window.Event("scroll"));await tick();
    assert.equal(f.state.calls,calls);assert.equal(JSON.stringify(f.state.basket),basket);assert.deepEqual(f.errors,[]);
  }finally{f.dom.window.close();}
});
test("guards user actions when the runtime ID disappears",async()=>{
  const f=fixture();try{await tick();f.state.alive=false;const calls=f.state.calls;
    [...f.window.document.querySelectorAll("#loopy-bridge-tools button")].find(el=>el.textContent==="연동하기").click();
    await tick();assert.equal(f.state.calls,calls);assert.equal(f.window.document.querySelector("#loopy-import-overlay"),null);assert.deepEqual(f.errors,[]);
  }finally{f.dom.window.close();}
});
test("contains synchronous storage failures during startup and visibility changes",async()=>{
  const first=fixture({initialReadFailure:true});try{await tick();assert.equal(first.state.mutationsDisconnected,1);assert.deepEqual(first.errors,[]);}finally{first.dom.window.close();}
  const f=fixture();try{await tick();f.state.mode="storage";f.window.document.querySelector(".loopy-hide-ui").click();await tick();assert.equal(f.state.mutationsDisconnected,1);assert.equal(f.state.basket.length,1);assert.deepEqual(f.errors,[]);}finally{f.dom.window.close();}
});
test("does not stop a valid context on a transient message failure",async()=>{
  const f=fixture();try{await tick();f.state.mode="temporary";f.window.document.querySelector("a").href="/watch?v=hWhgrA2dhrk";f.scan();await tick();
    assert.equal(f.state.mutationsDisconnected,0);assert.ok(f.window.document.querySelector("#loopy-thumbnail-actions"));
    f.state.mode="ok";const calls=f.state.calls;f.window.document.querySelector(".loopy-collect").click();await tick();assert.equal(f.state.calls,calls+1);assert.deepEqual(f.errors,[]);
  }finally{f.dom.window.close();}
});
