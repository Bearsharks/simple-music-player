import styles from './PlaylistsRecoil.module.scss';
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useMusicListManager, playlistInfosState } from "./recoilStates/atoms/playlistAtoms";
import { useFormPopupManager, ModalKind, PopupInfoState, PopupKind, popupOpenState } from './Popups/PopupStates';
import { MusicListAction, MusicListActionType, } from './refs/constants';
import Playlists from './components/Playlists';
import Spinner from './components/Spinner';
import { Suspense } from 'react';
function PlaylistsRecoil() {
    const playlistInfos = useRecoilValue(playlistInfosState);
    const musicListManager = useMusicListManager();
    const formPopupManager = useFormPopupManager();
    const setPopupInfoState = useSetRecoilState(PopupInfoState);
    const setOpen = useSetRecoilState(popupOpenState);
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
        setOpen(true);
    }
    const openCreatePlaylistPopup = () => {
        formPopupManager(ModalKind.CreatePlaylist);
    }
    const openYTPlaylistPopup = () => {
        formPopupManager(ModalKind.ImportYTPlaylist);
    }
    return (
        <div>
            <Suspense fallback={<Spinner></Spinner>}>
                <Playlists
                    openCreatePlaylistPopup={openCreatePlaylistPopup}
                    playlistInfos={playlistInfos}
                    playPlaylist={setMusiclist}
                    openOptionsSelector={openOptionsSelector}
                ></Playlists>
            </Suspense>
        </div>
    );
}


export default PlaylistsRecoil;