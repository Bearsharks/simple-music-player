import React from "react";
import { MusicInfo } from "../refs/constants";
import styles from './MusicList.module.scss';

export interface MusicListProps {
    items: MusicInfo[];
    openOptionsPopup: (event: React.MouseEvent, musicInfo: MusicInfo) => void;
    createPlaylistByMusicList: (event: React.MouseEvent, items: MusicInfo[]) => void;
}
//todo 할일 showOptionBox는 이벤트를 넘겨주는 녀석
//이벤트를 받아서 위치를 받고 팝업을 띄워주면됩니다. 팝업은 리코일에서 관리합니다.
function MusicItem({ item, openOptionsPopup }: { item: MusicInfo, openOptionsPopup: (event: React.MouseEvent, musicInfo: MusicInfo) => void }) {
    const popupOpen = (event: React.MouseEvent) => {
        openOptionsPopup(event, item);
    }

    return (
        <div className={styles[`music-list_item`]}>
            <img alt="사진 |" />
            <div>{item.name}|</div>
            <button onClick={popupOpen}>버튼</button>
            <div>=</div>
        </div>
    );
}
function MusicList(props: MusicListProps) {
    const createPlaylist = (event: React.MouseEvent) => {
        props.createPlaylistByMusicList(event, props.items);
    }
    return (
        <div className={styles[`music-list`]} >
            <button onClick={createPlaylist}>재생목록 생성</button>
            {
                props.items.map((item: MusicInfo, idx: number) =>
                    <MusicItem key={idx} item={item} openOptionsPopup={props.openOptionsPopup}></MusicItem>)
            }
        </div>
    );
}

export default MusicList;