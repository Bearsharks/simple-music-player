import styles from './PlayerDetail.module.scss';

import { MusicInfoItem } from '../refs/constants';
import YoutubePlayer from '../YoutubePlayer';
import { useOpenSelectTgtPlaylistPopup } from '../Popups/PopupStates';
import MusicListRecoil from '../MusicListRecoil';

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
                <MusicListRecoil items={musicList}></MusicListRecoil>
            </div>
        </div>
    );
}
export default PlayerDetail;

