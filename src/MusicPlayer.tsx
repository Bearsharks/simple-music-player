import styles from './MusicPlayer.module.scss'
import PlayerController from './components/PlayerController';
import MusicList from './components/MusicList';
import { useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { FormKind, OptionSelectorInfo, OptionSelectorOpenState, OptionSelectorState, useFormPopupManager } from './recoilStates/PopupStates';
import { curMusicInfoState, musicListState, useMusicListManager, usePlaylistManager } from './recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoCheck, MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType } from './refs/constants';

function MusicPlayer() {
    const [playerVisiblity, setPlayerVisiblity] = useState(false);
    const musicList = useRecoilValue(musicListState);
    const curMusicInfo = useRecoilValue(curMusicInfoState);
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

    const deleteMusic = (items:MusicInfo[])=>{
        debugger;
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
    return (
        <div className={styles['wrapper']}>
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                <MusicList items={musicList}
                    addToPlaylist={addToPlaylist}
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