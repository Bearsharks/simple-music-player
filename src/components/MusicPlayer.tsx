import styles from './MusicPlayer.module.scss'
import PlayerController from './PlayerController';
import MusicList from './MusicList';
import { MusicInfo_tmp as MusicInfo } from '../refs/constants';
import { useState } from 'react'
interface MusicPlayerProps {
    children: JSX.Element;
    openPopUpBox: () => void;
    items?: MusicInfo[]
};
function MusicPlayer({ children, openPopUpBox, items }: MusicPlayerProps) {
    const [playerVisiblity, setPlayerVisiblity] = useState(false);
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
    }
    return (
        <div className={styles['wrapper']}>
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                {children}
                <MusicList items={items ? items : []}
                    openPopUpBox={openPopUpBox} />
            </div>
            <PlayerController
                musicInfo={items ? items[0] : {} as MusicInfo}
                openPopUpBox={openPopUpBox}
                playerVisiblity={playerVisiblity}
                togglePlayerVisiblity={togglePlayerVisiblity} />
        </div >
    )
}
export default MusicPlayer;