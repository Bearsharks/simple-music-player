import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { ModalInfoState, ModalKind, ModalOpenState, PopupInfoState, PopupKind, popupOpenState, useModalManager } from './PopupStates';
import styles from './Modal.module.scss'
import { useState, useRef, Suspense } from 'react';
import { Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from '../refs/constants';
import youtubeSearch, { SearchType } from '../refs/youtubeSearch';
import Spinner from '../components/Spinner';
import { myYTPlaylistInfosState } from '../recoilStates/YTPlaylistState';
import { usePlaylistManager } from '../recoilStates/atoms/playlistAtoms';


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
    return (
        <div>
            <h1>나의 재생목록</h1>
            {
                ytPLInfo.map((info: PlaylistInfo) =>
                    <div
                        key={info.id}
                        onClick={() => selectPlaylist(info.id)}
                        style={selectedPlaylist === info.id ? { border: '1px solid' } : {}}
                    >
                        {`${info.name}/${info.description}`}
                    </div>)
            }
            <div>
                <button onClick={closePopup}>취소</button>

                {/*playlist 인터페이스로 데이터를 넘겨  */}
                <button onClick={submit}>확인</button>
            </div>

        </div>
    );
}

interface FormItem {
    id: string,
    name: string,
    value?: string
}
interface PlaylistFormProps {
    closePopup: () => void;
    kind: ModalKind;
    playlistInfo?: PlaylistInfo;
}
function PlaylistForm({ closePopup, kind, playlistInfo }: PlaylistFormProps) {
    const curRef = useRef<HTMLFormElement>(null);
    const formItems: FormItem[] = [
        { id: "name", name: "이름", value: playlistInfo ? playlistInfo.name : "" },
        { id: "description", name: "설명", value: playlistInfo ? playlistInfo.description : "" },
    ];

    const playlistManager = usePlaylistManager();

    const setPopupInfoState = useSetRecoilState(PopupInfoState);
    const setPopupOpen = useSetRecoilState(popupOpenState);

    const onClickHandler = () => {
        if (curRef.current) {
            const formEle = curRef.current;
            let data = {} as any;
            const arr = formEle.getElementsByTagName('input');
            for (let i = 0; i < arr.length; i++) {
                data[formItems[i].id] = arr[i].value;
            }
            if (kind === ModalKind.UpdatePlaylist) {
                data.id = playlistInfo?.id;
            }
            const action: PlaylistAction = {
                type: kind === ModalKind.CreatePlaylist ? PlaylistActionType.CREATE : PlaylistActionType.UPDATE,
                payload: {
                    info: data as PlaylistInfo
                }
            }
            playlistManager(action);
            closePopup();
        }
    }

    const openYTPopup = (event: React.MouseEvent) => {
        event.preventDefault();
        setPopupInfoState({
            target: event.target as HTMLElement,
            kind: PopupKind.YTOptions,
        });
        setPopupOpen(true);
    }

    return (
        <form ref={curRef} >
            {formItems.map((item: FormItem) =>
                <div key={item.id}>
                    <label>{item.name}</label>
                    <input id={item.id} defaultValue={item.value}></input>
                </div>
            )}
            <div>
                {kind === ModalKind.CreatePlaylist &&
                    <button onClick={openYTPopup}>유튜브에서 가져오기</button>
                }
                <button onClick={closePopup}>취소</button>
                <button onClick={onClickHandler}>확인</button>

            </div>
        </form>
    );
}