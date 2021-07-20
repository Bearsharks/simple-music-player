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

    const makeNewPlaylist = (newPlaylistName, newPlaylistData) => {
        const isValid = newPlaylistName && newPlaylistData && ('length' in newPlaylistData);
        if (!isValid) {
            return;
        }
        for (let name of playlists) {
            if (name === newPlaylistName) {
                newPlaylistName = newPlaylistName + "_" + Date.now();
                break;
            }
        }
        const newPlayLists = [...playlists, newPlaylistName];
        window.storeManager.set(newPlaylistName, newPlaylistData, 'list');
        window.storeManager.set(newPlaylistName, (newPlaylistData.length ? 0 : INVALID_MUSIC_INFO.id), 'idx');
        window.storeManager.set('playlists', newPlayLists);
        setPlaylists(newPlayLists);
        textinput.current.value = "";

    }
    const craeteBtnClickHandler = () => {
        const newPlaylistName = textinput.current.value;
        if (newPlaylistName) {
            debugger;
            makeNewPlaylist(newPlaylistName, []);
        }
    }
    const pastePlaylist = async () => {
        const newPlaylistValue = await navigator.clipboard.readText();
        if (newPlaylistValue[0] === '{' && newPlaylistValue[newPlaylistValue.length - 1] === '}') {
            const playlistInfo = JSON.parse(newPlaylistValue);
            makeNewPlaylist(playlistInfo.name, playlistInfo.data);
        }
    }
    const deletePlaylist = (e, playlist) => {
        e.stopPropagation();
        if (!window.confirm(`삭제 - ${playlist} 정말로 삭제하시겠습니까?`)) return;
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
        if (playlist === window.storeManager.get(CUR_PLAYLIST_INDICATER)) {
            changePlaylist(DEFAULT_PLAYLIST_NAME);
        }

    }
    const copyPlaylist = (e, playlist) => {
        e.stopPropagation();
        let copiedData = {
            name: playlist,
            data: window.storeManager.get(playlist, 'list')
        };
        // 쓰기 
        navigator.clipboard.writeText(JSON.stringify(copiedData)).then(() => {
            alert("복사되었습니다. 붙여넣기 버튼을 클릭하여 재생목록을 추가하세요.")
        });
    }
    return (
        <ul>
            재생목록<br />
            <input ref={textinput} type="text"></input>
            <button onClick={craeteBtnClickHandler}>새로운 재생목록 추가</button>
            <button onClick={pastePlaylist}>붙여넣기</button>
            {
                playlists.map((el, index) =>
                    <li
                        key={el}
                        onClick={() => { changePlaylist(el) }}
                    >
                        {el}
                        {el !== DEFAULT_PLAYLIST_NAME && <button onClick={(e) => { deletePlaylist(e, el) }}>X</button>}
                        <button onClick={(e) => { copyPlaylist(e, el) }}>copy</button>
                    </li>
                )
            }
        </ul>
    );
}