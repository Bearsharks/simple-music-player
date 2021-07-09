import styles from "MusicList.module.scss"
import MusicListEle from "./MusicListEle";
function MusicList(props) {
    return (
        <ul className={styles["musicList"]}>
            <MusicListEle></MusicListEle>
            <MusicListEle></MusicListEle>
            <MusicListEle></MusicListEle>
        </ul>
    )
}
export default MusicList;