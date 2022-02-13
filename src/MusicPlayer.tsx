import styles from './MusicPlayer.module.scss'
import PlayerController from './components/PlayerController';
import { useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { PopupInfo, PopupInfoState, PopupKind, popupOpenState } from './Popups/PopupStates';
import { curMusicInfoState, musicListState, musicPlayerState, useCurMusicManager } from './recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoActionType, PlayerState } from './refs/constants';

import PlayerDetail from './components/PlayerDetail';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useState(false);
    const curMusicInfo = useRecoilValue(curMusicInfoState);
    const curMusicManager = useCurMusicManager();
    const playState = useRecoilValue(musicPlayerState);
    const musicList = useRecoilValue(musicListState);
    //팝업관련
    const setPopupInfo = useSetRecoilState(PopupInfoState);
    const setPopupOpen = useSetRecoilState(popupOpenState);
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
    }

    const openPopup = (event: React.MouseEvent, musicInfos: MusicInfo[]) => {
        event.stopPropagation();

        setPopupInfo({
            target: event.target as HTMLElement,
            kind: PopupKind.MusicOptions,
            data: musicInfos
        })
        setPopupOpen(true);
    }
    const addToPlaylist = (event: React.MouseEvent<Element, MouseEvent>, items: MusicInfo[]) => {
        const info: PopupInfo = {
            target: event.target as HTMLElement,
            kind: PopupKind.SelectTgtPlaylist,
            data: items
        }
        setPopupInfo(info);
        setPopupOpen(true);

    }
    const goNext = () => {
        curMusicManager({ type: MusicInfoActionType.NEXT })
    }
    const goPrev = () => {
        curMusicManager({ type: MusicInfoActionType.PREV })
    }
    const togglePlayState = () => {
        const nextState: PlayerState = playState === PlayerState.PLAYING ?
            PlayerState.PAUSED : PlayerState.PLAYING;
        if (nextState === PlayerState.PLAYING) {
            (window as any).player.playVideo();
        }
        else {
            (window as any).player.pauseVideo();
        }
    }
    return (
        <div className={styles['wrapper']}>
            <PlayerController
                musicInfo={curMusicInfo}
                openOptionsPopup={openPopup}
                playerVisiblity={playerVisiblity}
                togglePlayerVisiblity={togglePlayerVisiblity}
                isPlaying={playState === PlayerState.PLAYING}
                goNext={goNext}
                goPrev={goPrev}
                togglePlayState={togglePlayState}
            />
            <PlayerDetail
                musicList={musicList}
                playerVisiblity={playerVisiblity}
                openPopup={openPopup}
                addToPlaylist={addToPlaylist}
            ></PlayerDetail>
        </div >
    )
}
export default MusicPlayer;