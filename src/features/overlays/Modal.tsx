import PlaylistImport from 'features/youtube/ui/PlaylistImport';
import { useAtom, useAtomValue, } from 'jotai'
import { ModalInfoState, ModalKind, ModalOpenState, useOpenYTOptionsPopup } from 'features/overlays/PopupStates';
import styles from 'features/overlays/Modal.module.scss'
import React, { Suspense } from 'react';
import { MusicInfo, Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from 'shared/model/constants';
import youtubeSearch, { getYTPlaylistByID, SearchType, urlToId } from 'features/youtube/api/youtubeSearch';
import Spinner from 'shared/ui/Spinner';
import { usePlaylistManager } from 'features/playlists/model/playlistAtoms';
import FormBox, { FormItem } from 'features/playlists/ui/formBox/FormBox';
import FormBoxPlaylist from 'features/playlists/ui/formBox/FormBoxPlaylist';

function Modal() {
    const [isOpen, setOpen] = useAtom(ModalOpenState);
    return !isOpen ? <div></div> : (
        <div>
            <div className={`${styles['wrapper']}`}>
                <ModalForm setModalOpen={setOpen} />
            </div>
            <div className={`${styles['overlay-backdrop']}`} onClick={() => setOpen(false)}></div>
        </div>
    );
}

function ModalForm({ setModalOpen }: { setModalOpen: (bool: boolean) => void }) {
    const modalState = useAtomValue(ModalInfoState);
    const closePopup = () => {
        setModalOpen(false);
    }
    const children = (() => {
        switch (modalState.kind) {
            case ModalKind.CreatePlaylist:
                return <PlaylistForm kind={modalState.kind} closePopup={closePopup} musicInfos={modalState.data} />;
            case ModalKind.UpdatePlaylist:
                return <PlaylistForm kind={modalState.kind} closePopup={closePopup} playlistInfo={modalState.data} />;
            case ModalKind.ImportYTPlaylistLink:
                return <PlaylistImport close={closePopup} />
            default:
                return <div></div>;
        }
    })();
    return children;
}
export default Modal;

interface PlaylistFormProps {
    closePopup: () => void;
    kind: ModalKind;
    playlistInfo?: PlaylistInfo;
    musicInfos?: MusicInfo[];
}

function PlaylistForm({ closePopup, kind, playlistInfo, musicInfos }: PlaylistFormProps) {
    const formItems: FormItem[] = [
        { id: "name", name: "제목", value: playlistInfo ? playlistInfo.name : "", require: true },
        { id: "description", name: "설명", value: playlistInfo ? playlistInfo.description : "" },
    ];
    const playlistManager = usePlaylistManager();
    const openYTPopup = useOpenYTOptionsPopup();
    const submit = (data: any) => {
        let info: any = {};
        if (playlistInfo) info = { ...playlistInfo };

        for (let item of formItems) {
            info[item.id] = data[item.id];
        }

        const payload = musicInfos ? {
            info: info as PlaylistInfo,
            items: musicInfos
        } : { info: info as PlaylistInfo };

        const action: PlaylistAction = {
            type: kind === ModalKind.CreatePlaylist ? PlaylistActionType.CREATE : PlaylistActionType.UPDATE,
            payload: payload
        }
        playlistManager(action);
        closePopup();
    }
    const btnClickHandler = (event: React.MouseEvent) => {
        event.preventDefault();
        openYTPopup(event.target as HTMLElement);
    }
    const name = (playlistInfo?.name) ? playlistInfo.name : "새 재생목록";
    return <FormBox name={name} formItems={formItems} closePopup={closePopup} submit={submit}>
        {kind === ModalKind.CreatePlaylist ?
            <button className={styles['importYTBtn']} onClick={btnClickHandler}>
                <span className='material-icons'>
                    add
                </span>
                유튜브에서 가져오기
            </button> : ""
        }
    </FormBox>

}
