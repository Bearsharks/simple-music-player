import React, { useEffect,useRef } from "react";
import { MusicInfo, playerState } from "./refs/constants";
import styles from "./ProgressBar.module.scss"
import { useRecoilState } from "recoil";
import { musicPlayerProgressState } from "./recoilStates/atoms/playlistAtoms";

function ProgressBar(){
    const thisElement = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useRecoilState(musicPlayerProgressState);
    useEffect(()=>{
        const mytimer = setInterval(function() {
            const player = (window as any).player;
            if (player?.getPlayerState() === playerState.PLAYING ||
              player?.getPlayerState() === playerState.PAUSED
            ) {
                setProgress({currentTime:player.getCurrentTime() ,duration : player.getDuration()});
            }
            
        }, 1000); 
        return ()=>{
            clearTimeout(mytimer);
        }
    },[]);

    useEffect(()=>{
        const percent:number = (progress.currentTime / progress.duration) * 100;
        if(thisElement.current){
            thisElement.current.style.width = `${percent}vw`;
        }
    },[progress]);
    const progressClickHandler = (event:React.MouseEvent)=>{
        const time = (event.clientX/document.body.offsetWidth) * progress.duration;
        (window as any).player?.seekTo(time);
    }
    return(
        <div className={styles[`progress-bar`]} onClick={progressClickHandler}>
            <div ref={thisElement} className={styles[`progress`]}></div>
        </div>
    )
}
export default ProgressBar;