import Cover from "shared/ui/Cover";
import Icon from "shared/ui/Icon";
import MoreVert from "shared/ui/MoreVert";
import { MusicInfoItem } from "shared/model/constants";
import styles from "features/queue/ui/musicList/MusicItem.module.scss";
export interface MusicItemProps {
  idx: number;
  item: MusicInfoItem;
  playMusic: (idx: number | undefined) => void;
  openOptionsPopup: (target: HTMLElement, musicInfos: MusicInfoItem[]) => void;
  isCurMusic?: boolean;
  statusLabel?: string;
}
export function MusicItem({
  idx,
  item,
  playMusic,
  openOptionsPopup,
  isCurMusic,
  statusLabel,
}: MusicItemProps) {
  const popupOpen = (event: React.MouseEvent) => {
    openOptionsPopup(event.currentTarget as HTMLElement, [item]);
  };
  return (
    <div className={styles["wrapper"]}>
      <div className={styles[`grid-container`]}>
        <button
          type="button"
          className={`music-cover-button ${styles[`grid-item`]} ${styles["grid-item--fit"]}`}
          aria-label={`${item.name} 재생`}
          onClick={() => playMusic(idx)}
        >
          <Cover
            id={item.videoID || item.key}
            thumbnail={item.thumbnail}
            className={styles.thumbnail}
          />
          <span
            className={`${styles["overlay"]} ${isCurMusic && styles["overlay--show"]}`}
          >
            <Icon name="play" />
          </span>
        </button>
        <button
          type="button"
          className={styles[`grid-item`]}
          aria-label={`${item.name} 재생`}
          onClick={() => playMusic(idx)}
        >
          <span className={styles[`grid-item__text`]} title={item.name}>
            {item.name}
          </span>
          <span
            className={`${styles[`grid-item__text`]} ${styles[`grid-item__text--light`]}`}
            title={statusLabel || item.owner || "YouTube 영상"}
          >
            {statusLabel || item.owner || "YouTube 영상"}
          </span>
        </button>
        <MoreVert onClick={popupOpen} label={`${item.name} 더보기`}></MoreVert>
      </div>
    </div>
  );
}

export default MusicItem;
