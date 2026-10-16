import { useEffect, useRef, useState, type FormEvent } from 'react';
import { loadIframeApi } from 'features/player/api/iframe';
import { parsePlaylistUrl } from 'features/library/model/library';
import { usePlaylistManager } from 'features/playlists/model/playlistAtoms';
import { PlaylistActionType } from 'shared/model/constants';
export default function PlaylistImport({close}: {close: () => void}) {
  const [url, setUrl] = useState(''); const [name, setName] = useState('');
  const [id, setId] = useState(''); const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const host = useRef<HTMLDivElement>(null); const playerRef = useRef<any>(null);
  const manager = usePlaylistManager();
  useEffect(() => {
    if (!id) return;
    let cancelled = false; let player: any; let poll: ReturnType<typeof setInterval> | undefined;
    const read = () => {
      const values = player?.getPlaylist?.();
      if (!cancelled && Array.isArray(values) && values.length) {
        if (!values.every((v: unknown) => typeof v === 'string' && /^[\w-]{11}$/.test(v))) { setError('곡 ID 형식을 확인하지 못했습니다.'); return; }
        setIds(previous => previous.join(',') === values.join(',') ? previous : values); setError(''); clearTimeout(timeout);
      }
    };
    const timeout = setTimeout(() => { if (!cancelled) setError('목록이 표시되지 않으면 미리보기에서 재생을 눌러 주세요. 비공개·임베드 제한 목록은 가져올 수 없습니다.'); }, 15000);
    loadIframeApi().then(YT => {
      if (cancelled || !host.current) return;
      const mount = document.createElement('div'); host.current.replaceChildren(mount);
      player = new YT.Player(mount, {width:'100%',height:220,playerVars:{listType:'playlist',list:id,playsinline:1,autoplay:0,origin:location.origin},events:{
        onReady: () => { if (cancelled) return; read(); poll = setInterval(read, 1000); },
        onStateChange: () => { read(); },
        onError: () => { if (!cancelled) setError('YouTube에서 목록을 재생할 수 없습니다. 공개 여부와 임베드 제한을 확인해 주세요.'); },
      }}); playerRef.current = player;
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; clearTimeout(timeout); clearInterval(poll); player?.destroy(); if(playerRef.current === player) playerRef.current = null; };
  }, [id]);
  const preview = (e: FormEvent) => { e.preventDefault(); try { const p = parsePlaylistUrl(url); setIds([]); setError(''); setId(p.id); } catch(e) {setError((e as Error).message);} };
  const save = async () => {
    setBusy(true);
    try {
      await manager({type:PlaylistActionType.CREATE,payload:{info:{id:'',name:name.trim() || 'YouTube 재생목록',description:`원본: https://www.youtube.com/playlist?list=${id}`,itemCount:ids.length,thumbnails:ids.slice(0,4).map(v=>`https://i.ytimg.com/vi/${v}/default.jpg`)},items:ids.map((videoID,i)=>({videoID,name:`동영상 ${i+1} (${videoID})`,query:'',owner:'',thumbnail:`https://i.ytimg.com/vi/${videoID}/default.jpg`}))}});
      close();
    } catch(e) { setError((e as Error).message); } finally {setBusy(false);}
  };
  return <section style={{padding:16,maxWidth:560,width:'min(90vw,560px)',maxHeight:'85vh',overflow:'auto'}} aria-label="재생목록 URL 가져오기">
    <h2>재생목록 URL 가져오기</h2>
    <form onSubmit={preview}><label>공개 재생목록 URL<input style={{width:'100%'}} type="url" required value={url} onChange={e=>setUrl(e.target.value)} /></label><label>목록 이름<input style={{width:'100%'}} maxLength={120} value={name} onChange={e=>setName(e.target.value)} /></label><button>미리보기</button></form>
    <div ref={host} style={{minHeight:id?220:0}} />
    <p role="status">{ids.length ? `플레이어가 제공한 ${ids.length}곡을 로컬 편집 목록으로 저장합니다.` : '목록을 미리보기에서 불러온 뒤 저장하세요.'}</p>
    <p>API 키 없이 곡 ID와 썸네일을 가져옵니다. 곡 제목은 자동 조회하지 않습니다. 원본 전체 포함 여부는 보장하지 않으며, 저장 후 원본 변경이 편집본을 덮어쓰지 않습니다.</p>
    {error && <p role="alert">{error}</p>}
    <button disabled={!ids.length || busy} onClick={save}>{busy?'저장 중…':'로컬에 저장'}</button> <button disabled={busy} onClick={close}>취소</button>
  </section>;
}
