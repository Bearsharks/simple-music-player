import MusicList from 'components/MusicList/MusicList';
import { useOpenMusicOptionsPopup } from 'popups/PopupStates';
import { useCurMusicManager, useMusicListManager } from 'recoilStates/playlistAtoms';
import { MusicInfoActionType, MusicInfoItem, MusicListActionType } from 'refs/constants';
function MusicListRecoil({ items }: { items: MusicInfoItem[] }) {
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
export default MusicListRecoil;