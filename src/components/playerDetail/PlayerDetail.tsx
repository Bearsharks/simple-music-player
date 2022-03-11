import styles from './PlayerDetail.module.scss';
import React from 'react';
import { MusicInfoItem, MusicListActionType } from 'refs/constants';
import { useOpenSelectTgtPlaylistPopup } from 'popups/PopupStates';
import { useMusicListManager } from 'recoilStates/playlistAtoms';
import YoutubePlayer from 'components/recoil/YoutubePlayer';
const MusicList = React.lazy(() => import('components/recoil/MusicList'));

export interface PlayerDetailProps {
    playerVisiblity: boolean;
    musicList: MusicInfoItem[];
}
function PlayerDetail({ playerVisiblity, musicList }: PlayerDetailProps) {
    const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
    const musiclistManger = useMusicListManager();
    const addToPlaylistBtnClickHandler = (event: React.MouseEvent) => {
        openSelectTgtPlaylistPopup(event.target as HTMLElement, musicList)
    }
    const clearPlaylistBtnClickHandler = (event: React.MouseEvent) => {
        musiclistManger({
            type: MusicListActionType.DELETE,
            payload: musicList
        })
    }
    const isVisible = playerVisiblity && musicList.length > 0;
    return (
        <div className={`${styles['wrapper']} ${(!isVisible) && styles['wrapper--hide']}`}>
            <div className={`${styles['player-detail']} ${(!isVisible) && styles['player-detail__hide']}`}>
                <div className={styles['player']}>
                    <YoutubePlayer></YoutubePlayer>
                </div>
                {musicList.length > 0 && <>
                    <div className={styles['menus']}>
                        <div>
                            다음 트랙
                        </div>
                        <div className={styles['menus-options']}>
                            <div
                                className={styles['menus-options__button']}
                                onClick={addToPlaylistBtnClickHandler}
                                title={`재생목록에 추가`}
                            >
                                <span className="material-icons md-32">playlist_add</span>
                            </div>
                            <div
                                className={styles['menus-options__button']}
                                onClick={clearPlaylistBtnClickHandler}
                                title={`재생목록 비우기`}
                            >
                                <span className="material-icons md-32">playlist_remove</span>
                            </div>
                        </div>

                    </div>
                    <div className={styles['music-list']}>
                        <MusicList items={musicList}></MusicList>
                    </div>
                </>}

            </div>
        </div>
    );
}
export default PlayerDetail;

