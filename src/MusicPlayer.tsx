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

    const addToNextMusic = (musicInfos: MusicInfo[]) => {
        const action: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT,
            payload: musicInfos
        }
        musicListManager(action);
    }
    const appendMusic = (musicInfos: MusicInfo[]) => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: musicInfos
        }
        musicListManager(action);
    }
    const addToPlaylist = (items: MusicInfo[]) => {
        formPopupManager(FormKind.AppendPlaylist, items);
    }
    const changeOrder = (src:number,dst:number)=>{
        musicListManager({
            type:MusicListActionType.CHANGE_ORDER,
            payload : { to:dst, from:src }
        });
    }
    const deleteMusic = (items:MusicInfo[])=>{
        const delAction:MusicListAction = {
            type:MusicListActionType.DELETE,
            payload:items
        }
        musicListManager(delAction);
    }
    const openPopup = (event: React.MouseEvent, musicInfos: MusicInfo[]) => {
        event.stopPropagation();
        const onClickHandlerWrapper = (callback: (data: any) => void) => {
            return (data: any) => {
                callback(data);
                setPopupOpen(false);                
            }
        }
        const initData: OptionSelectorInfo = {
            target: event.target as HTMLElement,
            items: [
                { icon: "O", name: "다음 음악으로 재생", onClickHandler: onClickHandlerWrapper(addToNextMusic) },
                { icon: "O", name: "목록에 추가", onClickHandler: onClickHandlerWrapper(appendMusic) },
                { icon: "O", name: "재생목록에 추가", onClickHandler: onClickHandlerWrapper(addToPlaylist) },
                { icon: "O", name: "목록에서 삭제", onClickHandler: onClickHandlerWrapper(deleteMusic) }
            ],
            data: musicInfos
        }
        setPopupInitData(initData)
        setPopupOpen(true);
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
                    addToPlaylist={addToPlaylist}
                    openOptionsPopup={openPopup} 
                    changeOrder={changeOrder}/>
            </div>            
        </div >
    )
}
export default MusicPlayer;