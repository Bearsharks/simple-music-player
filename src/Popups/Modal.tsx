import { useRecoilState, useRecoilValue, } from 'recoil'
import { ModalInfoState, ModalKind, ModalOpenState, useOpenYTOptionsPopup } from './PopupStates';
import styles from './Modal.module.scss'
import React, { useState, useRef, Suspense } from 'react';
import { Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from '../refs/constants';
import youtubeSearch, { getYTPlaylistByID, SearchType, urlToId } from '../refs/youtubeSearch';
import Spinner from '../components/Spinner';
import { myYTPlaylistInfosState } from '../recoilStates/YTPlaylistState';
import { usePlaylistManager } from '../recoilStates/atoms/playlistAtoms';
import PlaylistItem from '../components/PlaylistItem';


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
    const playlistManager = usePlaylistManager();
    const [selectedPlaylist, selectPlaylist] = useState("");
    const [selectedPlaylistName, selectPlaylistName] = useState("");
    const ytPLInfo = useRecoilValue(myYTPlaylistInfosState);
    const submit = async () => {
        let info = ytPLInfo.find((element) => element.id === selectedPlaylist);
        if (!info) throw "해당 재생목록이 존재하지 않음!";

        const playlist: Playlist = {
            info: info,
            items: await youtubeSearch(selectedPlaylist, SearchType.List)
        }
        const createAction: PlaylistAction = {
            type: PlaylistActionType.CREATE,
            payload: playlist
        }
        playlistManager(createAction);
        closePopup();
    }
    const playlistItemClickHandler = (selectedPlaylist: PlaylistInfo) => {
        selectPlaylist(selectedPlaylist.id);
        selectPlaylistName(selectedPlaylist.name);
    }
    return (
        <div>
            <h1 style={{ "padding": "0 20px" }}>나의 재생목록</h1>
            <div style={{ "padding": "0 25px" }}>
                <div className={styles['form-item']}>
                    <div className={styles['form-item__label']}>
                        <label>선택한 재생목록</label>
                    </div>
                    <input className={styles['playlist-form__input']}
                        readOnly={true} value={selectedPlaylistName} ></input>
                </div>
            </div>

            <div className={styles['grid-container']}>
                {ytPLInfo.map((info: PlaylistInfo) =>
                    <div style={info.id === selectedPlaylist ? { "border": "1px solid white" } : {}}
                        onClick={() => playlistItemClickHandler(info)}>
                        <PlaylistItem key={info.id} info={info} onClick={() => { }}></PlaylistItem>
                    </div>
                )}
            </div>
            <br></br>
            <div className={styles['playlist-form-actions']}>
                <div className={styles['playlist-form-actions__button']} onClick={closePopup}>취소</div>
                <div className={`${styles['playlist-form-actions__button--white']} ${styles['playlist-form-actions__button']}`}
                    onClick={submit}>제출</div>
            </div>
        </div>
    );
}

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

    return <Form name='유튜브 재생목록 가져오기'
        formItems={formItems}
        closePopup={closePopup}
        submit={submit} />
}

interface FormItem {
    id: string,
    name: string,
    value?: string,
    require?: boolean
}
interface PlaylistFormProps {
    closePopup: () => void;
    kind: ModalKind;
    playlistInfo?: PlaylistInfo;
}

function PlaylistForm({ closePopup, kind, playlistInfo }: PlaylistFormProps) {
    const formItems: FormItem[] = [
        { id: "name", name: "제목", value: playlistInfo ? playlistInfo.name : "", require: true },
        { id: "description", name: "설명", value: playlistInfo ? playlistInfo.description : "" },
    ];
    const playlistManager = usePlaylistManager();
    const openYTPopup = useOpenYTOptionsPopup();
    const submit = (data: any) => {
        let info: any = {};
        if (playlistInfo) info = playlistInfo;

        for (let item of formItems) {
            info[item.id] = data[item.id];
        }
        const action: PlaylistAction = {
            type: kind === ModalKind.CreatePlaylist ? PlaylistActionType.CREATE : PlaylistActionType.UPDATE,
            payload: {
                info: info as PlaylistInfo
            }
        }
        playlistManager(action);
        closePopup();
    }
    const btnClickHandler = (event: React.MouseEvent) => {
        event.preventDefault();
        openYTPopup(event.target as HTMLElement);
    }
    const name = (playlistInfo?.name) ? playlistInfo.name : "새 재생목록";
    return <Form name={name} formItems={formItems} closePopup={closePopup} submit={submit}>
        {kind === ModalKind.CreatePlaylist ?
            <button className={styles['importYTBtn']} onClick={btnClickHandler}>
                <span className='material-icons'>
                    add
                </span>
                유튜브에서 가져오기
            </button> : ""
        }
    </Form>

}

interface FormProps {
    formItems: FormItem[];
    name: string;
    closePopup: () => void;
    submit: (data: any) => void;
    children?: React.ReactChild
}
function Form({ formItems, closePopup, submit, name, children }: FormProps) {
    const curRef = useRef<HTMLFormElement>(null);
    const onClickHandler = (e: React.MouseEvent) => {
        e.preventDefault();
        if (curRef.current) {
            const formEle = curRef.current;
            let data = {} as any;
            const arr = formEle.getElementsByTagName('input');
            for (let i = 0; i < arr.length; i++) {
                data[formItems[i].id] = arr[i].value.trim();
                if (formItems[i].require && !data[formItems[i].id]) {
                    return;
                }
            }
            submit(data);
        }
    }
    return (
        <form ref={curRef} className={styles['playlist-form']}>
            <h2>
                {name}
            </h2>
            <br />
            {formItems.map((item: FormItem) =>
                <div key={item.id} className={styles['form-item']}>
                    <div className={styles['form-item__label']}>
                        <label>{item.name}</label>
                    </div>
                    <input className={styles['playlist-form__input']}
                        id={item.id} defaultValue={item.value}></input>
                </div>
            )}
            {!children ? "" :
                <div>
                    {children}
                </div>
            }
            <div className={styles['playlist-form-actions']}>
                <div className={styles['playlist-form-actions__button']} onClick={closePopup}>취소</div>
                <div className={`${styles['playlist-form-actions__button--white']} ${styles['playlist-form-actions__button']}`}
                    onClick={onClickHandler}>제출</div>
            </div>
        </form>
    );
}
