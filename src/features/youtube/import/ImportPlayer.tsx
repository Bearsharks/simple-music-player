import { useEffect, useRef, useState } from "react";
import { loadIframeApi } from "features/player/api/iframe";
import { pauseMain } from "./pauseMain";

export default function ImportPlayer({ videoId, playToken }: {videoId:string;playToken:number}) {
  const host=useRef<HTMLDivElement>(null), player=useRef<any>(null);
  const current=useRef({videoId,playToken});current.current={videoId,playToken};
  const previousToken=useRef(playToken);
  const [error,setError]=useState("");
  useEffect(()=>{
    let disposed=false;let instance:any;
    loadIframeApi().then(YT=>{
      if(disposed||!host.current)return;
      const mount=document.createElement("div");host.current.replaceChildren(mount);
      instance=new YT.Player(mount,{width:"100%",height:220,videoId:current.current.videoId,playerVars:{autoplay:0,playsinline:1,origin:location.origin},events:{
        onReady:()=>{if(disposed)return;player.current=instance;if(current.current.playToken>0){pauseMain();instance.loadVideoById(current.current.videoId);} },
        onStateChange:(e:any)=>{if(!disposed&&e.data===1)pauseMain();},
        onError:()=>{if(!disposed)setError("이 영상은 재생할 수 없습니다.");},
        onAutoplayBlocked:()=>{if(!disposed)setError("플레이어의 재생 버튼을 눌러 주세요.");},
      }});
    }).catch(()=>{if(!disposed)setError("플레이어를 불러오지 못했습니다.");});
    return ()=>{disposed=true;player.current=null;instance?.destroy();};
  },[]);
  useEffect(()=>{
    setError("");
    if(!player.current)return;
    if(playToken!==previousToken.current&&playToken>0){pauseMain();player.current.loadVideoById(videoId);}
    else player.current.cueVideoById(videoId);
    previousToken.current=playToken;
  },[videoId,playToken]);
  return <section aria-label="미리듣기"><div ref={host}/>{error&&<p role="alert">{error}</p>}</section>;
}
