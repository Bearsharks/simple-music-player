import styles from './MusicPlayer.module.scss'
import PlayerController from './components/PlayerController';
import MusicList from './components/MusicList';
import { useState } from 'react'
import { useRecoilValue, useSetRecoilState, useRecoilState } from 'recoil';
import { FormKind, PopupInfoState, PopupKind, useFormPopupManager } from './Popups/PopupStates';
import { curMusicInfoState, musicListState, musicPlayerState, useCurMusicManager, useMusicListManager } from './recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoActionType, MusicListActionType, PlayerState } from './refs/constants';
import YoutubePlayer from './YoutubePlayer';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useState(false);
    const musicList = useRecoilValue(musicListState);
    const curMusicInfo = useRecoilValue(curMusicInfoState);
    const curMusicManager = useCurMusicManager();
    const [playState, setPlayState] = useRecoilState(musicPlayerState);
    const musicListManager = useMusicListManager();
    //팝업관련
    const setPopupInfo = useSetRecoilState(PopupInfoState);
    const formPopupManager = useFormPopupManager();
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
    }
    const addToPlaylist = (items: MusicInfo[]) => {
        formPopupManager(FormKind.AppendPlaylist, items);
    }
    const openPopup = (event: React.MouseEvent, musicInfos: MusicInfo[]) => {
        event.stopPropagation();
        setPopupInfo({
            target: event.target as HTMLElement,
            kind: PopupKind.MusicOptions,
            data: musicInfos
        })
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