import { useRecoilValue, useRecoilState } from 'recoil'
import { OptionSelectorState, OptionSelectorOpenState, OptionSelectorInfo } from './recoilStates/PopupStates';
import styles from './OptionsSelectorPopupRecoil.module.scss'
import React, { useState, useRef, useEffect } from 'react';
import OptionSelector from './components/OptionSelector';

function OptionsSelectorPopupRecoil() {
    const curRef = useRef<HTMLDivElement>(null);
    const info: OptionSelectorInfo = useRecoilValue(OptionSelectorState);
    const [isOpen, setOpen] = useRecoilState(OptionSelectorOpenState);
    useEffect(() => {
        const onClickOutsideHandler = (event: MouseEvent | TouchEvent) => {
            if (curRef.current && curRef.current.contains(event.target as Node)) {
                return;
            }
            setOpen(false);
        };
        document.addEventListener('click', onClickOutsideHandler);
        document.addEventListener('touchend', onClickOutsideHandler);
        return () => {
            document.removeEventListener('click', onClickOutsideHandler);
            document.removeEventListener('touchend', onClickOutsideHandler);
        };
    }, []);

    useEffect(() => {
        if (!curRef.current || !info.target) return;
        const target: HTMLElement = info.target as HTMLElement;
        const { left, width, top } = target.getBoundingClientRect();

        const tgtRight = left + width;
        const x = window.innerWidth >= tgtRight + curRef.current.offsetWidth ?
            tgtRight : left - curRef.current.offsetWidth;
        const y = window.innerHeight >= top + curRef.current.offsetHeight ?
            top : top - curRef.current.offsetHeight;

        curRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }, [info])
    return (
        <div
            className={`${styles['wrapper']} ${!isOpen && styles['wrapper--hide']}`}
            ref={curRef}
        >
            {info.items && <OptionSelector data={info.data} options={info.items}></OptionSelector>}
        </div>
    );
}
export default React.memo(OptionsSelectorPopupRecoil);