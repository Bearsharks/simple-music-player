import styles from './HamburgerBtn.module.scss';
import React from 'react';
import { sideMenuOpenState } from '../recoilStates/sideMenu';
import { useRecoilState } from 'recoil';

interface HamburgerBtnProps {
    onClickHandler?: (e: React.MouseEvent, isOpen: boolean) => void;
    initialValue?: boolean;
}
function HamburgerBtn(props: HamburgerBtnProps) {
    const [isSideMenuOpen, setOpenSideMenu] = useRecoilState(sideMenuOpenState);
    const togleActive = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isOpen = (isSideMenuOpen) ? false : true;
        setOpenSideMenu(isOpen);
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
                    className={styles[`hamburger`] + " " + ((isSideMenuOpen) ? styles[`hamburger--active`] : "")}
                />
            </div>
        </button>

    );
}

export default HamburgerBtn;
