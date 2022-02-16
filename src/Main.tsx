import styles from './Main.module.scss';
import PlaylistsRecoil from './PlaylistsRecoil'
import FormPopup from './Popups/Modal';
import SearchBarRecoil from './SearchBarRecoil';
import MusicPlayer from './MusicPlayer';
import { useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import Spinner from './components/Spinner';
import Popup from './Popups/Popup';
import HamburgerBtn from './components/HamburgerBtn';
import SideMenu from './components/SideMenu';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { sideMenuOpenState } from './recoilStates/sideMenu';
function Main() {
    const navigate = useNavigate();
    const [isSideMenuOpen, setOpenSideMenu] = useRecoilState(sideMenuOpenState);
    const logoutBtnClicked = (e: React.MouseEvent) => {
        e.stopPropagation();

        const logoutURL = `${process.env.REACT_APP_API_URL}/logout`;
        fetch(logoutURL, {
            credentials: 'include',
            cache: 'no-cache'
        }).then(() => {
            navigate('/login');
        }).catch((err) => {
            console.log(err);
        });
    }
    return (
        <div>
            <header className={`${styles["header"]}`}>
                <HamburgerBtn setActive={setOpenSideMenu} isActive={isSideMenuOpen}></HamburgerBtn>
                <SearchBarRecoil></SearchBarRecoil>
                <SideMenu>
                    <button onClick={logoutBtnClicked}>로그아웃</button>
                </SideMenu>
            </header>
            <main>
                <Suspense fallback={<Spinner></Spinner>}>
                    <FormPopup></FormPopup>
                    <Popup></Popup>
                    <PlaylistsRecoil></PlaylistsRecoil>
                    <br />
                    <br />
                    <br />
                </Suspense>
            </main>
            <MusicPlayer></MusicPlayer>
        </div>
    );
}


export default Main;