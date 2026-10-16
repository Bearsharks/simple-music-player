import { useAtom } from "jotai";
import { musicPlayerProgressState } from 'features/player/model/playback';
import ProgressBar from "features/player/ui/ProgressBar";

function ProgressBarConnected() {
    const [progress, setProgress] = useAtom(musicPlayerProgressState);
    return (
        <ProgressBar progress={progress} setProgress={setProgress} />
    )
}
export default ProgressBarConnected;
