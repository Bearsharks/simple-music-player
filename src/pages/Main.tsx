import styles from './Main.module.scss';
import Playlists from 'components/recoil/Playlists'
import FormPopup from 'popups/Modal';
import SearchBarRecoil from 'components/recoil/SearchBar';
import MusicPlayer from './MusicPlayer';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import Spinner from 'components/Spinner';
import Popup from 'popups/Popup';
import HamburgerBtn from 'components/recoil/HamburgerBtn';
import SideMenu from 'components/recoil/SideMenu';
import PlaylistPage from './PlaylistPage';
import musiclistOpenState from 'recoilStates/musiclistOpenState';
import { useSetRecoilState } from 'recoil';

const Playlists = React.lazy(() => import('pages/Playlists'));
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
                            <Route path="*" element={<Playlists goToPlaylistPage={goToPlaylistPage} />}
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
