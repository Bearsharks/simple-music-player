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
    return (
        <div className={styles['wrapper']}>
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                <MusicList items={musicList}
                    createPlaylistByMusicList={createPlaylistByMusicList}
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