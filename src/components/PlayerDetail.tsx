import styles from './PlayerDetail.module.scss';
import MusicList from './MusicList';
import { useCurMusicManager, useMusicListManager } from '../recoilStates/atoms/playlistAtoms';
import { MusicInfoActionType, MusicInfoItem, MusicListActionType } from '../refs/constants';
import YoutubePlayer from '../YoutubePlayer';
import { useOpenMusicOptionsPopup, useOpenSelectTgtPlaylistPopup } from '../Popups/PopupStates';

export interface PlayerDetailProps {
    playerVisiblity: boolean;
    musicList: MusicInfoItem[];
}
function PlayerDetail({ playerVisiblity, musicList }: PlayerDetailProps) {
    const openMusicOptionsPopup = useOpenMusicOptionsPopup();
    const musicListManager = useMusicListManager();
    const curMusicManager = useCurMusicManager();
    const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
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
    const addToPlaylistBtnClickHandler = (event: React.MouseEvent) => {
        openSelectTgtPlaylistPopup(event.target as HTMLElement, musicList)
    }
    return (
        <div className={`${styles['wrapper']} ${(!playerVisiblity) && styles['wrapper--hide']}`}>
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                <div></div>
                <YoutubePlayer></YoutubePlayer>
                <div></div>
                <div className={styles['player-detail__menus']}>
                    <div>
                        다음 트랙
                    </div>
                    <div></div>
                    <button onClick={addToPlaylistBtnClickHandler} >
                        <span className="material-icons md-28">playlist_add</span> 재생목록에 추가
                    </button>
                </div>
                <MusicList
                    items={musicList}
                    playMusic={playMusic}
                    openOptionsPopup={openMusicOptionsPopup}
                    changeOrder={changeOrder} />
            </div>
        </div>
    );
}
export default PlayerDetail;
