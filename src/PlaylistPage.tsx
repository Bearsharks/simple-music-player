import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import Thumbnail from "./components/Thumbnail";
import { playlistInfoStateFamily, playlistItemStateFamily, useCurMusicManager } from "./recoilStates/atoms/playlistAtoms";
import styles from './PlaylistPage.module.scss';
import { MusicItem } from "./components/MusicList";
import { useOpenPlaylistItemOptionsPopup, useOpenPlaylistOptionsPopup } from "./Popups/PopupStates";
import { MusicInfoActionType, MusicInfoItem } from "./refs/constants";
function PlaylistPage() {
    const curMusicManager = useCurMusicManager();
    const openMusicOptionsPopup = useOpenPlaylistItemOptionsPopup();
    const openPlaylistOptionsPopup = useOpenPlaylistOptionsPopup();
    const param = useParams();
    const playlistID = param.id ? param.id : "";
    const playlistInfo = useRecoilValue(playlistInfoStateFamily(playlistID));
    const playlistItems = useRecoilValue(playlistItemStateFamily(playlistID));
    const playMusic = (idx: number | undefined) => {
        curMusicManager({
            type: MusicInfoActionType.SET,
            payload: {
                idx: idx,
                list: playlistItems
            }
        });
    }
    const openPopup = (target: HTMLElement, musicInfos: MusicInfoItem[]) => {
        openMusicOptionsPopup(target, playlistID, musicInfos);
    }
    return <div className={styles["container"]}>
        <div className={styles["thumbnail"]}>
            <Thumbnail thumbnails={playlistInfo.thumbnails} name={playlistInfo.name}></Thumbnail>
        </div>

        <div className={styles["metadata"]}>
            <div className={styles["metadata__name"]}>
                {playlistInfo.name}
                <div className={styles["morevert"]} onClick={(e) => openPlaylistOptionsPopup(e.target as HTMLElement, playlistID)}>
                    <span className="material-icons">
                        more_vert
                    </span>
                </div>
            </div>
            <div className={styles["metadata__item-count"]}>노래 {playlistInfo.itemCount}곡</div>
            <div className={styles["metadata__description"]} title={playlistInfo.description}>{playlistInfo.description}</div>

        </div>
        <div className={styles["playlist"]}>
            <br></br>
            {playlistItems.map((item, idx) =>
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
        </div>
        <br></br><br></br><br></br>
    </div>
}

export default PlaylistPage;