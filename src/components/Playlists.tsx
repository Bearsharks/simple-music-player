
import { PlaylistInfo } from "../refs/constants";
import styles from './Playlists.module.scss';

export interface PlaylistsProps {
    playlistInfos: PlaylistInfo[],
    playPlaylist: (id: string) => {},
    appendPlaylist: (id: string) => {},
    setPlaylist: (id: string, info: PlaylistInfo) => {},
}
export default function Playlists(props: PlaylistsProps) {
    return (
        <div>
            <div>재생목록 </div>
            <ul> {
                props.playlistInfos.map((el: PlaylistInfo) =>
                    <li key={el.id}
                        title={el.description}
                        onClick={() => props.playPlaylist(el.id)}
                    >
                        {el.name}</li>)
                //재생
                //셔플
                //재생목록에 추가
                //다음으로 재생
            } </ul>
        </div>
    );
}
