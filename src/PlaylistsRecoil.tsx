import styles from './PlaylistsRecoil.module.scss';
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useMusicListManager, usePlaylistManager, playlistInfosState } from "./recoilStates/atoms/playlistAtoms";
import { useFormPopupManager, OptionSelectorState, OptionSelectorOpenState, FormKind } from './recoilStates/PopupStates';
import { MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType, MusicInfo, PlaylistInfo, MusicInfoActionType } from './refs/constants';
import Playlists from './components/Playlists';
function TestPage() {
    const playlistInfos = useRecoilValue(playlistInfosState);
    const playlistManager = usePlaylistManager();
    const musicListManager = useMusicListManager();
    const formPopupManager = useFormPopupManager();
    const setOptionSelectorState = useSetRecoilState(OptionSelectorState);
    const setOptionSelectorOpen = useSetRecoilState(OptionSelectorOpenState);

    const setMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.SET,
            payload: playlistid
        }
        musicListManager(action);
    }
    const appendMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_PLAYLIST,
            payload: playlistid
        }
        musicListManager(action);
    }
    const addToNextMusic = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT_PLAYLIST,
            payload: playlistid
        }
        musicListManager(action);
    }

    const openCreatePlaylistPopup = () => {
        formPopupManager(FormKind.CreatePlaylist);
    }
    const updatePlaylistInfo = (playlistid: string) => {
        formPopupManager(FormKind.UpdatePlaylist, playlistid);
    }
    const deletePlaylist = (playlistid: string) => {
        playlistManager({
            type: PlaylistActionType.DELETE,
            payload: playlistid
        });
    }

    const openOptionsSelector = (e: React.MouseEvent<HTMLElement>, playlistid: string) => {
        e.stopPropagation();
        const onClickHandlerWrapper = (callback: (data: any) => void) => {
            return (data: any) => {
                callback(data);
                setOptionSelectorOpen(false);
            }
        }
        setOptionSelectorState({
            target: e.target as HTMLElement,
            items: [
                { icon: "S", name: "재생목록에 추가", onClickHandler: onClickHandlerWrapper(appendMusiclist) },
                { icon: "A", name: "다음 음악으로 추가", onClickHandler: onClickHandlerWrapper(addToNextMusic) },
                { icon: "U", name: "재생목록 수정", onClickHandler: onClickHandlerWrapper(updatePlaylistInfo) },
                { icon: "X", name: "재생목록 삭제", onClickHandler: onClickHandlerWrapper(deletePlaylist) },
            ],
            data: playlistid
        });
        setOptionSelectorOpen(true);
    }
    const openYTPlaylistPopup = () => {
        formPopupManager(FormKind.ImportYTPlaylist);
    }
    return (
        <div>플레이리스트
            <button onClick={openCreatePlaylistPopup}>새 재생목록</button>
            <button onClick={openYTPlaylistPopup}>유튜브</button>
            <Playlists
                playlistInfos={playlistInfos}
                playPlaylist={setMusiclist}
                openOptionsSelector={openOptionsSelector}
            ></Playlists>
        </div>
    );
}


export default TestPage;