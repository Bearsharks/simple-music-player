import MoreVert from "components/MoreVert";
import { MusicInfoItem } from "refs/constants";
import styles from './MusicItem.module.scss';
export interface MusicItemProps {
    idx: number;
    item: MusicInfoItem;
    playMusic: (idx: number | undefined) => void;
    openOptionsPopup: (target: HTMLElement, musicInfos: MusicInfoItem[]) => void;
    isCurMusic?: boolean;
};
export function MusicItem({ idx, item, playMusic, openOptionsPopup, isCurMusic }: MusicItemProps) {
    const popupOpen = (event: React.MouseEvent) => {
        openOptionsPopup(event.target as HTMLElement, [item]);
    }
    return (
        <div className={styles['wrapper']} >
            <div className={styles[`grid-container`]}>
                <div className={`${styles[`grid-item`]} ${styles["grid-item--fit"]}`} onClick={() => { playMusic(idx) }}>
                    {item.thumbnail ?
                        <img className={styles["thumbnail"]} alt={item.name} src={item.thumbnail} /> :
                        <div className={styles["thumbnail"]}>
                            <span className="material-icons md-32">
                                question_mark
                            </span>
                        </div>
                    }

                    <div className={`${styles["overlay"]} ${isCurMusic && styles["overlay--show"]}`}>
                        <span className="material-icons md-32">
                            play_arrow
                        </span>
                    </div>
                </div>
                <div className={styles[`grid-item`]} onClick={() => { playMusic(idx) }}>
                    <div
                        className={styles[`grid-item__text`]}
                        title={item.name}
                    >
                        {item.name}
                    </div>
                    <div
                        className={`${styles[`grid-item__text`]} ${styles[`grid-item__text--light`]}`}
                        title={item.owner}
                    >
                        {item.owner}
                    </div>
                </div>
                <MoreVert onClick={popupOpen} ></MoreVert>
            </div>
        </div>
    );
}

export default MusicItem;