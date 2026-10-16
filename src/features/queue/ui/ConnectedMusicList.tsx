import MusicList from 'features/queue/ui/musicList/MusicList';
import { useOpenMusicOptionsPopup } from 'features/overlays/PopupStates';
import { useCurMusicManager, useMusicListManager } from 'features/queue/model/queue';
import { MusicInfoActionType, MusicInfoItem, MusicListActionType } from 'shared/model/constants';
function MusicListConnected({ items }: { items: MusicInfoItem[] }) {
    const openMusicOptionsPopup = useOpenMusicOptionsPopup();
    const musicListManager = useMusicListManager();
    const curMusicManager = useCurMusicManager();

    const changeOrder = (src: number, dst: number) => {
        musicListManager({
            type: MusicListActionType.CHANGE_ORDER,
            payload: { to: dst, from: src }
        });
    }
    const playMusic = (idx: number | undefined) => {
        curMusicManager({
            type: MusicInfoActionType.SET_IDX,
            payload: idx
        });
    }
    return <MusicList
        items={items}
        playMusic={playMusic}
        openOptionsPopup={openMusicOptionsPopup}
        changeOrder={changeOrder} />
}
export default MusicListConnected;
