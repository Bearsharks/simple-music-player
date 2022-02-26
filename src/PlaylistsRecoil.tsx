
import { useRecoilValue } from "recoil";
import { useMusicListManager, playlistInfosState } from "./recoilStates/atoms/playlistAtoms";
import { useModalManager, ModalKind, useOpenPlaylistOptionsPopup } from './Popups/PopupStates';
import { MusicListAction, MusicListActionType, } from './refs/constants';
import Playlists from './components/Playlists';
import Spinner from './components/Spinner';
import { Suspense } from 'react';

interface PlaylistsRecoilProps {
    goToPlaylistPage: (id: string) => void;
}
function PlaylistsRecoil(props: PlaylistsRecoilProps) {
    const playlistInfos = useRecoilValue(playlistInfosState);
    const musicListManager = useMusicListManager();
    const formPopupManager = useModalManager();
    const setPopupInfoState = useOpenPlaylistOptionsPopup();
    const setMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.LOAD_PLAYLIST,
            payload: playlistid
        }
        musicListManager(action);
    }

    const openOptionsSelector = (e: React.MouseEvent<HTMLElement>, playlistid: string) => {
        setPopupInfoState(e.target as HTMLElement, playlistid);
    }
    const openCreatePlaylistPopup = () => {
        formPopupManager(ModalKind.CreatePlaylist);
    }
    return (
        <div>
            <Suspense fallback={<Spinner></Spinner>}>
                <Playlists
                    goToPlaylistPage={props.goToPlaylistPage}
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