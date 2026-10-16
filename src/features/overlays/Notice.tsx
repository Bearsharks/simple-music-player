import { useEffect, useRef, useState } from 'react';
import { atom, useStore, useAtomValue } from 'jotai';
import styles from 'features/overlays/Notice.module.scss'

const noticeTextState = atom<{ id: number, text: string }>({ id: 0, text: "" })
export const useNotice = () => {
    const store = useStore();
    const { set } = store;
    return (text: string) => {
            set(noticeTextState, (prev) => {
                return {
                    id: prev.id + 1,
                    text: text
                }
            });
        }

}
function Notice() {
    const noticeState = useAtomValue(noticeTextState);
    const [isShow, show] = useState(false);
    const timerRef = useRef<any>(null);
    useEffect(() => {
        if (!noticeState.text) return;
        show(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            show(false);
            timerRef.current = null;
        }, 3000);
        return () => { clearTimeout(timerRef.current) }
    }, [noticeState]);
    return <div className={`${styles['wrapper']} ${!isShow && styles['hide']}`}
    >{noticeState.text}</div>
}

export default Notice;
