import { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { curMusicInfoState } from "./atoms/musicListStates";
import keyGenerator from '../refs/keyGenerator';
import { INVALID_MUSIC_INFO, DEFAULT_PLAYLIST_NAME, CUR_PLAYLIST_INDICATER } from '../refs/constants';
import storeStateManager from '../refs/storeStateManager';
import youtubeSearch from '../refs/youtubeSearch';

function initPlaylists() {
    if (!window.storeManager) window.storeManager = new storeStateManager();
    let playlistorigin = window.storeManager.get('playlists');
    if (!playlistorigin) {
        playlistorigin = [DEFAULT_PLAYLIST_NAME];
        window.storeManager.set('playlists', playlistorigin);
    }

    for (let listName of playlistorigin) {
        let list = window.storeManager.get(listName, 'list');
        if (!list) {
            list = [];
            window.storeManager.set(listName, list, 'list');
        }
    }

    return playlistorigin;
}
function initQuerys(listname) {
    if (!window.storeManager) window.storeManager = new storeStateManager();
    const list = window.storeManager.get(listname, 'list');
    if (list.length === 0) return;
    for (let item of list) {
        window.storeManager.store(item.q, 'query');
    }
}
function initCurMusicInfo(setCurMusicInfo) {
    if (!window.storeManager) window.storeManager = new storeStateManager();
    let curListName = window.storeManager.get(CUR_PLAYLIST_INDICATER);
    if (!curListName) {
        curListName = DEFAULT_PLAYLIST_NAME;
        window.storeManager.set(CUR_PLAYLIST_INDICATER, curListName);
    }
    let cur = window.storeManager.get(curListName, 'idx');
    let list = window.storeManager.get(curListName, 'list');
    if (cur !== 0 && !cur) {
        cur = INVALID_MUSIC_INFO.idx;
        window.storeManager.set(curListName, cur, 'idx');
    }
    if (!list) {
        list = [];
        window.storeManager.set(curListName, list, 'list');
    }
    setCurMusicInfo([cur, list]);
}

export function useInitMusicPlayer(playCallback, stopCallBack) {
    const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
    const prevInfoRef = useRef(INVALID_MUSIC_INFO);
    useEffect(() => {

        const playlists = initPlaylists();
        for (let list of playlists) {
            initQuerys(list);
        }
        initCurMusicInfo(setCurMusicInfo);
    }, [setCurMusicInfo]);
    useEffect(() => {
        let isValid = curMusicInfo.key;
        if (!isValid) return;
        let isSameEle = curMusicInfo.key === prevInfoRef.current.key;
        let isIdInit = prevInfoRef.current.id === INVALID_MUSIC_INFO.id && curMusicInfo.id !== INVALID_MUSIC_INFO.id;
        let isSameId = prevInfoRef.current.id === curMusicInfo.id;
        if (isSameEle && (isIdInit || isSameId)) return;
        //새로운 음악 재생시마다 현재정보를 로컬스토리지에 저장
        let curListName = window.storeManager.get(CUR_PLAYLIST_INDICATER);
        window.storeManager.set(curListName, curMusicInfo.idx, 'idx');

        if (curMusicInfo.key === INVALID_MUSIC_INFO.key) {
            stopCallBack();
        } else {
            let info = curMusicInfo;
            if (!curMusicInfo.id) {
                const items = window.storeManager.get(curMusicInfo.q, 'query');
                if (items) {
                    info = { ...info, id: items[0].id.videoId };
                }
            }
            playCallback(info);
        }
        prevInfoRef.current = curMusicInfo;

    }, [curMusicInfo]);


}

export class musicListStateManager {
    constructor(ml, ci) {
        this.musicList = ml[0];
        this.setMusicList = ml[1];

        this.curMusicIndex = ci[0];
        this.setCurMusicIndex = ci[1];
        if (!window.storeManager) window.storeManager = new storeStateManager();
        let curName = window.storeManager.get(CUR_PLAYLIST_INDICATER);
        if (!curName) this.curPlayListName = DEFAULT_PLAYLIST_NAME;
        else this.curPlayListName = curName;
        this.goNextMusic = this.goNextMusic.bind(this);
        this.goPrevMusic = this.goPrevMusic.bind(this);
        this.reorderMusicList = this.reorderMusicList.bind(this);
        this.deleteMusic = this.deleteMusic.bind(this);
        this.appendMusicList = this.appendMusicList.bind(this);
        this.appendPlaylist = this.appendPlaylist.bind(this);
        this.appendMusic = this.appendMusic.bind(this);
        this.appendQueryList = this.appendQueryList.bind(this);
        this.modMusicList = this.modMusicList.bind(this);
        this.initMusicInfo = this.initMusicInfo.bind(this);
        this.updateMusicList = this.updateMusicList.bind(this);
        this.selectMusic = this.selectMusic.bind(this);
    }
    goNextMusic() {
        if (this.curMusicIndex + 1 < this.musicList.length) {
            this.setCurMusicIndex(this.curMusicIndex + 1);
        }
    }
    goPrevMusic() {
        if (this.curMusicIndex - 1 >= 0) {
            this.setCurMusicIndex(this.curMusicIndex - 1);
        }
    }
    reorderMusicList(from, to) {
        if (to === from) return;
        const result = Array.from(this.musicList);
        const [removed] = result.splice(from, 1);
        result.splice(to, 0, removed);
        this.updateMusicList(result);
        const isCurMusic = this.curMusicIndex === from;
        const isGoToNextFromPrev = this.curMusicIndex > from && this.curMusicIndex <= to;
        const isGoToPrevFromNext = this.curMusicIndex < from && this.curMusicIndex >= to;
        if (isCurMusic) {
            this.selectMusic(to);
        } else if (isGoToNextFromPrev) {
            this.goPrevMusic();
        } else if (isGoToPrevFromNext) {
            this.goNextMusic();
        }

    }
    deleteMusic(idx) {
        const musicInfo = { ...this.musicList[idx], idx: idx };
        const isAlone = this.musicList.length === 1;
        window.storeManager.delete(musicInfo.q, 'query');
        if (isAlone) {
            this.updateMusicList([]);
            this.setCurMusicIndex(INVALID_MUSIC_INFO.idx);
            return;
        }
        const isLast = musicInfo.idx === this.musicList.length - 1;
        const isPrevMusic = this.curMusicIndex > musicInfo.idx;
        const isCurMusic = this.curMusicIndex === musicInfo.idx;
        const result = this.musicList.filter((item, index) => index !== musicInfo.idx);
        this.updateMusicList(result);
        if ((isCurMusic && isLast) || isPrevMusic) {
            this.setCurMusicIndex(this.curMusicIndex - 1);
        }
    }
    appendMusicList(newMusicList) {
        newMusicList = newMusicList.filter((element) => element !== "");
        let group = [];
        let start = 0;
        let end = 0;
        for (let i = 0; i < newMusicList.length; i++) {
            if (newMusicList[i].substr(0, 4) === 'http') {
                if (start > 0) group.push({
                    type: 'query',
                    start: start,
                    end: end
                });
                let result = {};
                var qs = newMusicList[i].substring(newMusicList[i].indexOf('?') + 1).split('&');
                for (let j = 0; j < qs.length; j++) {
                    qs[j] = qs[j].split('=');
                    result[qs[j][0]] = qs[j][1];
                }
                if (result.list) {
                    group.push({
                        type: 'list',
                        id: result.list
                    });
                } else if (result.v) {
                    group.push({
                        type: 'music',
                        id: result.v
                    });
                }
                start = i + 1;
            } else {
                end = i;
            }
        }
        if (start <= end) group.push({
            type: 'query',
            start: start,
            end: end
        });
        console.log(group);

        for (let g of group) {
            if (g.type === "list") {
                this.appendPlaylist(g.id);
            } else if (g.type === "music") {
                this.appendMusic(g.id);
            } else if (g.type === 'query') {
                debugger;
                this.appendQueryList(newMusicList.slice(g.start, g.end + 1));
            }
        }
    }
    async appendMusic(videoId) {
        const searchResult = await youtubeSearch(videoId, 'music');
        console.log(searchResult);
    }
    async appendPlaylist(listId) {
        const searchResult = await youtubeSearch(listId, 'list');
        console.log(searchResult);
    }
    appendQueryList(newMusicQueryList) {
        newMusicQueryList = newMusicQueryList.filter((element) => element !== "");
        if (newMusicQueryList.length < 1) return;
        const keys = keyGenerator(newMusicQueryList.length);
        const newMusicList = newMusicQueryList.map((el, index) => { return { q: el, id: null, key: keys[index] } });
        for (let info of newMusicList) {
            window.storeManager.store(info.q, 'query');
        }
        const newListStartIndex = this.musicList.length;
        const result = [...this.musicList, ...newMusicList];
        this.updateMusicList(result);

        if (this.curMusicIndex === INVALID_MUSIC_INFO.idx) {
            this.setCurMusicIndex(newListStartIndex);
        }
    }
    updateMusicList(list) {
        this.setMusicList(list);
        window.storeManager.set(this.curPlayListName, list, 'list');
    }
    modMusicList(idx, item) {
        const musicInfo = { ...this.musicList[idx], id: item.id.videoId };
        const result = this.musicList.map((item, i) => (idx === i) ? musicInfo : item);
        this.updateMusicList(result);
    }
    initMusicInfo(idx, query, items, itemIdx) {
        if (!itemIdx) itemIdx = 0;
        this.modMusicList(idx, items[itemIdx]);
        window.storeManager.set(query, items, 'query');
    }

    selectMusic(idx) {
        this.setCurMusicIndex(idx);
    }
}