import PlaylistImport from 'features/youtube/ui/PlaylistImport';
import { urlToId, SearchType } from 'features/youtube/api/youtubeSearch';
import { usePlaylistManager } from 'features/playlists/model/playlistAtoms';
import { PlaylistActionType } from 'shared/model/constants';
import { useState } from 'react';
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import Thumbnail from "shared/ui/Thumbnail";
import { useCurMusicManager } from 'features/queue/model/queue';
import { playlistInfoStateFamily, playlistItemStateFamily } from 'features/playlists/model/playlistAtoms';
import styles from 'features/playlists/pages/PlaylistPage.module.scss';
import { useOpenPlaylistItemOptionsPopup, useOpenPlaylistOptionsPopup } from "features/overlays/PopupStates";
import { MusicInfoActionType, MusicInfoItem } from "shared/model/constants";
import { Suspense } from "react";
import Spinner from "shared/ui/Spinner";
import MoreVert from "shared/ui/MoreVert";
import MusicItem from "features/queue/ui/musicList/MusicItem";
function PlaylistPage() {
    const [resetOpen, setResetOpen] = useState(false);
    const openPlaylistOptionsPopup = useOpenPlaylistOptionsPopup();
    const param = useParams();
    const playlistID = param.id ? param.id : "";
    const playlistInfo = useAtomValue(playlistInfoStateFamily(playlistID));

    return <div className={styles["container"]}>
        <div className={styles["thumbnail"]}>
            <Thumbnail thumbnails={playlistInfo.thumbnails} name={playlistInfo.name}></Thumbnail>
        </div>

        <div className={styles["metadata"]}>
            <div className={styles["metadata__name"]}>
                <div>{playlistInfo.name}</div>
                <MoreVert size={32} onClick={(e) => openPlaylistOptionsPopup(e.target as HTMLElement, playlistID)} />
            </div>
            <div className={styles["metadata__item-count"]}>노래 {playlistInfo.itemCount}곡</div>
            <div className={styles["metadata__description"]} title={playlistInfo.description}>{playlistInfo.description}</div>

        </div>
        <div className={styles["playlist"]}>
            <AddVideo playlistID={playlistID} />
            {playlistInfo.sourcePlaylistUrl && <button onClick={() => setResetOpen(true)}>원본으로 초기화</button>}
            {resetOpen && <div role="dialog" aria-modal="true" aria-label="원본 초기화" style={{position:"fixed",inset:0,zIndex:110,background:"#111e",display:"grid",placeItems:"center"}}><PlaylistImport original={playlistInfo} close={() => setResetOpen(false)} /></div>}
            <br></br>
            <Suspense fallback={<Spinner></Spinner>}>
                <PlaylistItems playlistID={playlistID} />
            </Suspense>

        </div>
        <br></br><br></br><br></br>
    </div>
}

export default PlaylistPage;

function PlaylistItems({ playlistID }: { playlistID: string }) {
    const curMusicManager = useCurMusicManager();
    const manager = usePlaylistManager();
    const [error, setError] = useState('');
    const move = async (from: number, to: number) => {
        const ordered = [...items]; const [item] = ordered.splice(from, 1); ordered.splice(to, 0, item);
        try { await manager({type: PlaylistActionType.UPDATE, payload:{info:{id:playlistID},items:ordered}}); setError(''); } catch(e) {setError((e as Error).message);}
    };
    const openMusicOptionsPopup = useOpenPlaylistItemOptionsPopup();
    const items = useAtomValue(playlistItemStateFamily(playlistID));
    const playMusic = (idx: number | undefined) => {
        curMusicManager({
            type: MusicInfoActionType.SET,
            payload: {
                idx: idx,
                list: items
            }
        });
    }
    const openPopup = (target: HTMLElement, musicInfos: MusicInfoItem[]) => {
        openMusicOptionsPopup(target, playlistID, musicInfos);
    }
    return <>
        {error && <p role="alert">{error}</p>}
        {items.map((item, idx) =>
            <div key={item.key} className={styles["playlist__item"]}>
                <div>{idx + 1}.</div><button aria-label={`${item.name} 위로`} disabled={idx===0} onClick={()=>move(idx,idx-1)}>↑</button><button aria-label={`${item.name} 아래로`} disabled={idx===items.length-1} onClick={()=>move(idx,idx+1)}>↓</button>
                <MusicItem
                    idx={idx}
                    item={item}
                    playMusic={playMusic}
                    openOptionsPopup={openPopup}
                ></MusicItem>
            </div>
        )}
    </>
}

function AddVideo({playlistID}: {playlistID: string}) {
 const [url,setUrl]=useState(''); const [name,setName]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 const manager=usePlaylistManager();
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);try{
   const parsed=urlToId(url); if(parsed.kind!==SearchType.Music) throw new Error('재생목록이 아닌 개별 영상 URL을 넣어 주세요.');
   await manager({type:PlaylistActionType.APPEND,payload:{info:{id:playlistID},items:[{videoID:parsed.id,name:name.trim()||`동영상 (${parsed.id})`,query:'',owner:'',thumbnail:`https://i.ytimg.com/vi/${parsed.id}/default.jpg`}]}});
   setUrl('');setName('');setError('');
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
  <label>추가할 영상 URL<input type="url" required value={url} onChange={e=>setUrl(e.target.value)}/></label>
  <label>곡 이름 (선택)<input maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
  <button disabled={busy}>곡 추가</button>{error&&<p role="alert">{error}</p>}
 </form>;
}
