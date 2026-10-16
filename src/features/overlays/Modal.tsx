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
                return <ImportYTPlaylistLink closePopup={closePopup} ></ImportYTPlaylistLink>
            default:
                return <div></div>;
        }
    })();
    return children;
}
export default Modal;

function ImportYTPlaylistLink({ closePopup }: { closePopup: () => void }) {
    const playlistManager = usePlaylistManager();
    const formItems: FormItem[] = [{ id: "url", name: "재생목록 URL", value: "", require: true }];
    const submit = async (data: any) => {
        const url: string = data.url;
        if (!url) return;
        const { id, kind } = urlToId(url);
        if (!id || kind !== SearchType.List) return;
        try {
            const info = await getYTPlaylistByID(id);
            const playlist: Playlist = {
                info: info,
                items: await youtubeSearch(info.id, SearchType.List)
            }
            const createAction: PlaylistAction = {
                type: PlaylistActionType.CREATE,
                payload: playlist
            }
            playlistManager(createAction);
        } catch (e) {
            console.error(e);
            alert('재생목록을 가져오지 못했습니다');
        } finally {
            closePopup();
        }
    }

    return <FormBox name='유튜브 재생목록 가져오기'
        formItems={formItems}
        closePopup={closePopup}
        submit={submit} />
}


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
