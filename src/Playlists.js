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
    const deletePlaylist = (playlist) => {
        //저장소에서 삭제
        const list = window.storeManager.get(playlist, 'list');
        window.storeManager.delete(playlist, 'list');
        window.storeManager.delete(playlist, 'idx');

        //저장소에서 쿼리항목 삭제        
        for (let i = 0; i < list.length; i++) {
            if (list[i].type === 'query') window.storeManager.delete(list[i].q, 'query');
        }

        //해당 재생목록을 삭제한 새로운 목록 업데이트
        let newPlayLists = playlists.slice();
        for (let i = 0; i < playlists.length; i++) {
            if (playlists[i] === playlist) {
                newPlayLists.splice(i, 1);
                break;
            }
        }
        setPlaylists(newPlayLists);
        window.storeManager.set('playlists', newPlayLists);

        //기본목록으로 돌아감
        changePlaylist(DEFAULT_PLAYLIST_NAME);
    }
    return (
        <ul>
            재생목록<br />
            <input ref={textinput} type="text"></input>
            <button onClick={makeNewPlaylist}>새로운 재생목록 추가</button>
            {
                playlists.map((el, index) =>
                    <li
                        key={el}
                        onClick={() => { changePlaylist(el) }}
                    >
                        {el}{el !== DEFAULT_PLAYLIST_NAME && <button onClick={() => { deletePlaylist(el) }}>X</button>}
                    </li>
                )
            }
        </ul>
    );
}