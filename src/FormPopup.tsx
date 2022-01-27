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
    const { items, submit, kind } = useRecoilValue(FormPopupState);
    const setPopupOpen = useSetRecoilState(FormPopupOpenState);
    const closePopup = () => {
        setPopupOpen(false);
    }
    return (
        <div>
            {(kind === FormKind.CreatePlaylist) ?
                <CreatePlaylistPopup items={items as FormItem[]} submit={submit} closePopup={closePopup} /> :
                (kind === FormKind.AppendPlaylist) ?
                    <AppendPlaylistPopup items={items as PlaylistInfo[]} submit={submit} closePopup={closePopup} /> :
                    ""
            }
        </div>
    );
}

interface CreatePlaylistPopupProps {
    items: FormItem[];
    submit: (data: unknown) => void;
    closePopup: () => void;
}
function CreatePlaylistPopup({ items, submit, closePopup }: CreatePlaylistPopupProps) {
    const curRef = useRef<HTMLDivElement>(null);
    const onClickHandler = () => {
        let data = {} as any;
        const arr = curRef.current?.getElementsByTagName('input');
        if (arr) {
            for (let i = 0; i < arr.length; i++) {
                data[items[i].id] = arr[i].value;
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
                    <input id={item.id}></input>
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