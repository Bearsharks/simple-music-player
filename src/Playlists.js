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
            const newPlaylistData = [{ "q": "Intro", "id": "BB_VsXyF02I", "key": "1627115093539_0", "type": "music" }, { "q": "Rest", "id": "2oYi6SQh0xg", "key": "1627115093539_1", "type": "music" }, { "q": "Popo (How deep is our love?)", "id": "7E74fH0Xoew", "key": "1627115093539_2", "type": "music" }, { "q": "can i b u", "id": "oQl94R46egM", "key": "1627115093539_3", "type": "music" }, { "q": "Meant to be", "id": "cpTsEh_C7y8", "key": "1627115093539_4", "type": "music" }, { "q": "Mr.gloomy", "id": "STr6nl1UWYg", "key": "1627115093539_5", "type": "music" }, { "q": "lovelovelove", "id": "zlir7mX0aT8", "key": "1627115093539_6", "type": "music" }, { "q": "Bunny", "id": "Ex0nQ-G8gH0", "key": "1627115093539_7", "type": "music" }, { "q": "0310", "id": "lgjudfWgB24", "key": "1627115093539_8", "type": "music" }, { "q": "Berlin", "id": "IhBDPalO4Fw", "key": "1627115093539_9", "type": "music" }, { "q": "Datoom", "id": "cchTWN7lBTI", "key": "1627115093539_10", "type": "music" }, { "q": "Not a girl", "id": "f3EACyOVN5c", "key": "1627115093539_11", "type": "music" }, { "q": "Newsong2", "id": "93g5MbQ1sYo", "key": "1627115093539_12", "type": "music" }, { "q": "Amy", "id": "4qn2p8GTebo", "key": "1627115093539_13", "type": "music" }, { "q": "True lover", "id": "jgOsBz6L8oI", "key": "1627115093539_14", "type": "music" }, { "q": "Point", "id": "Bl0W6ofoO-I", "key": "1627115093539_15", "type": "music" }, { "q": "Square (2017)", "id": "_ZkUb7iIOqQ", "key": "1627115093539_16", "type": "music" }, { "q": "London", "id": "nOl0E7L2Qz8", "key": "1627115093539_17", "type": "music" }];
            window.storeManager.set(DEFAULT_PLAYLIST_NAME, newPlaylistData, 'list');
            window.storeManager.set(DEFAULT_PLAYLIST_NAME, (newPlaylistData.length ? 0 : INVALID_MUSIC_INFO.id), 'idx');
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
    const createPlaylist = (e, playlist) => {
        e.stopPropagation();
        let data = window.storeManager.get(playlist, 'list').map((el) => {
            return {
                id: el.key,
                name: el.q,
                videoID: el.id,
                query: el.q
            }
        });
        const body = { playlist: data };
        const url = `${process.env.REACT_APP_API_URL}/main/playlist/${playlist}`;
        fetch(url, {
            method: 'post',
            credentials: 'include',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',

            },
        }).then((res) => {
            if (res.status !== 200) throw new Error("잘못된요청!");
            return console.log('good!');
        }).catch((err) => {
            return console.log('bad!');
        });
    }
    const getPlaylist = (e) => {
        e.stopPropagation();
        const playlistID = textinput.current.value;
        const url = `${process.env.REACT_APP_API_URL}/main/playlist/${playlistID}`;
        fetch(url, {
            credentials: 'include'
        }).then((res) => {
            return res.json();
        }).then((data) => {
            console.log(data);
        }).catch((err) => {
            return console.log('bad!');
        });
    }
    const getPlaylists = (e) => {
        e.stopPropagation();
        const url = `${process.env.REACT_APP_API_URL}/main/playlist`;
        fetch(url, {
            credentials: 'include'
        }).then((res) => {
            return res.json();
        }).then((data) => {
            console.log(data);
        }).catch((err) => {
            return console.log('bad!');
        });
    }
    return (
        <ul>
            재생목록<br />
            <input ref={textinput} type="text"></input>
            <button onClick={craeteBtnClickHandler}>추가</button>
            <button onClick={pastePlaylist}>붙여넣기</button>
            <button onClick={getPlaylist}>가져오기</button>
            <button onClick={getPlaylists}>전부가져오기</button>
            {
                playlists.map((el, index) =>
                    <li
                        key={el}
                        onClick={() => { changePlaylist(el) }}
                    >
                        {el}
                        {el !== DEFAULT_PLAYLIST_NAME && <button onClick={(e) => { deletePlaylist(e, el) }}>X</button>}
                        <button onClick={(e) => { copyPlaylist(e, el) }}>copy</button>
                        <button onClick={(e) => { createPlaylist(e, el) }}>create</button>
                    </li>
                )
            }
        </ul>
    );
}