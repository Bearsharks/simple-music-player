import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validEnvelope, validItem, allowedApp } from "../../extension/protocol.js";
import { reducer, initial } from "features/youtube/import/model";
import { resolveImport } from "features/youtube/import/resolve";
import type { ImportEnvelope } from "features/youtube/import/contract";
import { connectImportBridge } from "features/youtube/import/bridge";
import { parsePlaylistUrl } from "features/youtube/api/playlistUrl";

const video="azNG-AU0eGg", second="hWhgrA2dhrk", playlist="PLVKdYxm17gBYbyZYbHWZDr7NU3ZwtFiB5";
const request=(n=1):ImportEnvelope=>({type:"loopy.import",version:1,requestId:`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`,items:[{kind:"video",id:video}]});
const music=(id:string)=>({videoID:id,name:id,owner:"",query:"",thumbnail:`https://i.ytimg.com/vi/${id}/default.jpg`});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();});

describe("extension import contract",()=>{
  it("shares playlist syntax with playlist creation including mix IDs",()=>{
    for(const id of ["RDazNG-AU0eGg","WL","LL","HL",playlist]){
      expect(validItem({kind:"playlist",id})).toBe(true);
      expect(parsePlaylistUrl(`https://www.youtube.com/playlist?list=${id}`).id).toBe(id);
    }
  });
  it("accepts only kind/id items and strict versioned envelopes",()=>{
    expect(validEnvelope(request())).toBe(true);
    for(const item of [{kind:"video",id:video,url:"https://evil.test"},{kind:"video",id:"<script>"},{kind:"other",id:video},{kind:"playlist",id:"../../path"}]) expect(validItem(item)).toBe(false);
    expect(validEnvelope({...request(),extra:true})).toBe(false);
    expect(validEnvelope({...request(),version:2})).toBe(false);
    expect(validEnvelope({...request(),items:Array(101).fill(request().items[0])})).toBe(false);
    expect(validEnvelope({...request(),items:[]})).toBe(false);
  });
  it("restricts web callers to exact allowed origins and development paths",()=>{
    expect(allowedApp("https://loopy.bearsharks.dev/")).toBe(true);
    expect(allowedApp("http://127.0.0.1:4187/simple-music-player/")).toBe(false);
    expect(allowedApp("http://127.0.0.1:4187/simple-music-player")).toBe(false);
    for(const url of ["https://loopy.bearsharks.dev.evil.test/","https://evil.test/","http://127.0.0.1:6666/simple-music-player/","http://localhost:4187/other/"])expect(allowedApp(url)).toBe(false);
  });
  it("keeps latest pending without modifying edits, preserves failure and rejects stale completion",()=>{
    let s=reducer(initial,{type:"receive",request:request()});
    s=reducer(s,{type:"resolved",id:request().requestId,value:{tracks:[music(video)],limited:false}});
    s=reducer(s,{type:"edit",field:"title",value:"내 제목"});const draft=s.draft;
    s=reducer(s,{type:"receive",request:request(2)});s=reducer(s,{type:"receive",request:request(3)});
    expect(s.pending?.requestId).toBe(request(3).requestId);expect(s.draft).toBe(draft);expect(s.resolving).toBeNull();
    s=reducer(s,{type:"replace"});s=reducer(s,{type:"failed",id:request(3).requestId,error:"failed"});expect(s.draft).toBe(draft);
    expect(reducer(s,{type:"resolved",id:request(2).requestId,value:{tracks:[],limited:false}})).toBe(s);
    s=reducer(s,{type:"retry"});s=reducer(s,{type:"receive",request:request(4)});
    s=reducer(s,{type:"resolved",id:request(3).requestId,value:{tracks:[music(second)],limited:true}});
    expect(s.pending?.requestId).toBe(request(4).requestId);expect(s.draft?.tracks[0].videoID).toBe(second);
  });
  it("expands deterministically preserving order and repeats; metadata failure keeps IDs",async()=>{
    const reader=vi.fn().mockResolvedValue([second,video]);
    const value=await resolveImport([{kind:"video",id:video},{kind:"playlist",id:playlist},{kind:"video",id:second}],document.createElement("div"),new AbortController().signal,reader,async()=>({}));
    expect(value.tracks.map(t=>t.videoID)).toEqual([video,second,video,second]);expect(value.limited).toBe(true);
    expect(value.tracks[0].name).toBe(`동영상 (${video})`);
  });
  it("rejects excessive expansion and aborted work",async()=>{
    await expect(resolveImport([{kind:"playlist",id:playlist}],document.createElement("div"),new AbortController().signal,async()=>Array(2001).fill(video),async()=>({}))).rejects.toThrow("2000");
    const c=new AbortController();c.abort();await expect(resolveImport(request().items,document.createElement("div"),c.signal)).rejects.toThrow();
  });
  it("checks once, receives notifications through a verified pull, and never polls",async()=>{
    vi.useFakeTimers();let response:unknown={ok:true,request:request()};
    const sendMessage=vi.fn((_id:string,msg:any,cb:(r:unknown)=>void)=>cb(msg.type==="loopy.pull"?response:{ok:true}));
    vi.stubGlobal("chrome",{runtime:{sendMessage}});
    const receive=vi.fn(),status=vi.fn();const stop=connectImportBridge(receive,status);
    await vi.advanceTimersByTimeAsync(60000);expect(receive).toHaveBeenCalledTimes(1);expect(sendMessage).toHaveBeenCalledTimes(2);
    const wake=(data:unknown={type:"loopy.delivery.available"},origin=location.origin)=>window.dispatchEvent(new MessageEvent("message",{source:window,origin,data}));
    wake(request(2));wake({type:"loopy.delivery.available"},"https://evil.test");
    await vi.advanceTimersByTimeAsync(60000);expect(sendMessage).toHaveBeenCalledTimes(2);
    response={ok:true,request:{...request(2),items:[{kind:"video",id:video,html:"bad"}]}};
    wake();await vi.advanceTimersByTimeAsync(1);expect(receive).toHaveBeenCalledTimes(1);
    response={ok:true,request:request(2)};wake();await vi.advanceTimersByTimeAsync(1);expect(receive).toHaveBeenCalledTimes(2);
    wake();await vi.advanceTimersByTimeAsync(1);expect(receive).toHaveBeenCalledTimes(2);
    stop();const calls=sendMessage.mock.calls.length;wake();await vi.advanceTimersByTimeAsync(60000);expect(sendMessage).toHaveBeenCalledTimes(calls);vi.unstubAllGlobals();
  });
  it("does not retry an unavailable extension until the caller reconnects",async()=>{
    vi.useFakeTimers();const sendMessage=vi.fn((_id:string,_message:unknown,cb:(r:unknown)=>void)=>cb({ok:false}));
    vi.stubGlobal("chrome",{runtime:{sendMessage}});const status=vi.fn();let stop=connectImportBridge(vi.fn(),status);
    await vi.advanceTimersByTimeAsync(60000);expect(sendMessage).toHaveBeenCalledOnce();expect(status).toHaveBeenLastCalledWith(false);
    stop();stop=connectImportBridge(vi.fn(),status);await vi.advanceTimersByTimeAsync(1);expect(sendMessage).toHaveBeenCalledTimes(2);stop();vi.unstubAllGlobals();
  });
});
