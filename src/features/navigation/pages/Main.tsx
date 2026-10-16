import styles from 'features/navigation/pages/Main.module.scss';
import React, { Suspense } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import SearchBarConnected from 'features/search/ui/ConnectedSearchBar';
import HamburgerBtn from 'features/navigation/ui/ConnectedHamburgerBtn';
import SideMenu from 'features/navigation/ui/ConnectedSideMenu';
import Spinner from 'shared/ui/Spinner';
import FormPopup from 'features/overlays/Modal';
import Popup from 'features/overlays/Popup';
import musiclistOpenState from 'features/queue/model/musiclistOpenState';
import { useSetAtom } from 'jotai';
import MusicPlayer from 'features/player/pages/MusicPlayer';
import Notice from 'features/overlays/Notice';
const Playlists = React.lazy(() => import('features/playlists/ui/ConnectedPlaylists'));
const PlaylistPage = React.lazy(() => import('features/playlists/pages/PlaylistPage'));

function Main() {
    const navigate = useNavigate();
    const setMusicListOpen = useSetAtom(musiclistOpenState);

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
                    <SearchBarConnected></SearchBarConnected>
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
