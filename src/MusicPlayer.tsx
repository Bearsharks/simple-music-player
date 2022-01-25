import styles from './MusicPlayer.module.scss'
import PlayerController from './components/PlayerController';
import MusicList from './components/MusicList';
import { useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { OptionSelectorInfo, OptionSelectorOpenState, OptionSelectorState } from './recoilStates/PopupStates';
import { curMusicInfoState, musicListState } from './recoilStates/atoms/playlistAtoms';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useState(false);
    const musicList = useRecoilValue(musicListState);
    const curMusicInfo = useRecoilValue(curMusicInfoState);
    //팝업관련
    const setPopupInitData = useSetRecoilState(OptionSelectorState);
    const setPopupOpen = useSetRecoilState(OptionSelectorOpenState);
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
    }
    const openPopup = (event: React.MouseEvent) => {
        event.stopPropagation();
        const initData: OptionSelectorInfo = {
            target: event.target as HTMLElement,
            items: [
                { icon: "O", name: "다음 음악으로 재생", onClickHandler: () => { } },
                { icon: "O", name: "목록에 추가", onClickHandler: () => { } },
                { icon: "O", name: "재생목록에 추가", onClickHandler: () => { } },
                { icon: "O", name: "목록에서 삭제", onClickHandler: () => { } }
            ]
        }
        setPopupInitData(initData)
        setPopupOpen(true);
    }

    return (
        <div className={styles['wrapper']}>
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                <MusicList items={musicList}
                    openOptionsPopup={openPopup} />
            </div>
            <PlayerController
                musicInfo={curMusicInfo}
                openOptionsPopup={openPopup}
                playerVisiblity={playerVisiblity}
                togglePlayerVisiblity={togglePlayerVisiblity} />
        </div >
    )
}
export default MusicPlayer;