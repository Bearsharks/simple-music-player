import { loadIframeApi } from "features/player/api/iframe";
import { fetchVideoTitles } from "../api/videoMetadata";
import type { ImportItem } from "./contract";
import type { Resolved } from "./model";
import { pauseMain } from "./pauseMain";

export const MAX_TRACKS = 2000;
function aborted(signal: AbortSignal) { if (signal.aborted) throw new DOMException("취소됨", "AbortError"); }

/** A stable snapshot of the player's exposed IDs, never a full-playlist guarantee. */
export function readPlaylist(id: string, host: HTMLElement, signal: AbortSignal): Promise<string[]> {
  return new Promise((resolve,reject) => {
    let player: any, poll: ReturnType<typeof setInterval> | undefined;
    let done=false, previous="", stable=0;
    const finish=(error?:Error, ids?:string[])=>{
      if(done)return;done=true;clearTimeout(timeout);clearInterval(poll);signal.removeEventListener("abort",cancel);
      player?.destroy();host.replaceChildren();error?reject(error):resolve(ids!);
    };
    const cancel=()=>finish(new DOMException("취소됨","AbortError"));
    const timeout=setTimeout(()=>finish(new Error("재생목록을 불러오지 못했습니다. 공개 여부와 임베드 제한을 확인하세요.")),20000);
    signal.addEventListener("abort",cancel,{once:true});if(signal.aborted){cancel();return;}
    const read=()=>{
      if(done)return;
      try {
        const ids=player?.getPlaylist?.();if(!Array.isArray(ids)||!ids.length)return;
        if(ids.length>MAX_TRACKS||!ids.every(id=>typeof id==="string"&&/^[\w-]{11}$/.test(id)))throw Error("재생목록 항목을 확인할 수 없습니다.");
        const current=ids.join(",");stable=current===previous?stable+1:0;previous=current;
        if(stable>=2)finish(undefined,[...ids]);
      }catch(e){finish(e instanceof Error?e:new Error("재생목록 조회 실패"));}
    };
    loadIframeApi().then(YT=>{
      if(done)return;
      const mount=document.createElement("div");host.replaceChildren(mount);
      player=new YT.Player(mount,{width:"100%",height:220,playerVars:{listType:"playlist",list:id,autoplay:0,playsinline:1,origin:location.origin},events:{
        onReady:()=>{ if(done)return;poll=setInterval(read,500);read(); },
        onStateChange:(e:any)=>{if(e.data===1)pauseMain();},
        onError:()=>finish(new Error("재생목록을 열 수 없습니다. 공개 여부와 임베드 제한을 확인하세요.")),
      }});
      if(done)player.destroy();
    }).catch(error=>finish(error instanceof Error?error:new Error("플레이어 로드 실패")));
  });
}

export async function resolveImport(items: readonly ImportItem[], host: HTMLElement, signal: AbortSignal,
  playlistReader = readPlaylist, metadataReader = fetchVideoTitles): Promise<Resolved> {
  const ids:string[]=[];
  // Sequential expansion preserves input order and duplicate occurrences.
  for(const item of items){
    aborted(signal);
    ids.push(...(item.kind==="video"?[item.id]:await playlistReader(item.id,host,signal)));
    if(ids.length>MAX_TRACKS)throw new Error(`한 번에 ${MAX_TRACKS}곡까지 가져올 수 있습니다.`);
  }
  aborted(signal);
  if(!ids.length)throw new Error("가져올 수 있는 곡이 없습니다.");
  const metadata=await metadataReader(ids,signal);aborted(signal);
  return { limited:items.some(item=>item.kind==="playlist"),tracks:ids.map(videoID=>({
    videoID,name:metadata[videoID]?.name||`동영상 (${videoID})`,owner:metadata[videoID]?.owner||"",query:"",thumbnail:`https://i.ytimg.com/vi/${videoID}/default.jpg`,
  }))};
}
