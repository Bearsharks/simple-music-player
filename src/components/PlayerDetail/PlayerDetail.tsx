import styles from './PlayerDetail.module.scss';
import { MusicInfoItem } from 'refs/constants';
import YoutubePlayer from 'components/Recoil/YoutubePlayer';
import { useOpenSelectTgtPlaylistPopup } from 'popups/PopupStates';
import MusicList from 'components/Recoil/MusicList';

export interface PlayerDetailProps {
    playerVisiblity: boolean;
    musicList: MusicInfoItem[];
}
function PlayerDetail({ playerVisiblity, musicList }: PlayerDetailProps) {
    const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
    const addToPlaylistBtnClickHandler = (event: React.MouseEvent) => {
        openSelectTgtPlaylistPopup(event.target as HTMLElement, musicList)
    }
    return (
        <div className={`${styles['wrapper']} ${(!playerVisiblity) && styles['wrapper--hide']}`}>
            <div className={`${styles['player-detail']} ${(!playerVisiblity) && styles['player-detail__hide']}`}>
                <div className={styles['player']}>
                    <YoutubePlayer></YoutubePlayer>
                </div>
                <div className={styles['menus']}>
                    <div>
                        다음 트랙
                    </div>
                    <button onClick={addToPlaylistBtnClickHandler} title={`재생목록에 추가`}>
                        <span className="material-icons md-28">playlist_add</span>
                        <label>재생목록에 추가</label>
                    </button>
                </div>
                <div className={styles['music-list']}>
                    <MusicList items={musicList}></MusicList>
                </div>
            </div>
        </div>
    );
}
export default PlayerDetail;

