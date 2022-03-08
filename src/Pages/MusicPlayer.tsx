import styles from './MusicPlayer.module.scss'
import PlayerController from 'components/PlayerController/PlayerController';
import { useRecoilState, useRecoilValue } from 'recoil';
import { curMusicInfoState, musicListState, musicPlayerState, useCurMusicManager } from 'recoilStates/playlistAtoms';
import { MusicInfoActionType, PlayerState } from 'refs/constants';

import PlayerDetail from 'components/PlayerDetail/PlayerDetail';
import musiclistOpenState from 'recoilStates/musiclistOpenState';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useRecoilState(musiclistOpenState);
    const curMusicInfo = useRecoilValue(curMusicInfoState);
    const curMusicManager = useCurMusicManager();
    const playState = useRecoilValue(musicPlayerState);
    const musicList = useRecoilValue(musicListState);
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
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
            ></PlayerDetail>
        </div >
    )
}
export default MusicPlayer;