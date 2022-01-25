import { useRecoilValue, useSetRecoilState } from 'recoil'
import { FormPopupState, FormPopupOpenState, FormItem } from './recoilStates/PopupStates';
import styles from './FormPopup.module.scss'
import React, { useState, useRef, useEffect } from 'react';


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
                <button onClick={() => { setPopupOpen(false) }}>취소</button>
                <button onClick={onClickHandler}>확인</button>
            </div>
        </div>
    );
}
export default React.memo(Popup);