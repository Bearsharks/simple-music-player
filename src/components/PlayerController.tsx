import React from "react";
import { MusicInfo_tmp as MusicInfo } from "../refs/constants";
import styles from './PlayerController.module.scss';

export interface PlayerControllerProps {
    musicInfo: MusicInfo;
    openOptionsPopup: (event: React.MouseEvent) => void;
    playerVisiblity: boolean;
    togglePlayerVisiblity: () => void;
}
function PlayerController(props: PlayerControllerProps) {
    return (
        <div className={styles[`wrapper`]} >
            <div className={styles[`wrapper_progress-bar`]}></div>
            <div className={styles[`wrapper_controller`]} >
                <div>뒤</div>
                <div>||</div>
                <div>앞</div>
                <div>{props.musicInfo.name}</div>
                <button onClick={props.openOptionsPopup}>버튼</button>
                <button onClick={props.togglePlayerVisiblity}>
                    {props.playerVisiblity ? `V` : `ㅅ`}
                </button>
            </div>
        </div>
    );
}

export default PlayerController;