import styles from './HamburgerBtn.module.scss';
import React, { useState } from 'react';

interface HamburgerBtnProps {
    onClickHandler: (e: React.MouseEvent, isOpen: boolean) => void;
    initialValue?: boolean;
}
function HamburgerBtn(props: HamburgerBtnProps) {
    const [isActive, setActive] = useState(props.initialValue ? props.initialValue : false);
    const togleActive = (e: React.MouseEvent) => {
        const isOpen = (isActive) ? false : true;
        setActive(isOpen);
        props.onClickHandler(e, isOpen);
    }
    return (
        <button className={styles[`hamburger-btn`]}
            onClick={togleActive}>
            <div
                className={styles[`hamburger-wrapper`]}
            >
                <div
                    className={styles[`hamburger`] + " " + ((isActive) ? styles[`hamburger--active`] : "")}
                />
            </div>
        </button>

    );
}

export default HamburgerBtn;
