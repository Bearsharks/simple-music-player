import React, { useRef } from "react"
import styles from './SideMenu.module.scss';
import OuterClickEventCatcher from "./OuterClickEventCatcher";
import { useNavigate } from "react-router-dom";

export interface SideMenuProps {
    isActive: boolean;
    setActive: (arg0: boolean) => void;
    children?: React.ReactNode
}
function SideMenu({ children, isActive, setActive }: SideMenuProps) {
    const curRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const logoutBtnClicked = (e: React.MouseEvent) => {
        e.stopPropagation();

        const logoutURL = `${process.env.REACT_APP_API_URL}/logout`;
        fetch(logoutURL, {
            credentials: 'include',
            cache: 'no-cache'
        }).then(() => {
            sessionStorage.clear();
            navigate('/login');
        }).catch((err) => {
            console.log(err);
        });
    }
    return (
        <div
            ref={curRef}
            className={`${styles["navigation"]} ${isActive && styles["navigation--active"]}`}
        >
            <div className={styles["user-info"]}>
                <img
                    className={styles["user-info__img"]}
                    src={sessionStorage.getItem('userimg') as string}
                    alt={sessionStorage.getItem('username') as string}></img>
                <div>
                    {sessionStorage.getItem('username')}
                </div>
            </div>

            <div className={`${styles["wrapper"]}`}>
                <div
                    className={styles["options"]}
                    onClick={logoutBtnClicked}>
                    <div className={styles["options__icon"]} >
                        <span className={"material-icons"}>
                            logout
                        </span>
                    </div>
                    <div className={styles["options__text"]} >
                        로그아웃
                    </div>
                </div>
                {children}
                <OuterClickEventCatcher openState={[isActive, setActive]} wrapper={curRef}></OuterClickEventCatcher>

            </div>
        </div>
    );
}

export default SideMenu;
