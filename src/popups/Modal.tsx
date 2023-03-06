import { useRecoilState, useRecoilValue, } from 'recoil'
import { ModalInfoState, ModalKind, ModalOpenState, useOpenYTOptionsPopup } from './PopupStates';
import styles from './Modal.module.scss'
import React, { Suspense } from 'react';
import { MusicInfo, Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from 'refs/constants';
import youtubeSearch, { getYTPlaylistByID, SearchType, urlToId } from 'refs/youtubeSearch';
import Spinner from 'components/Spinner';
import {useMyYTPlaylistInfos} from 'serverStates/YTPlaylistState';
import {usePlaylistManager} from 'recoilStates/playlistAtoms';
import FormBox, { FormItem } from 'components/formBox/FormBox';
import FormBoxPlaylist from 'components/formBox/FormBoxPlaylist';
import {useCreateSimplePlaylist} from "../serverStates/simplePlaylistState";

function Modal() {
    const [isOpen, setOpen] = useRecoilState(ModalOpenState);
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
    const modalState = useRecoilValue(ModalInfoState);
    const closePopup = () => {
        setModalOpen(false);
    }
    const children = (() => {
        switch (modalState.kind) {
            case ModalKind.CreatePlaylist:
                return <PlaylistForm kind={modalState.kind} closePopup={closePopup} musicInfos={modalState.data} />;
            case ModalKind.UpdatePlaylist:
                return <PlaylistForm kind={modalState.kind} closePopup={closePopup} playlistInfo={modalState.data} />;
            case ModalKind.ImportMyYTPlaylist:
                return <Suspense fallback={<Spinner />}>
                    <ImportMyYTPlaylistForm closePopup={closePopup} />
                </Suspense>;
            case ModalKind.ImportYTPlaylistLink:
                return <ImportYTPlaylistLink closePopup={closePopup} ></ImportYTPlaylistLink>
            default:
                return <div></div>;
        }
    })();
    return children;
}
export default Modal;

function ImportMyYTPlaylistForm({ closePopup }: { closePopup: () => void }) {
    const createSimplePlaylist = useCreateSimplePlaylist();
    const { isLoading, error, data, isFetching } = useMyYTPlaylistInfos();
    if(isLoading || !data) return <Spinner/>;
    if (error) return <div>An error has occurred: "</div>;
    const myYTPlaylistInfo = data;
    const submit = async (tgtPlaylist: PlaylistInfo) => {
        let info = myYTPlaylistInfo?.find((element) => element.id === tgtPlaylist.id);
        if (!info) throw "해당 재생목록이 존재하지 않음!";

        const playlist: Playlist = {
            info: info,
            items: await youtubeSearch(tgtPlaylist.id, SearchType.List)
        }
        createSimplePlaylist.mutate(playlist, () => closePopup());
    }
    return <FormBoxPlaylist
            name={"나의 재생목록"}
            closePopup={closePopup}
            playlistInfos={myYTPlaylistInfo}
            submit={submit}
        />
}

function ImportYTPlaylistLink({ closePopup }: { closePopup: () => void }) {
    const createSimplePlaylist = useCreateSimplePlaylist();
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
            createSimplePlaylist.mutate(playlist, () => closePopup());
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
    const createSimplePlaylist = useCreateSimplePlaylist();
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

        if (kind === ModalKind.UpdatePlaylist) {
            const action: PlaylistAction = {
                type: PlaylistActionType.UPDATE,
                payload: payload
            }
            playlistManager(action);
            closePopup();
            return;
        }
        createSimplePlaylist.mutate(payload as Playlist, () => closePopup());
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
