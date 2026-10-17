import { useEffect, useReducer, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Dialog from "shared/ui/Dialog";
import Icon from "shared/ui/Icon";
import FieldError from "shared/ui/FieldError";
import { useNotice } from "features/overlays/Notice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "shared/ui/shadcn/dropdown-menu";
import Cover from "shared/ui/Cover";
import { Button } from "shared/ui/shadcn/button";
import { Input } from "shared/ui/shadcn/input";
import { Textarea } from "shared/ui/shadcn/textarea";
import { Label } from "shared/ui/shadcn/label";
import { useMusicListManager } from "features/queue/model/queue";
import { usePlaylistManager } from "features/playlists/model/playlistAtoms";
import { MusicListActionType, PlaylistActionType } from "shared/model/constants";
import { initial, reducer } from "./model";
import { validEnvelope, type ImportEnvelope } from "./contract";
import { resolveImport } from "./resolve";
import { connectImportBridge } from "./bridge";
import ImportPlayer from "./ImportPlayer";
import { pauseMain } from "./pauseMain";
import ExtensionInstall from "./ExtensionInstall";
import "./editor.scss";
import "./import.scss";

export default function ExtensionImport() {
  const [state,dispatch]=useReducer(reducer,initial);
  const [connected,setConnected]=useState<boolean|null>(null),[query,setQuery]=useState("");
  const [installOpen,setInstallOpen]=useState(false),[connectionCheck,setConnectionCheck]=useState(0);
  const [writing,setWriting]=useState(false),[actionError,setActionError]=useState("");
  const [menuHost,setMenuHost]=useState<HTMLDivElement|null>(null);
  const [selected,setSelected]=useState(""),[playToken,setPlayToken]=useState(0),[dragging,setDragging]=useState(false);
  const notice=useNotice();
  const [nameTouched,setNameTouched]=useState(false);
  const nameError=nameTouched&&state.draft&&!state.draft.title.trim()?"재생목록 이름을 입력하세요.":"";
  const resolveHost=useRef<HTMLDivElement>(null),writingRef=useRef(false);
  const replacementBanner=useRef<HTMLElement>(null);
  const trackButtons=useRef(new Map<string,HTMLButtonElement>());
  const latestState=useRef(state);latestState.current=state;
  const receivedIds=useRef(new Set<string>());
  const queue=useMusicListManager(),playlists=usePlaylistManager();
  const tracks=state.draft?.tracks||[], active=tracks.find(t=>t.key===selected)||tracks[0];
  const busy=writing||!!state.resolving;
  const checkConnection=()=>{setConnected(null);setConnectionCheck(n=>n+1);};
  const receive=(request:ImportEnvelope)=>{if(validEnvelope(request)){dispatch({type:"receive",request});}};
  useEffect(()=>connectImportBridge(receive,setConnected,receivedIds.current),[connectionCheck]);
  useEffect(()=>{if(connected)setInstallOpen(false);},[connected]);
  useEffect(()=>{replacementBanner.current?.scrollIntoView({block:"nearest"});},[state.pending?.requestId]);
  useEffect(()=>{
    if(!state.resolving||!resolveHost.current)return;
    const controller=new AbortController(),request=state.resolving;
    const deadline=setTimeout(()=>{dispatch({type:"failed",id:request.requestId,error:"조회 시간이 초과되었습니다. 항목을 나누어 다시 보내세요."});controller.abort();},120000);
    void resolveImport(request.items,resolveHost.current,controller.signal).then(value=>{
      if(controller.signal.aborted)return;
      dispatch({type:"resolved",id:request.requestId,value});setSelected("");setPlayToken(0);setActionError("");setNameTouched(false);
    },error=>{if(!controller.signal.aborted)dispatch({type:"failed",id:request.requestId,error:error instanceof Error?error.message:"조회에 실패했습니다."});});
    return ()=>{clearTimeout(deadline);controller.abort();};
  },[state.resolving]);
  const close=()=>{if(writingRef.current||dragging)return;dispatch({type:"close"});setActionError("");setPlayToken(0);};
  async function apply(kind:"next"|"append"|"save", trackKey?:string) {
    if(writingRef.current||busy||!state.draft||!tracks.length)return;
    if(kind==="save"&&!state.draft.title.trim()){setNameTouched(true);document.getElementById("li-title")?.focus();return;}
    writingRef.current=true;setWriting(true);setActionError("");
    try {
      const items=tracks.filter(track=>!trackKey||track.key===trackKey).map(({key: _key,...item})=>item);
      if(!items.length)return;
      if(kind==="save")await playlists({type:PlaylistActionType.CREATE,payload:{info:{id:"",name:state.draft.title.trim(),description:state.draft.description,thumbnails:items.slice(0,4).map(t=>t.thumbnail),itemCount:items.length},items}});
      else await queue({type:kind==="next"?MusicListActionType.ADD_TO_NEXT:MusicListActionType.APPEND_ITEMS,payload:items});
      // Incoming requests received during a write remain available as the next draft.
      notice(kind==="save"?"재생목록을 저장했습니다.":"추가되었습니다.");
      if(kind!=="save")return;
      const pending=latestState.current.pending;
      dispatch({type:"close"});
      if(pending)dispatch({type:"receive",request:pending});
    }catch(error){setActionError(error instanceof Error?error.message:"적용하지 못했습니다.");}
    finally{writingRef.current=false;setWriting(false);}
  }
  return <>
    <div className="li-toolbar">
      <form onSubmit={event=>{event.preventDefault();const q=query.trim();if(q)window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&loopy=1`,"_blank","noopener,noreferrer");}}>
        <Input aria-label="YouTube 검색어" placeholder="YouTube 검색" maxLength={200} value={query} onChange={e=>setQuery(e.target.value)}/>
        <Button type="submit" variant="ghost" size="icon" aria-label="YouTube에서 검색"><Icon name="search"/></Button>
      </form>
      {connected===false&&<Button variant="outline" onClick={()=>setInstallOpen(true)}>확장 프로그램 다운로드</Button>}
      {connected!==true&&<Button variant="ghost" disabled={connected===null} onClick={checkConnection}>{connected===null?"확인 중…":"연결 확인"}</Button>}
    </div>
    {installOpen&&!state.open&&<ExtensionInstall checking={connected===null} onClose={()=>setInstallOpen(false)} onCheck={checkConnection}/>}
    {state.open&&<Dialog label="목록 편집" className="yi-dialog" onClose={()=>{}}>
      <div ref={setMenuHost} className="li-dialog-body" aria-busy={writing}>
      <header className="yi-header"><h2>목록 편집</h2><Button variant="ghost" size="icon" disabled={writing||dragging} aria-label="목록 편집 닫기" onClick={close}><Icon name="close"/></Button></header>
      <div className="yi-scroll">
        {state.pending&&<section ref={replacementBanner} className="yi-replacement" aria-label="최신 요청 교체 확인"><div role="status"><Icon name="download"/><div><strong>새 요청</strong><p>{state.pending.items.length}개 항목 · 교체하면 현재 편집 내용이 바뀝니다.</p></div></div><div className="yi-replacement-actions"><Button variant="outline" disabled={writing} onClick={()=>dispatch({type:"keep"})}>현재 편집 유지</Button><Button disabled={busy} onClick={()=>dispatch({type:"replace"})}>최신 목록으로 교체</Button></div></section>}
        {(state.error||actionError)&&<div className="yi-error" role="alert"><Icon name="warning"/>{state.error||actionError}{state.retry&&<Button disabled={busy} variant="outline" onClick={()=>dispatch({type:"retry"})}>다시 시도</Button>}</div>}
        {state.resolving&&<section className="li-resolving"><div className="li-progress" role="status"><Icon name="reset"/><span>가져오는 중…</span></div><div className="li-resolve-host" aria-hidden="true" inert ref={resolveHost}/></section>}
        {state.draft&&!state.resolving&&<div className="yi-workspace">
          <aside className="yi-editor" aria-label="미리듣기와 재생목록 정보">
            {active&&!state.resolving&&<ImportPlayer key={tracks[0]?.key.split("-").slice(0,-1).join("-")} videoId={active.videoID} playToken={playToken}/>}
            <div className="yi-fields"><div><Label htmlFor="li-title">재생목록 이름</Label><Input id="li-title" maxLength={120} disabled={busy} aria-required="true" aria-invalid={!!nameError||undefined} aria-describedby={nameError?"li-title-error":undefined} value={state.draft.title} onBlur={()=>setNameTouched(true)} onChange={e=>dispatch({type:"edit",field:"title",value:e.target.value})}/><FieldError id="li-title-error" message={nameError}/></div><div><Label htmlFor="li-description">설명</Label><Textarea id="li-description" maxLength={5000} disabled={busy} value={state.draft.description} onChange={e=>dispatch({type:"edit",field:"description",value:e.target.value})}/></div></div>
          </aside>
          <section className="yi-track-section" aria-label="가져온 곡 편집"><div className="yi-track-heading"><h3>곡 <span>{tracks.length}</span></h3><div className="li-queue-actions"><Button variant="outline" disabled={busy||dragging||!tracks.length} onClick={()=>void apply("next")}>다음 재생</Button><Button variant="outline" disabled={busy||dragging||!tracks.length} onClick={()=>void apply("append")}>대기열에 추가</Button></div></div>
            {state.draft.limited&&<p className="li-limitation">플레이어가 제공한 곡만 포함됩니다. 원본 전체가 아닐 수 있습니다.</p>}
            <DragDropContext onBeforeDragStart={()=>setDragging(true)} onDragEnd={({source,destination})=>{setDragging(false);if(destination)dispatch({type:"move",from:source.index,to:destination.index});}} dragHandleUsageInstructions="Space로 이동 시작, 방향키로 이동, Space로 완료, Escape로 취소합니다.">
              <Droppable droppableId="loopy-import">{drop=><ol className="yi-track-list" ref={drop.innerRef} {...drop.droppableProps}>
                {tracks.map((track,index)=><Draggable key={track.key} draggableId={track.key} index={index} disableInteractiveElementBlocking isDragDisabled={busy}>{(drag,snapshot)=><li data-dragging={snapshot.isDragging||undefined} className={`yi-track li-track ${active?.key===track.key?"selected":""}`} ref={drag.innerRef} {...drag.draggableProps}>
                  <Button variant="ghost" size="icon" className="yi-grip" {...drag.dragHandleProps} disabled={busy} aria-label={`${track.name} 순서 드래그`}><Icon name="grip"/></Button>
                  <button ref={node=>{if(node)trackButtons.current.set(track.key,node);else trackButtons.current.delete(track.key);}} className="yi-track-select" disabled={busy} aria-label={`${track.name} 미리듣기`} onClick={()=>{setSelected(track.key);setPlayToken(n=>n+1);pauseMain();}}><Cover id={track.videoID} thumbnail={track.thumbnail}/><span><strong>{track.name}</strong><small>{track.owner}</small></span></button>
                  <Button className="yi-delete" variant="ghost" size="icon" disabled={busy||dragging} aria-label={`${track.name} 삭제`} onClick={()=>{const next=tracks[index+1]||tracks[index-1];dispatch({type:"remove",key:track.key});if(active?.key===track.key){setSelected("");setPlayToken(0);}requestAnimationFrame(()=>{if(next)trackButtons.current.get(next.key)?.focus();else document.getElementById("li-title")?.focus();});}}><Icon name="trash"/></Button>
                  <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={busy||dragging} aria-label={`${track.name} 대기열 작업`}><Icon name="more"/></Button></DropdownMenuTrigger><DropdownMenuContent portalContainer={menuHost} align="end"><DropdownMenuItem disabled={busy} onSelect={()=>void apply("next",track.key)}>다음 재생</DropdownMenuItem><DropdownMenuItem disabled={busy} onSelect={()=>void apply("append",track.key)}>대기열에 추가</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </li>}</Draggable>)}{drop.placeholder}
              </ol>}</Droppable>
            </DragDropContext>
            {!tracks.length&&<p>곡 없음</p>}
          </section>
        </div>}
      </div>
      <footer className="yi-footer"><div className="yi-footer-actions"><Button disabled={busy||dragging||!tracks.length||!state.draft?.title.trim()} onClick={()=>void apply("save")}>{writing?"적용 중…":"재생목록 저장"}</Button></div></footer>
      </div>
    </Dialog>}
  </>;
}
