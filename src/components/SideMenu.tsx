import React, { useRef } from "react"
import styles from './SideMenu.module.scss';
import { useRecoilState } from 'recoil';
import { sideMenuOpenState } from '../recoilStates/sideMenu'
import OuterClickEventCatcher from "./OuterClickEventCatcher";
import HamburgerBtn from './HamburgerBtn'
function SideMenu({ children }: { children?: React.ReactNode }) {
    const curRef = useRef<HTMLDivElement>(null);
    const [isActive, setActive] = useRecoilState(sideMenuOpenState);
    return (
        <div
            ref={curRef}
            className={`${styles["navigation"]} ${isActive && styles["navigation--active"]}`}
        >
            <div className={`${styles["close-button"]}`}>
                <HamburgerBtn setActive={setActive} isActive={isActive}></HamburgerBtn>
            </div>
            <div className={`${styles["miniLink"]}`}>
                {children}
            </div>
            {isActive && <OuterClickEventCatcher wrapper={curRef.current} setOpen={setActive}></OuterClickEventCatcher>}

        </div>
    );
}

export default SideMenu;
