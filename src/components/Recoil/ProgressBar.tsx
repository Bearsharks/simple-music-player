import { useRecoilState } from "recoil";
import { musicPlayerProgressState } from "recoilStates/playlistAtoms";
import ProgressBar from "components/ProgressBar";

function ProgressBarRecoil() {
    const [progress, setProgress] = useRecoilState(musicPlayerProgressState);
    return (
        <ProgressBar progress={progress} setProgress={setProgress} />
    )
}
export default ProgressBarRecoil;