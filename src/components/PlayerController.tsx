import React from "react";
import ProgressBar from "../ProgressBar";
import { MusicInfo } from "../refs/constants";
import styles from './PlayerController.module.scss';

export interface PlayerControllerProps {
    musicInfo: MusicInfo;
    openOptionsPopup: (event: React.MouseEvent, musicInfo: MusicInfo) => void;
    isPlaying:boolean;
    goNext:()=>void;
    goPrev:()=>void;
    togglePlayState:()=>void;
    playerVisiblity: boolean;
    togglePlayerVisiblity: () => void;
}
function PlayerController(props: PlayerControllerProps) {
    const popupOpen = (event: React.MouseEvent) => {
        props.openOptionsPopup(event, [props.musicInfo]);
    }
    return (
        <div className={styles[`wrapper`]} >
            {props.musicInfo.name &&
                <div>
                    <div className={styles[`wrapper_progress-bar`]}>
                        <ProgressBar></ProgressBar>
                    </div>
                    <div className={styles[`wrapper_controller`]} >
                        <div onClick={props.goPrev}>뒤</div>
                        <div onClick={props.togglePlayState}>
                        {(props.isPlaying) ?
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" /></svg>
                        }
                        </div>
                        <div onClick={props.goNext}>앞</div>
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