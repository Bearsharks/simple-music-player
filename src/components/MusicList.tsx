import React from "react";
import { MusicInfo_tmp as MusicInfo } from "../refs/constants";
import styles from './MusicList.module.scss';

export interface MusicListProps {
    items: MusicInfo[];
    openPopUpBox: () => void;
}
//todo 할일 showOptionBox는 이벤트를 넘겨주는 녀석
//이벤트를 받아서 위치를 받고 팝업을 띄워주면됩니다. 팝업은 리코일에서 관리합니다.
function MusicItem(props: { item: MusicInfo, showOptionBox: React.MouseEventHandler<HTMLButtonElement> }) {
    return (
        <div className={styles[`music-list_item`]}>
            <img alt="사진" />
            <div>이름</div>
            <button onClick={props.showOptionBox}>버튼</button>
            <div>=</div>
        </div>
    );
}
function MusicList(props: MusicListProps) {
    return (
        <div className={styles[`music-list`]} >
            {
                props.items.map((item: MusicInfo, idx: number) =>
                    <MusicItem key={idx} item={item} showOptionBox={props.openPopUpBox}></MusicItem>)
            }
        </div>
    );
}

export default MusicList;