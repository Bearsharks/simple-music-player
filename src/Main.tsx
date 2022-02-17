import styles from './Main.module.scss';
import PlaylistsRecoil from './PlaylistsRecoil'
import FormPopup from './Popups/Modal';
import SearchBarRecoil from './SearchBarRecoil';
import MusicPlayer from './MusicPlayer';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Suspense } from 'react';
import Spinner from './components/Spinner';
import Popup from './Popups/Popup';
import HamburgerBtn from './components/HamburgerBtn';
import SideMenu from './components/SideMenu';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { sideMenuOpenState } from './recoilStates/sideMenu';
import PlaylistPage from './PlaylistPage';
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
    const goToPlaylistPage = (id: string) => {
        navigate(`/playlist/${id}`);
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