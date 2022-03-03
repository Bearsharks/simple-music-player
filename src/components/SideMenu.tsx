import React, { useRef } from "react"
import styles from './SideMenu.module.scss';
import { useRecoilState } from 'recoil';
import { sideMenuOpenState } from '../recoilStates/sideMenu'
import OuterClickEventCatcher from "./OuterClickEventCatcher";
import { useNavigate } from "react-router-dom";

function SideMenu({ children }: { children?: React.ReactNode }) {
    const curRef = useRef<HTMLDivElement>(null);
    const [isActive, setActive] = useRecoilState(sideMenuOpenState);
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
                <OuterClickEventCatcher isOpen={isActive} wrapper={curRef.current} setOpen={setActive}></OuterClickEventCatcher>

            </div>
        </div>
    );
}

export default SideMenu;
