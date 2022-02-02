import styles from './MusicPlayer.module.scss'
import PlayerController from './components/PlayerController';
import MusicList from './components/MusicList';
import { useState } from 'react'
import { useRecoilValue, useSetRecoilState, useRecoilState } from 'recoil';
import { FormKind, OptionSelectorInfo, OptionSelectorOpenState, OptionSelectorState, useFormPopupManager } from './recoilStates/PopupStates';
import { curMusicInfoState, musicListState, musicPlayerState, useCurMusicManager, useMusicListManager, usePlaylistManager } from './recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoActionType, MusicInfoCheck, MusicListAction, MusicListActionType, playerState, PlaylistAction, PlaylistActionType } from './refs/constants';
import YoutubePlayer from './YoutubePlayer';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useState(false);
    const musicList = useRecoilValue(musicListState);
    const curMusicInfo = useRecoilValue(curMusicInfoState);
    const curMusicManager = useCurMusicManager();
    const [playState,setPlayState]  = useRecoilState(musicPlayerState);
    const musicListManager = useMusicListManager();
    const playlistManager = usePlaylistManager();
    //팝업관련
    const setPopupInitData = useSetRecoilState(OptionSelectorState);
    const setPopupOpen = useSetRecoilState(OptionSelectorOpenState);
    const formPopupManager = useFormPopupManager();
    const togglePlayerVisiblity = () => {
        playerVisiblity ? setPlayerVisiblity(false) : setPlayerVisiblity(true);
    }

    const addToNextMusic = (musicInfo: MusicInfo) => {
        const action: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT,
            payload: [musicInfo]
        }
        musicListManager(action);
    }
    const appendMusic = (musicInfo: MusicInfo) => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: [musicInfo]
        }
        musicListManager(action);
    }
    const appendToPlaylist = (musicInfo: MusicInfo) => {
        //open playlist form popup <- 데이터로 [musicInfo] 를 넣어줌
    }
    const openPopup = (event: React.MouseEvent, musicInfo: MusicInfo) => {
        event.stopPropagation();
        const onClickHandlerWrapper = (callback: (musicInfo: MusicInfo) => void) => {
            return (musicInfo: unknown) => {
                MusicInfoCheck(musicInfo) && callback(musicInfo);
                setPopupOpen(false);
            }
        }
        const initData: OptionSelectorInfo = {
            target: event.target as HTMLElement,
            items: [
                { icon: "O", name: "다음 음악으로 재생", onClickHandler: onClickHandlerWrapper(addToNextMusic) },
                { icon: "O", name: "목록에 추가", onClickHandler: onClickHandlerWrapper(appendMusic) },
                { icon: "O", name: "재생목록에 추가", onClickHandler: onClickHandlerWrapper(appendToPlaylist) },
                { icon: "O", name: "목록에서 삭제", onClickHandler: () => { } }
            ],
            data: musicInfo
        }
        setPopupInitData(initData)
        setPopupOpen(true);
    }
    const createPlaylistByMusicList = (event: React.MouseEvent, items: MusicInfo[]) => {
        formPopupManager(FormKind.AppendPlaylist, items);
    }
    const goNext = ()=>{
        curMusicManager({type: MusicInfoActionType.NEXT})
    }
    const goPrev = ()=>{
        curMusicManager({type: MusicInfoActionType.PREV})
    }
    const togglePlayState = ()=>{
        const nextState:playerState = playState === playerState.PLAYING ? 
        playerState.PAUSED : playerState.PLAYING;
        if(nextState === playerState.PLAYING){
            (window as any).player.playVideo();
        }
        else{
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
                isPlaying={playState === playerState.PLAYING}
                goNext={goNext}
                goPrev={goPrev}
                togglePlayState={togglePlayState}
            />
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                <YoutubePlayer></YoutubePlayer>
                <MusicList items={musicList}
                    createPlaylistByMusicList={createPlaylistByMusicList}
                    openOptionsPopup={openPopup} />
            </div>            
        </div >
    )
}
export default MusicPlayer;