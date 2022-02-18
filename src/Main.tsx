import styles from './Main.module.scss';
import PlaylistsRecoil from './PlaylistsRecoil'
import FormPopup from './Popups/Modal';
import SearchBarRecoil from './SearchBarRecoil';
import MusicPlayer from './MusicPlayer';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import Spinner from './components/Spinner';
import Popup from './Popups/Popup';
import HamburgerBtn from './components/HamburgerBtn';
import SideMenu from './components/SideMenu';
import { useRecoilState } from 'recoil';
import { sideMenuOpenState } from './recoilStates/sideMenu';
import PlaylistPage from './PlaylistPage';
function Main() {
    const navigate = useNavigate();
    const [isSideMenuOpen, setOpenSideMenu] = useRecoilState(sideMenuOpenState);

    const goToPlaylistPage = (id: string) => {
        navigate(`/playlist/${id}`);
    }
    const goToHome = () => {
        navigate("/");
    }
    return (
        <div>
            <header className={styles["header"]}>
                <div onClick={goToHome}>
                    <span className="material-icons md-32">
                        home
                    </span>
                </div>
                <div className={styles["header__right-contents"]}>
                    <SearchBarRecoil></SearchBarRecoil>
                    <HamburgerBtn setActive={setOpenSideMenu} isActive={isSideMenuOpen}></HamburgerBtn>
                </div>
                <SideMenu></SideMenu>
            </header>
            <main>
                <Suspense fallback={<Spinner></Spinner>}>
                    <Routes>
                        <Route path="*" element={<PlaylistsRecoil goToPlaylistPage={goToPlaylistPage} />}
                        ></Route>
                        <Route path="playlist/:id" element={<PlaylistPage />} />
                    </Routes>
                </Suspense>
            </main>
            <FormPopup></FormPopup>
            <Popup></Popup>
            <MusicPlayer></MusicPlayer>
        </div>
    );
}


export default Main;