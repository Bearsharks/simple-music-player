import React, { useEffect, useRef, useState } from "react";
import styles from "./SoundController.module.scss"
function SoundController() {
    const barElement = useRef<HTMLDivElement>(null);
    const [volume, setVolume] = useState(100);
    const [isMuted, setMuted] = useState(false);
    const savedCallback = useRef<() => void>();
    const volumeUpdate = () => {
        const player = (window as any).player;
        if (!player) return;
        if (volume !== player.getVolume()) setVolume(player.getVolume());
        if (isMuted !== player.isMuted()) {
            setMuted(player.isMuted());
        }
    }
    useEffect(() => {
        savedCallback.current = volumeUpdate;
    });

    useEffect(() => {
        function tick() {
            if (savedCallback.current) savedCallback.current();
        }
        const mytimer = setInterval(tick, 1000);
        return () => {
            clearInterval(mytimer);
        }
    }, []);

    useEffect(() => {
        if (barElement.current) {
            barElement.current.style.width = `${volume}%`;
        }
    }, [volume])

    const volumeClickHandler = (event: React.MouseEvent) => {
        const player = (window as any).player;
        if (!player) return;
        const tgt = event.currentTarget as HTMLElement;
        const { left, width } = tgt.getBoundingClientRect();
        const volume = Math.round((event.clientX - left) * 100 / width);
        player.setVolume(volume);
        setVolume(volume);
        if (player.isMuted()) {
            player.unMute();
            setMuted(false);
        }
    }
    const toggleMute = () => {
        setMuted((isMuted: boolean) => {
            if (isMuted) (window as any).player.unMute();
            else (window as any).player.mute();
            return isMuted ? false : true;
        });
    }
    return (
        <div className={styles[`wrapper`]}>
            <div className={styles[`volume-controller`]} onClick={volumeClickHandler}>
                <div className={styles[`volume-controller__slider`]}></div>
                <div className={styles[`volume-controller__bar`]} ref={barElement}></div>
                <div className={styles[`volume-controller__slider`]}></div>
            </div>
            <div className={styles[`mute-btn`]} onClick={toggleMute}>
                <span className="material-icons">{isMuted ? "volume_off" : "volume_up"}</span>
            </div>
        </div>
    )
}
export default SoundController;