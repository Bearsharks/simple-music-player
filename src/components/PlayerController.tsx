import React from "react";
import { MusicInfo } from "../refs/constants";
import styles from './PlayerController.module.scss';

export interface PlayerControllerProps {
    musicInfo: MusicInfo;
    openOptionsPopup: (event: React.MouseEvent, musicInfo: MusicInfo) => void;
    playerVisiblity: boolean;
    togglePlayerVisiblity: () => void;
}
function PlayerController(props: PlayerControllerProps) {
    const popupOpen = (event: React.MouseEvent) => {
        props.openOptionsPopup(event, props.musicInfo);
    }
    return (
        <div className={styles[`wrapper`]} >
            {props.musicInfo.name &&
                <div>
                    <div className={styles[`wrapper_progress-bar`]}></div>
                    <div className={styles[`wrapper_controller`]} >
                        <div>뒤</div>
                        <div>||</div>
                        <div>앞</div>
                        <div>{props.musicInfo.name}</div>
                        <button onClick={popupOpen}>버튼</button>
                        <button onClick={props.togglePlayerVisiblity}>
                            {props.playerVisiblity ? `V` : `ㅅ`}
                        </button>
                    </div>
                </div>}
        </div>
    );
}

export default PlayerController;