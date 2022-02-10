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
function Main() {
    const navigate = useNavigate();
    const logoutBtnClicked = (e: React.MouseEvent, isOpen: boolean) => {
        e.stopPropagation();
        if (isOpen) return;

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
                <HamburgerBtn onClickHandler={logoutBtnClicked}></HamburgerBtn>
                <SearchBarRecoil></SearchBarRecoil>

            </header>
            <br />
            테스트 페이지입니다.
            <Suspense fallback={<Spinner></Spinner>}>
                <FormPopup></FormPopup>
                <Popup></Popup>
                <PlaylistsRecoil></PlaylistsRecoil>
            </Suspense>
            <MusicPlayer></MusicPlayer>
        </div>
    );
}


export default Main;