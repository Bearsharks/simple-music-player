import React from "react";
import { useOpenMusicOptionsPopup } from "../Popups/PopupStates";
import ProgressBar from "../ProgressBar";
import { MusicInfo } from "../refs/constants";
import SoundController from "../SoundController";
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
        <div className={styles[`wrapper`]} >
            {props.musicInfo.name &&
                <>
                    <ProgressBar></ProgressBar>
                    <div className={styles[`wrapper_controller`]} >
                        <div className={styles[`left-control`]}>
                            <div className={styles[`previous-button`]} onClick={props.goPrev}>
                                <span className="material-icons">skip_previous</span>
                            </div>
                            <div className={styles[`play-pause-button`]} onClick={props.togglePlayState}>
                                <span className="material-icons md-32">
                                    {(props.isPlaying) ? "pause" : "play_arrow"}
                                </span>
                            </div>
                            <div className={styles[`next-button`]} onClick={props.goNext}>
                                <span className="material-icons">skip_next</span>
                            </div>
                        </div>
                        <div className={styles["midle-control"]}>
                            <div className={styles["cur-music-info"]}
                                title={props.musicInfo.name}

                            >{props.musicInfo.name}</div>
                            <div className={styles["more-vert-button"]} onClick={popupOpen}>
                                <span className="material-icons">more_vert</span>
                            </div>
                        </div>
                        <div className={styles["right-control"]}>
                            <ExpandMenus></ExpandMenus>
                            <div
                                className={`${styles["right-control__show-list-btn"]} ${!props.playerVisiblity && styles["right-control__show-list-btn--rot"]}`}
                                onClick={props.togglePlayerVisiblity}>
                                <span className={"material-icons md-28"}>
                                    arrow_drop_down
                                </span>
                            </div>
                        </div>

                    </div>
                </>}
        </div>
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