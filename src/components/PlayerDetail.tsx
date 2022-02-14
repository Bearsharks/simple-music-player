import styles from './PlayerDetail.module.scss';
import MusicList from './MusicList';
import { useCurMusicManager, useMusicListManager } from '../recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoActionType, MusicInfoItem, MusicListActionType } from '../refs/constants';
import YoutubePlayer from '../YoutubePlayer';

export interface PlayerDetailProps {
    playerVisiblity: boolean;
    addToPlaylist: (event: React.MouseEvent<Element, MouseEvent>, items: MusicInfo[]) => void;
    openPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
    musicList: MusicInfoItem[];
}
function PlayerDetail({ playerVisiblity, addToPlaylist, openPopup, musicList }: PlayerDetailProps) {

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
    return (
        <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
            <div></div>
            <YoutubePlayer></YoutubePlayer>
            <div></div>
            <div className={styles['player-detail__menus']}>
                <div>
                    다음 트랙
                </div>
                <div></div>
                <button onClick={(event: React.MouseEvent) => addToPlaylist(event, musicList)} >
                    <span className="material-icons md-28">playlist_add</span> 재생목록에 추가
                </button>
            </div>
            <MusicList
                items={musicList}
                playMusic={playMusic}
                openOptionsPopup={openPopup}
                changeOrder={changeOrder} />
        </div>
    );
}
export default PlayerDetail;
