
import { ChangeEvent, useState } from "react";
import { PlaylistInfo } from "refs/constants";
import PlaylistItem from "../PlaylistItem";
import styles from './Playlists.module.scss';

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
    debugger;
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
            <h1>재생목록</h1>
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
                </div>
                {sortList().map((el: PlaylistInfo) =>
                    <div className={styles['grid-item']} key={el.id}
                        title={el.description}
                    >
                        <PlaylistItem info={el} onClick={props.goToPlaylistPage}>
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
                        </PlaylistItem>
                    </div>)
                }
            </div>
            <br></br><br></br><br></br>
        </div>
    );
}
