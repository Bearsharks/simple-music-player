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
import PlaylistPage from './PlaylistPage';
import musiclistOpenState from './recoilStates/musiclistOpenState';
import { useSetRecoilState } from 'recoil';
function Main() {
    const navigate = useNavigate();
    const setMusicListOpen = useSetRecoilState(musiclistOpenState);

    const goToPlaylistPage = (id: string) => {
        navigate(`/playlist/${id}`);
    }
    const goToHome = () => {
        setMusicListOpen(false);
        navigate("/");

    }
    return (
        <div >
            <header className={styles["header"]}>
                <div className={styles["header__left-contents"]} onClick={goToHome}>
                    <span className="material-icons md-32">
                        home
                    </span>
                </div>
                <div className={styles["header__right-contents"]}>
                    <SearchBarRecoil></SearchBarRecoil>
                    <HamburgerBtn></HamburgerBtn>
                </div>
                <SideMenu></SideMenu>
            </header>
            <main>
                <div className={styles["main-contents"]}>
                    <Suspense fallback={<Spinner></Spinner>}>
                        <Routes>
                            <Route path="*" element={<PlaylistsRecoil goToPlaylistPage={goToPlaylistPage} />}
                            ></Route>
                            <Route path="playlist/:id" element={<PlaylistPage />} />
                        </Routes>
                    </Suspense>
                </div>
            </main>
            <FormPopup></FormPopup>
            <Popup></Popup>
            <MusicPlayer></MusicPlayer>
        </div>
    );
}


export default Main;
