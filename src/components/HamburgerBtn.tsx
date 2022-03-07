import styles from './HamburgerBtn.module.scss';
import React from 'react';

interface HamburgerBtnProps {
    onClickHandler?: (e: React.MouseEvent, isOpen: boolean) => void;
    isActive: boolean;
    setActive: (arg0: boolean) => void;
    initialValue?: boolean;
}
function HamburgerBtn(props: HamburgerBtnProps) {
    const togleActive = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isOpen = (props.isActive) ? false : true;
        props.setActive(isOpen);
        if (props.onClickHandler) props.onClickHandler(e, isOpen);
    }
    return (
        <button className={styles[`hamburger-btn`]}
            aria-label="menu togle"
            onClick={togleActive}>
            <div
                className={styles[`hamburger-wrapper`]}
            >
                <div
                    className={styles[`hamburger`] + " " + ((props.isActive) ? styles[`hamburger--active`] : "")}
                />
            </div>
        </button>

    );
}

export default HamburgerBtn;
