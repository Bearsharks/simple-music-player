import { useEffect, useState, useRef } from "react";
import { useRecoilState } from "recoil";
import { curMusicInfoState } from "./recoilStates/atoms/musicListStates";
import { INVALID_MUSIC_INFO, DEFAULT_PLAYLIST_NAME, CUR_PLAYLIST_INDICATER } from "./refs/constants";
import storeManager from "./refs/storeStateManager";

export default function Playlists() {
    const [playlists, setPlaylists] = useState([DEFAULT_PLAYLIST_NAME]);
    const [musicInfo, setMusicInfo] = useRecoilState(curMusicInfoState);
    const textinput = useRef();
    useEffect(() => {
        if (!window.storeManager) window.storeManager = new storeManager();
        let playlistorigin = window.storeManager.get('playlists');
        if (playlistorigin) {
            setPlaylists(playlistorigin);
        } else {
            window.storeManager.set('playlists', playlists);
        }
    }, []);

    const changePlaylist = (playlist) => {
        const list = window.storeManager.get(playlist, 'list');
        const cur = window.storeManager.get(playlist, 'idx');
        setMusicInfo([cur, list]);
        window.storeManager.set(CUR_PLAYLIST_INDICATER, playlist);
    }
    const makeNewPlaylist = () => {
        const newPlaylistName = textinput.current.value;
        if (newPlaylistName) {
            for (let name of playlists) {
                if (name === newPlaylistName) return alert('이미 존재하는 플레이리스트');
            }

            const newPlayLists = [...playlists, newPlaylistName];
            window.storeManager.set(newPlaylistName, [], 'list');
            window.storeManager.set(newPlaylistName, INVALID_MUSIC_INFO.id, 'idx');
            window.storeManager.set('playlists', newPlayLists);
            setPlaylists(newPlayLists);
            textinput.current.value = "";
        }
    }
    return (
        <ul>
            <button onClick={makeNewPlaylist}>새로운 플레이리스트 만들기</button>
            <input ref={textinput} type="text"></input>
            {
                playlists.map((el, index) =>
                    <li
                        key={el}
                        onClick={() => { changePlaylist(el) }}
                    >
                        {el}
                    </li>
                )
            }
        </ul>
    );
}