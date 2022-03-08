import styles from './Main.module.scss';
import PlaylistsRecoil from 'components/Recoil/Playlists'
import FormPopup from 'popups/Modal';
import SearchBarRecoil from 'components/Recoil/SearchBar';
import MusicPlayer from './MusicPlayer';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import Spinner from 'components/Spinner';
import Popup from 'popups/Popup';
import HamburgerBtn from 'components/Recoil/HamburgerBtn';
import SideMenu from 'components/Recoil/SideMenu';
import PlaylistPage from './PlaylistPage';
import musiclistOpenState from 'recoilStates/musiclistOpenState';
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


//페이지 메인 로그인 콜백 뮤직플레이어
//컴포넌트
//단순 사이드 메뉴, 버튼, 모어버트,스피너, 뮤직 아이템, 옵션셀렉터, 폼박스
//복합 뮤직리스트, 뮤직리스트 아이템즈, 폼박스플레이리스트,플레이어 서치바 등등
export default Main;
