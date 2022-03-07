import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import Thumbnail from "../components/Thumbnail";
import { playlistInfoStateFamily, playlistItemStateFamily, useCurMusicManager } from "../recoilStates/playlistAtoms";
import styles from './PlaylistPage.module.scss';
import { MusicItem } from "../components/MusicList";
import { useOpenPlaylistItemOptionsPopup, useOpenPlaylistOptionsPopup } from "../Popups/PopupStates";
import { MusicInfoActionType, MusicInfoItem } from "../refs/constants";
import { Suspense } from "react";
import Spinner from "../components/Spinner";
import MoreVert from "../components/MoreVert";
function PlaylistPage() {
    const openPlaylistOptionsPopup = useOpenPlaylistOptionsPopup();
    const param = useParams();
    const playlistID = param.id ? param.id : "";
    const playlistInfo = useRecoilValue(playlistInfoStateFamily(playlistID));

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
    const openMusicOptionsPopup = useOpenPlaylistItemOptionsPopup();
    const items = useRecoilValue(playlistItemStateFamily(playlistID));
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
        {items.map((item, idx) =>
            <div key={item.key} className={styles["playlist__item"]}>
                <div>{idx + 1}.</div>
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