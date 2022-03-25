import styles from './Main.module.scss';
import React, { Suspense } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import SearchBarRecoil from 'components/recoil/SearchBar';
import HamburgerBtn from 'components/recoil/HamburgerBtn';
import SideMenu from 'components/recoil/SideMenu';
import Spinner from 'components/Spinner';
import FormPopup from 'popups/Modal';
import Popup from 'popups/Popup';
import musiclistOpenState from 'recoilStates/musiclistOpenState';
import { useSetRecoilState } from 'recoil';
import MusicPlayer from './MusicPlayer';
import Notice from 'popups/Notice';
const Playlists = React.lazy(() => import('components/recoil/Playlists'));
const PlaylistPage = React.lazy(() => import('./PlaylistPage'));

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
        <div>
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
                            <Route path="*" element={<Playlists goToPlaylistPage={goToPlaylistPage} />}
                            ></Route>
                            <Route path="playlist/:id" element={<PlaylistPage />} />
                        </Routes>
                    </Suspense>
                </div>
                <Notice></Notice>
            </main>
            <FormPopup></FormPopup>
            <Popup></Popup>
            <MusicPlayer></MusicPlayer>
        </div>
    );
}
export default Main;
