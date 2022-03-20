import React, { useRef } from "react";
import styles from './FormBox.module.scss';
export interface FormItem {
    id: string,
    name: string,
    readonly?: boolean,
    value?: string,
    require?: boolean
}
export interface FormBoxProps {
    formItems: FormItem[];
    name: string;
    closePopup: () => void;
    submit: (data: any) => void;
    children?: React.ReactChild | React.ReactChild[]
}
function FormBox({ formItems, closePopup, submit, name, children }: FormBoxProps) {
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
    const stopPropa = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    }
    return (
        <form ref={curRef}
            onKeyDown={stopPropa}
            className={styles['wrapper']}>
            <h2>
                {name}
            </h2>
            <br />
            {formItems.map((item: FormItem) =>
                <div key={item.id}
                    className={`${styles['formbox-item']} ${item.readonly && styles['formbox-item--readonly']}`}
                >
                    <div className={styles['formbox-item__label']}>
                        <label>{item.name}</label>
                    </div>
                    <input className={styles['formbox__input']}
                        id={item.id} defaultValue={item.value}
                        readOnly={item.readonly}
                    ></input>
                    <br></br>
                </div>
            )}
            {!children ? "" :
                <div>
                    {children}
                </div>
            }
            <div className={styles['formbox-actions']}>
                <div className={styles['formbox-actions__button']} onClick={closePopup}>취소</div>
                <div className={`${styles['formbox-actions__button--white']} ${styles['formbox-actions__button']}`}
                    onClick={onClickHandler}>제출</div>
            </div>
        </form>
    );
}
export default FormBox;