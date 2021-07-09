import { curMusicInfoState, musicListState } from "./recoilStates/atoms/musicListAtoms"
import musicListStateManager from "./recoilStates/musicListStateManager";
import musicListFixture from "./__test__/fixtures/MusicListFixture";
import { useRecoilState } from "recoil"
function Testtset(props) {
    const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
    const [musicList, setMusicList] = useRecoilState(musicListState);
    const goNext = musicListStateManager.useGoNextMusic();
    const INITI = () => {
        setMusicList(musicListFixture);
        setCurMusicInfo({
            id: musicListFixture[1].id,
            idx: 1
        });

    }
    const gonextbtnclick = () => {
        goNext();
    }
    const stop = () => {
        debugger;
        console.log(curMusicInfo, musicList);
    }
    return (
        <div>
            <button onClick={INITI}>init</button>
            <button onClick={gonextbtnclick}>goNext</button>
            <button onClick={stop}> stop</button>
        </div>
    )
}

export default Testtset;