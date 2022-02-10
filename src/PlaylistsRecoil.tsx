import styles from './PlaylistsRecoil.module.scss';
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useMusicListManager, playlistInfosState } from "./recoilStates/atoms/playlistAtoms";
import { useFormPopupManager, ModalKind, PopupInfoState, PopupKind } from './Popups/PopupStates';
import { MusicListAction, MusicListActionType, } from './refs/constants';
import Playlists from './components/Playlists';
function TestPage() {
    const playlistInfos = useRecoilValue(playlistInfosState);
    const musicListManager = useMusicListManager();
    const formPopupManager = useFormPopupManager();
    const setPopupInfoState = useSetRecoilState(PopupInfoState);

    const setMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.SET,
            payload: playlistid
        }
        musicListManager(action);
    }

    const openOptionsSelector = (e: React.MouseEvent<HTMLElement>, playlistid: string) => {
        e.stopPropagation();
        setPopupInfoState({
            target: e.target as HTMLElement,
            kind: PopupKind.PlaylistOptions,
            data: playlistid
        });
    }
    const openCreatePlaylistPopup = () => {
        formPopupManager(ModalKind.CreatePlaylist);
    }
    const openYTPlaylistPopup = () => {
        formPopupManager(ModalKind.ImportYTPlaylist);
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