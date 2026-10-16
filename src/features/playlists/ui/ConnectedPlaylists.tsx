
import { useAtomValue } from "jotai";
import { useMusicListManager } from 'features/queue/model/queue';
import { playlistInfosState } from 'features/playlists/model/playlistAtoms';
import { useModalManager, ModalKind, useOpenPlaylistOptionsPopup } from 'features/overlays/PopupStates';
import { MusicListAction, MusicListActionType, } from 'shared/model/constants';
import Playlists from 'features/playlists/ui/playlists/Playlists';
import Spinner from 'shared/ui/Spinner';
import { Suspense } from 'react';

interface PlaylistsConnectedProps {
    goToPlaylistPage: (id: string) => void;
}
function PlaylistsConnected(props: PlaylistsConnectedProps) {
    const playlistInfos = useAtomValue(playlistInfosState);
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


export default PlaylistsConnected;
