
import { ChangeEvent, useState } from "react";
import { PlaylistInfo } from "../refs/constants";
import styles from './Playlists.module.scss';
import Thumbnail from "./Thumbnail";

export interface PlaylistsProps {
    goToPlaylistPage: (id: string) => void;
    openCreatePlaylistPopup: () => void;
    playlistInfos: PlaylistInfo[],
    playPlaylist: (id: string) => void,
    openOptionsSelector: (e: React.MouseEvent<HTMLElement>, playlistID: string) => void
}
enum SortBy_ {
    Lastest, ABC
}
export default function Playlists(props: PlaylistsProps) {
    const [sortBy, setSortBy] = useState(SortBy_.Lastest);
    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSortBy(parseInt(e.target.value));
    }
    const sortList = (): PlaylistInfo[] => {
        if (sortBy === SortBy_.Lastest) {
            return props.playlistInfos.slice().reverse()
        }
        return props.playlistInfos.slice().sort((a, b) => {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        })
    }
    return (
        <div className={styles['wrapper']}>
            <div>재생목록</div>
            <select onChange={handleChange} defaultValue={SortBy_.Lastest}>
                <option value={SortBy_.Lastest}>최근 추가순</option>
                <option value={SortBy_.ABC}>가나다</option>
            </select>
            <div className={styles['grid-container']}>
                <div className={styles['grid-item']} title={"새 재생목록"} onClick={props.openCreatePlaylistPopup}>
                    <img className={styles['add-icon']} alt={"새 재생목록"}
                        src={"https://www.gstatic.com/youtube/media/ytm/images/pbg/create-playlist-@210.png"}></img>
                    <div>
                        새 재생목록
                    </div>
                </div>{sortList().map((el: PlaylistInfo) =>
                    <div className={styles['grid-item']} key={el.id}
                        title={el.description}
                    >
                        <div className={styles['thumbnail']} >
                            <Thumbnail thumbnails={el.thumbnails} name={el.name}></Thumbnail>
                            <div className={styles['thumbnail__overlay']} onClick={() => props.goToPlaylistPage(el.id)}>

                            </div>
                            <div className={styles['thumbnail__play-btn']}>
                                <div onClick={() => props.playPlaylist(el.id)} title="재생">
                                    <span className="material-icons md-32">play_arrow</span>
                                </div>
                            </div>
                            <div
                                className={styles['thumbnail__option-btn']}
                                title="작업 더보기"
                                onClick={(e) => { props.openOptionsSelector(e, el.id) }}>
                                <span className="material-icons">more_vert</span>
                            </div>
                        </div>
                        <div className={styles['playlist-info']} onClick={() => props.goToPlaylistPage(el.id)}>
                            {el.name}
                        </div>
                        <div className={styles['playlist-info--secondary']}>
                            노래 {el.itemCount} 곡
                        </div>
                    </div>)
                }
            </div>
            <br></br><br></br><br></br>
        </div>
    );
}
