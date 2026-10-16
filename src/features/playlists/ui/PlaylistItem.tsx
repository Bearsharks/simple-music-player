import { PlaylistInfo } from "shared/model/constants";
import styles from "features/playlists/ui/PlaylistItem.module.scss";
import Cover from "shared/ui/Cover";

interface PlaylistItemProps {
  info: PlaylistInfo;
  onClick: (id: string) => void;
  children?: React.ReactNode | React.ReactNode;
}
function PlaylistItem({ info, children, onClick }: PlaylistItemProps) {
  return (
    <div title={info.description}>
      <div className={styles["thumbnail"]}>
        <Cover id={info.id} thumbnail={info.thumbnails[0]} />
        <div
          className={styles["thumbnail__overlay"]}
          onClick={() => onClick(info.id)}
        ></div>
        {children}
      </div>
      <div
        className={styles["playlist-info"]}
        onClick={() => onClick(info.id)}
        title={info.name}
      >
        {info.name}
      </div>
      {info.itemCount >= 0 && (
        <div className={styles["playlist-info--secondary"]}>
          노래 {info.itemCount} 곡
        </div>
      )}
    </div>
  );
}

export default PlaylistItem;
