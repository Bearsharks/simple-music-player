
import { PlaylistInfo } from "refs/constants";
import styles from "./PlaylistItem.module.scss";
import Thumbnail from "components/Thumbnail";

interface PlaylistItemProps {
    info: PlaylistInfo;
    onClick: (id: string) => void;
    children?: React.ReactChild | React.ReactChild[];

}
function PlaylistItem({ info, children, onClick }: PlaylistItemProps) {
    return (
        <div title={info.description}>
            <div className={styles['thumbnail']} >
                <Thumbnail thumbnails={info.thumbnails} name={info.name}></Thumbnail>
                <div
                    className={styles['thumbnail__overlay']}
                    onClick={() => onClick(info.id)}>
                </div>
                {children}
            </div>
            <div className={styles['playlist-info']} onClick={() => onClick(info.id)} title={info.name}>
                {info.name}
            </div>
            <div className={styles['playlist-info--secondary']}>
                노래 {info.itemCount} 곡
            </div>
        </div>
    )
}

export default PlaylistItem;