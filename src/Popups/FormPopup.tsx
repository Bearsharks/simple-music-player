import { useRecoilValue, useSetRecoilState } from 'recoil'
import { FormPopupState, FormPopupOpenState, FormItem, FormKind } from './PopupStates';
import styles from './FormPopup.module.scss'
import React, { useState, useRef, Suspense } from 'react';
import { Playlist, PlaylistInfo } from '../refs/constants';
import youtubeSearch, { SearchType } from '../refs/youtubeSearch';
import Spinner from '../components/Spinner';
import { myYTPlaylistInfosState } from '../recoilStates/YTPlaylistState';


function Popup() {
    const isOpen = useRecoilValue(FormPopupOpenState);
    return (
        <div
            className={`${styles['wrapper']}`}
        >
            {isOpen && <FormPopup />}
        </div>
    );
}

function FormPopup() {
    const { items, submit, kind, data } = useRecoilValue(FormPopupState);
    const setPopupOpen = useSetRecoilState(FormPopupOpenState);
    const closePopup = () => {
        setPopupOpen(false);
    }
    return (
        <div>
            {(kind === FormKind.CreatePlaylist || kind === FormKind.UpdatePlaylist) ?
                <PlaylistForm items={items as FormItem[]} submit={submit} closePopup={closePopup} playlistInfo={data} /> :
                (kind === FormKind.AppendPlaylist) ?
                    <AppendPlaylistPopup items={items as PlaylistInfo[]} submit={submit} closePopup={closePopup} /> :
                    (kind === FormKind.ImportYTPlaylist) ?
                        <Suspense fallback={<Spinner />}>
                            <ImportYTPlaylistPopup items={[]} submit={submit} closePopup={closePopup} />
                        </Suspense> : ""
            }
        </div>
    );
}

interface PlaylistFormProps {
    items: FormItem[];
    submit: (data: unknown) => void;
    closePopup: () => void;
    playlistInfo?: PlaylistInfo;

}
function PlaylistForm({ items, submit, closePopup, playlistInfo }: PlaylistFormProps) {
    const curRef = useRef<HTMLDivElement>(null);
    const onClickHandler = () => {
        let data = {} as any;
        const arr = curRef.current?.getElementsByTagName('input');
        if (arr) {
            for (let i = 0; i < arr.length; i++) {
                data[items[i].id] = arr[i].value;
            }
            if (playlistInfo) {
                data.id = playlistInfo.id;
            }
        }
        submit(data);
    }
    return (
        <div
            className={`${styles['wrapper']}`}
            ref={curRef}
        >
            {items?.map((item: FormItem) =>
                <div key={item.id}>
                    <label>{item.name}</label>
                    <input id={item.id} defaultValue={item.value}></input>
                </div>
            )}
            <div>
                <button onClick={closePopup}>취소</button>
                <button onClick={onClickHandler}>확인</button>
            </div>
        </div>
    );
}
interface AppendPlaylistPopupProps {
    items: PlaylistInfo[];
    submit: (data: unknown) => void;
    closePopup: () => void;
}

function AppendPlaylistPopup({ items, submit, closePopup }: AppendPlaylistPopupProps) {
    const [selectedPlaylist, selectPlaylist] = useState("");
    return (
        <div className={`${styles['wrapper']}`}>
            <label>선택 : </label><input type='text' value={selectedPlaylist} readOnly></input>
            {
                items.map((info) =>
                    <div
                        key={info.id}
                        onClick={() => selectPlaylist(info.id)}
                    >
                        {`${info.id}${info.name}${info.description}`}
                    </div>)
            }
            <div>
                <button onClick={closePopup}>취소</button>
                <button onClick={() => submit(selectedPlaylist)}>확인</button>
            </div>
        </div>
    );
}
function ImportYTPlaylistPopup({ submit, closePopup }: AppendPlaylistPopupProps) {
    const [selectedPlaylist, selectPlaylist] = useState("");
    const ytPLInfo = useRecoilValue(myYTPlaylistInfosState);
    const importYTPL = async () => {
        let info = ytPLInfo.find((element, index, array) => element.id === selectedPlaylist);
        if (!info) throw "해당 재생목록이 존재하지 않음!";
        const playlist: Playlist = {
            info: info,
            items: await youtubeSearch(selectedPlaylist, SearchType.List)//이걸 구현해야함
        }
        submit(playlist);
    }
    return (
        <div className={`${styles['wrapper']}`}>

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
                <button onClick={importYTPL}>확인</button>
            </div>

        </div>
    );
}
export default React.memo(Popup);