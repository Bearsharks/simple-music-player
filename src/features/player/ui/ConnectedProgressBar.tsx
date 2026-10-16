import { useRecoilState } from "recoil";
import { musicPlayerProgressState } from "features/playlists/model/playlistAtoms";
import ProgressBar from "features/player/ui/ProgressBar";

function ProgressBarRecoil() {
    const [progress, setProgress] = useRecoilState(musicPlayerProgressState);
    return (
        <ProgressBar progress={progress} setProgress={setProgress} />
    )
}
export default ProgressBarRecoil;