import { useRecoilValue, useSetRecoilState } from 'recoil'
import { FormPopupState, FormPopupOpenState } from './recoilStates/PopupStates';
import styles from './FormPopup.module.scss'
import React, { useState, useRef, useEffect } from 'react';

export interface FormItems {
    id: string,
    name: string,
}
export interface FormPopupData {
    items: FormItems[];
    submit: (data: any) => void
}

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
    const curRef = useRef<HTMLDivElement>(null);
    const { items, submit } = useRecoilValue(FormPopupState);
    const setPopupOpen = useSetRecoilState(FormPopupOpenState);
    useEffect(() => {
        const onClickOutsideHandler = (event: MouseEvent | TouchEvent) => {
            debugger;
            if (curRef.current && curRef.current.contains(event.target as Node)) {
                return;
            }
            setPopupOpen(false);
        };
        document.addEventListener('click', onClickOutsideHandler);
        document.addEventListener('touchend', onClickOutsideHandler);
        return () => {
            document.removeEventListener('click', onClickOutsideHandler);
            document.removeEventListener('touchend', onClickOutsideHandler);
        };
    }, []);
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
            {items?.map((item: FormItems) =>
                <div key={item.id}>
                    <label>{item.name}</label>
                    <input id={item.id}></input>
                </div>
            )}
            <div>
                <button onClick={() => { setPopupOpen(false) }}>취소</button>
                <button onClick={onClickHandler}>확인</button>
            </div>
        </div>
    );
}
export default React.memo(Popup);