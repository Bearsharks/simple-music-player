
import { PlaylistInfo } from "../refs/constants";
import styles from './Playlists.module.scss';

export interface PlaylistsProps {
    playlistInfos: PlaylistInfo[],
    playPlaylist: (id: string) => void,
    openOptionsSelector: (e: React.MouseEvent<HTMLElement>, playlistID:string) => void
}
export default function Playlists(props: PlaylistsProps) {
    return (
        <div>
            <div>재생목록 </div>
            <ul> {
                props.playlistInfos.map((el: PlaylistInfo) =>
                    <li className={styles['PlaylistInfo']} key={el.id}
                        title={el.description}
                    >
                        <div
                            onClick={() => props.playPlaylist(el.id)}
                        > 재생 | </div>
                        {el.name}
                        <button onClick={(e)=>{props.openOptionsSelector(e,el.id)}}>::</button>
                    </li>)
            } 
            </ul>
        </div>
    );
}
