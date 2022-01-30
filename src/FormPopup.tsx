import { useRecoilValue, useSetRecoilState } from 'recoil'
import { FormPopupState, FormPopupOpenState, FormItem, FormKind } from './recoilStates/PopupStates';
import styles from './FormPopup.module.scss'
import React, { useState, useRef, useEffect } from 'react';
import { PlaylistInfo } from './refs/constants';


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
                    ""
            }
        </div>
    );
}

interface PlaylistFormProps {
    items: FormItem[];
    submit: (data: unknown) => void;
    closePopup: () => void; 
    playlistInfo? :PlaylistInfo;

}
function PlaylistForm({ items, submit, closePopup,playlistInfo }: PlaylistFormProps) {
    const curRef = useRef<HTMLDivElement>(null);
    const onClickHandler = () => {
        let data = {} as any;
        const arr = curRef.current?.getElementsByTagName('input');
        if (arr) {
            for (let i = 0; i < arr.length; i++) {
                data[items[i].id] = arr[i].value;
            }
            if(playlistInfo){
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
export default React.memo(Popup);