import styles from './MusicPlayer.module.scss'
import PlayerController from './components/PlayerController';
import MusicList from './components/MusicList';
import { useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { PopupInfo, PopupInfoState, PopupKind, popupOpenState } from './Popups/PopupStates';
import { curMusicInfoState, musicListState, musicPlayerState, useCurMusicManager, useMusicListManager } from './recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoActionType, MusicListActionType, PlayerState } from './refs/constants';
import YoutubePlayer from './YoutubePlayer';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useState(false);
    const musicList = useRecoilValue(musicListState);
    const curMusicInfo = useRecoilValue(curMusicInfoState);
    const curMusicManager = useCurMusicManager();
    const playState = useRecoilValue(musicPlayerState);
    const musicListManager = useMusicListManager();
    //팝업관련
    const setPopupInfo = useSetRecoilState(PopupInfoState);
    const setPopupOpen = useSetRecoilState(popupOpenState);
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
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
    const openPopup = (event: React.MouseEvent, musicInfos: MusicInfo[]) => {
        event.stopPropagation();

        setPopupInfo({
            target: event.target as HTMLElement,
            kind: PopupKind.MusicOptions,
            data: musicInfos
        })
        setPopupOpen(true);
    }
    const changeOrder = (src: number, dst: number) => {
        musicListManager({
            type: MusicListActionType.CHANGE_ORDER,
            payload: { to: dst, from: src }
        });
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
    const playMusic = (idx: number | undefined) => {
        curMusicManager({
            type: MusicInfoActionType.SET_IDX,
            payload: idx
        });
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
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                <YoutubePlayer></YoutubePlayer>
                <MusicList
                    items={musicList}
                    addToPlaylist={addToPlaylist}
                    playMusic={playMusic}
                    openOptionsPopup={openPopup}
                    changeOrder={changeOrder} />
            </div>
        </div >
    )
}
export default MusicPlayer;