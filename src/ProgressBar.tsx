import React, { useEffect, useRef } from "react";
import { PlayerState } from "./refs/constants";
import styles from "./ProgressBar.module.scss"
import { useRecoilState } from "recoil";
import { musicPlayerProgressState } from "./recoilStates/atoms/playlistAtoms";

function ProgressBar() {
    const thisElement = useRef<HTMLDivElement>(null);
    const timeInfo = useRef<HTMLSpanElement>(null);
    const [progress, setProgress] = useRecoilState(musicPlayerProgressState);
    useEffect(() => {
        const mytimer = setInterval(function () {
            const player = (window as any).player;
            if (player?.getPlayerState() === PlayerState.PLAYING ||
                player?.getPlayerState() === PlayerState.PAUSED
            ) {
                setProgress({ currentTime: player.getCurrentTime(), duration: player.getDuration() });
            }
        }, 1000);
        return () => {
            clearInterval(mytimer);
        }
    }, []);

    useEffect(() => {
        const percent: number = (progress.currentTime / progress.duration) * 100;
        if (thisElement.current) {
            thisElement.current.style.width = `${percent}%`;
        }
    }, [progress]);

    const progressClickHandler = (event: React.MouseEvent) => {
        const time = (event.clientX / (document.body.offsetWidth - 12)) * progress.duration;
        (window as any).player?.seekTo(time);
    }


    let needForRAF = true;
    const updateTimeInfo = (posX: number) => {
        needForRAF = true;
        if (timeInfo.current) {
            const width = (document.body.offsetWidth - 12);
            const time = (posX / width) * progress.duration;
            const min = Math.floor(time / 60);
            const sec = Math.round(time % 60);
            const zero = (sec >= 10) ? "" : "0"
            posX = posX < 10 ? 10 : posX;
            posX = posX > width - 10 ? width - 10 : posX;
            timeInfo.current.style.transform = `translateX(${posX}px`;
            timeInfo.current.textContent = `${min}:${zero}${sec}`;
        }
    }

    const mm = (e: React.MouseEvent) => {
        if (needForRAF) {
            needForRAF = false;
            requestAnimationFrame(() => updateTimeInfo(e.clientX));
        }
    }
    return (
        <div className={styles[`wrapper`]}
            onClick={progressClickHandler}
            onMouseMove={mm}>
            <span ref={timeInfo}>4:38</span>
            <div className={styles[`progress-bar`]} >
                <div ref={thisElement} className={styles[`progress`]}></div>
            </div>

        </div>
    )
}
export default ProgressBar;