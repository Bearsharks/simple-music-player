import styles from 'features/player/pages/MusicPlayer.module.scss'
import PlayerController from 'features/player/ui/playerController/PlayerController';
import { useAtom, useAtomValue } from 'jotai';
import { curMusicInfoState, musicListState, useCurMusicManager } from 'features/queue/model/queue';
import { musicPlayerState } from 'features/player/model/playback';
import { MusicInfoActionType, PlayerState } from 'shared/model/constants';

import PlayerDetail from 'features/player/ui/playerDetail/PlayerDetail';
import musiclistOpenState from 'features/queue/model/musiclistOpenState';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useAtom(musiclistOpenState);
    const curMusicInfo = useAtomValue(curMusicInfoState);
    const curMusicManager = useCurMusicManager();
    const playState = useAtomValue(musicPlayerState);
    const musicList = useAtomValue(musicListState);
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
    }
    const goNext = () => {

        curMusicManager({ type: MusicInfoActionType.NEXT })
    }
    const goPrev = () => {
        if ((window as any).player?.getCurrentTime() >= 2) {
            (window as any).player?.seekTo(0);
            return;
        }
        curMusicManager({ type: MusicInfoActionType.PREV })
    }
    const togglePlayState = () => {
        const nextState: PlayerState = playState === PlayerState.PLAYING ?
            PlayerState.PAUSED : PlayerState.PLAYING;
        if (nextState === PlayerState.PLAYING) {
            (window as any).player?.playVideo();
        }
        else {
            (window as any).player?.pauseVideo();
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
