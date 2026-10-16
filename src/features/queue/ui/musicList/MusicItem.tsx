import MoreVert from "shared/ui/MoreVert";
import { MusicInfoItem } from "shared/model/constants";
import styles from "features/queue/ui/musicList/MusicItem.module.scss";
export interface MusicItemProps {
  idx: number;
  item: MusicInfoItem;
  playMusic: (idx: number | undefined) => void;
  openOptionsPopup: (target: HTMLElement, musicInfos: MusicInfoItem[]) => void;
  isCurMusic?: boolean;
}
export function MusicItem({
  idx,
  item,
  playMusic,
  openOptionsPopup,
  isCurMusic,
}: MusicItemProps) {
  const popupOpen = (event: React.MouseEvent) => {
    openOptionsPopup(event.currentTarget as HTMLElement, [item]);
  };
  return (
    <div className={styles["wrapper"]}>
      <div className={styles[`grid-container`]}>
        <button type="button"
          className={`${styles[`grid-item`]} ${styles["grid-item--fit"]}`}
          aria-label={`${item.name} 재생`} onClick={() => playMusic(idx)}
        >
          {item.thumbnail ? (
            <img
              className={styles["thumbnail"]}
              alt=""
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
              src={item.thumbnail}
            />
          ) : (
            <span className={styles["thumbnail"]}>
              <span className="material-icons md-32">question_mark</span>
            </span>
          )}
          <span
            className={`${styles["overlay"]} ${isCurMusic && styles["overlay--show"]}`}
          >
            <span className="material-icons md-32">play_arrow</span>
          </span>
        </button>
        <button type="button" className={styles[`grid-item`]}
          aria-label={`${item.name} 재생`} onClick={() => playMusic(idx)}
        >
          <span className={styles[`grid-item__text`]} title={item.name}>
            {item.name}
          </span>
          <span
            className={`${styles[`grid-item__text`]} ${styles[`grid-item__text--light`]}`}
            title={item.owner}
          >
            {item.owner}
          </span>
        </button>
        <MoreVert onClick={popupOpen} label={`${item.name} 더보기`}></MoreVert>
      </div>
    </div>
  );
}

export default MusicItem;
