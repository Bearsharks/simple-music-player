import React from "react";
import { useOpenMusicOptionsPopup } from "popups/PopupStates";
import ProgressBar from "components/recoil/ProgressBar";
import { MusicInfo } from "refs/constants";
import SoundController from "./SoundController";
import MoreVert from "components/MoreVert";
import styles from './PlayerController.module.scss';

export interface PlayerControllerProps {
    musicInfo: MusicInfo;
    isPlaying: boolean;
    goNext: () => void;
    goPrev: () => void;
    togglePlayState: () => void;
    playerVisiblity: boolean;
    togglePlayerVisiblity: () => void;
}
function PlayerController(props: PlayerControllerProps) {
    const openMusicOptionsPopup = useOpenMusicOptionsPopup();
    const popupOpen = (event: React.MouseEvent) => {
        openMusicOptionsPopup(event.target as HTMLElement, [props.musicInfo]);
    }
    return (
        <>{props.musicInfo.name &&
            <div className={styles[`wrapper`]} >
                <ProgressBar></ProgressBar>
                <div className={styles[`wrapper_controller`]} >
                    <div className={styles[`left-control`]}>
                        <div className={styles[`previous-button`]} onClick={props.goPrev}>
                            <span className="material-icons">skip_previous</span>
                        </div>
                        <div className={styles[`play-pause-button`]} onClick={props.togglePlayState}>
                            <span className="material-icons">
                                {(props.isPlaying) ? "pause" : "play_arrow"}
                            </span>
                        </div>
                        <div className={styles[`next-button`]} onClick={props.goNext}>
                            <span className="material-icons">skip_next</span>
                        </div>
                    </div>
                    <div className={styles["midle-control"]}>
                        <div className={styles["cur-music-info"]}>
                            <div
                                title={props.musicInfo.name}

                            >{props.musicInfo.name}</div>
                            <div className={styles["cur-music-info--secondary"]}
                            >{props.musicInfo.owner}</div>
                        </div>
                        <MoreVert onClick={popupOpen} size={24}></MoreVert>
                    </div>
                    <div className={styles["right-control"]}>
                        <ExpandMenus></ExpandMenus>
                        <div
                            className={`${styles["right-control__show-list-btn"]} ${!props.playerVisiblity && styles["right-control__show-list-btn--rot"]}`}
                            onClick={props.togglePlayerVisiblity}>
                            <span className={"material-icons"}>
                                arrow_drop_down
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        }</>

    );
}

export default PlayerController;

function ExpandMenus() {
    return (
        <div className={styles['expand-menus']}>
            <div className={styles['expand-menus__button']}>
                <span className="material-icons">arrow_left</span>
            </div>
            <div className={styles['expand-menus__menu']}>
                <SoundController></SoundController>
            </div>
        </div>
    );
}