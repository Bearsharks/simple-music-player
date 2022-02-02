import './Test.scss';
import PlaylistsRecoil from './PlaylistsRecoil'
import FormPopup from './FormPopup';
import OptionsSelectorPopupRecoil from './OptionsSelectorPopupRecoil';
import SearchBarRecoil from './SearchBarRecoil';
import MusicPlayer from './MusicPlayer';
import { useNavigate } from 'react-router-dom';
import { tokenToString } from 'typescript';
function TestPage() {
    const navigate = useNavigate();
    //
    //1
    /**todo
     * 
     * 2. 검색바를 통해 음악 목록을 추가할수 있다.
     * 2.1 추가시 팝업창을 띄우고 다음으로 재생하거나 마지막에 추가를 선택할수 있는 옵션선택팝업을 띄운다
     * 2.2.선택하면 그 동작대로 현재 재생목록에 추가한다.
     * 
     * 3. 현재재생목록에서 현재 재생목록을 전체를 저장 할 수 있다. 팝업으로 정보를 전달한다.
     * 3.1. 음악에서 생성버튼을 누르면 그 음악만을 포함해서 재생목록을 만들 수 있다
     * 3.2. 재생목록생성버튼을 누르면 팝업으로 빈 재생목록, 나의 유튜브보관함에서 가져오기, 유튜브 링크로 가져오기중 선택할수있다.

     */
    const logoutBtnClicked = () => {
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
            <SearchBarRecoil></SearchBarRecoil>
            <button onClick={logoutBtnClicked}>로그아웃</button><br />
            테스트 페이지입니다.
            <FormPopup></FormPopup>
            <OptionsSelectorPopupRecoil />
            <PlaylistsRecoil></PlaylistsRecoil>
            <MusicPlayer></MusicPlayer>
        </div>
    );
}


export default TestPage;