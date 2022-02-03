import React, { useEffect,useRef,useState } from "react";
import styles from "./SoundController.module.scss"
function SoundController(){
    const thisElement = useRef<HTMLDivElement>(null);
    const [volume, setVolume] = useState(100);
    const [isMuted, setMuted] = useState(false);
    const savedCallback = useRef<()=>void>();
    const volumeUpdate = ()=>{
        const player = (window as any).player;
        if (!player) return;
        if(volume != player.getVolume()) setVolume(player.getVolume());
        if(isMuted != player.isMuted()){
            setMuted(player.isMuted());
        } 
    }
    useEffect(() => {
        savedCallback.current = volumeUpdate;
    });
    
    useEffect(()=>{
        function tick() {
            if(savedCallback.current) savedCallback.current();
        }
        const mytimer = setInterval(tick, 1000);
        return ()=>{
            clearInterval(mytimer);
        }
    },[]);

    useEffect(()=>{
        if(thisElement.current){
            thisElement.current.style.width = `${volume}%`;
        }
    },[volume])

    const volumeClickHandler = (event:React.MouseEvent)=>{
        const player = (window as any).player;
        if (!player) return;
        const tgt = event.currentTarget as HTMLElement;        
        const volume = Math.round((event.clientX - tgt.offsetLeft) *100/ tgt.clientWidth);
        player.setVolume(volume);
        setVolume(volume);        
        if(player.isMuted()){
            player.unMute();
            setMuted(false);
        } 
    }
    return(
        <div className={styles[`volume-controller`]} onClick={volumeClickHandler}>
            <div ref={thisElement} className={styles[`volume-slider`]}></div>
            <span>{isMuted? "mute" : 'unmuted'}</span>
        </div>
    )
}
export default SoundController;