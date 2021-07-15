import { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { curMusicInfoState } from "./atoms/musicListStates";
import keyGenerator from '../refs/keyGenerator';
import { INVALID_MUSIC_INFO } from '../refs/constants';
import storeStateManager from '../refs/storeStateManager';


export function useInitMusicPlayer(playCallback, stopCallBack) {
    const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
    const prevInfoRef = useRef(INVALID_MUSIC_INFO.key);
    useEffect(() => {
        if (!curMusicInfo.key || curMusicInfo.key + curMusicInfo.id === prevInfoRef.current) return;
        //새로운 음악 재생시마다 현재정보를 로컬스토리지에 저장
        window.storeManager.set('curMusicIndex', curMusicInfo.idx);
        if (curMusicInfo.key === INVALID_MUSIC_INFO.key) {
            stopCallBack();
            return;
        }
        prevInfoRef.current = curMusicInfo.key + curMusicInfo.id;
        let info = curMusicInfo;
        if (!curMusicInfo.id) {
            const items = window.storeManager.get(curMusicInfo.q);
            if (items) {
                info = { ...info, id: items[0].id.videoId };
            }
        }
        playCallback(info);
    }, [curMusicInfo]);

    useEffect(() => {
        if (!window.storeManager) window.storeManager = new storeStateManager();
        const cur = window.storeManager.get('curMusicIndex');
        const list = window.storeManager.get('musicList');
        setCurMusicInfo([cur, list]);
    }, []);
}

export class musicListStateManager {
    constructor(ml, ci) {
        this.musicList = ml[0];
        this.setMusicList = ml[1];

        this.curMusicIndex = ci[0];
        this.setCurMusicIndex = ci[1];
        this.goNextMusic = this.goNextMusic.bind(this);
        this.goPrevMusic = this.goPrevMusic.bind(this);
        this.reorderMusicList = this.reorderMusicList.bind(this);
        this.deleteMusic = this.deleteMusic.bind(this);
        this.appendMusicList = this.appendMusicList.bind(this);
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
        window.storeManager.delete(musicInfo.q);
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
    appendMusicList(newMusicQueryList) {
        newMusicQueryList = newMusicQueryList.filter((element) => element !== "");
        if (newMusicQueryList.length < 1) return;
        const keys = keyGenerator(newMusicQueryList.length);
        const newMusicList = newMusicQueryList.map((el, index) => { return { q: el, id: null, key: keys[index] } });
        for (let info of newMusicList) {
            window.storeManager.store(info.q);
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
        window.storeManager.set('musicList', list);
    }
    modMusicList(idx, item) {
        const musicInfo = { ...this.musicList[idx], id: item.id.videoId };
        const result = this.musicList.map((item, i) => (idx === i) ? musicInfo : item);
        this.updateMusicList(result);
    }
    initMusicInfo(idx, query, items, itemIdx) {
        if (!itemIdx) itemIdx = 0;
        this.modMusicList(idx, items[itemIdx]);
        window.storeManager.set(query, items);
    }

    selectMusic(idx) {
        this.setCurMusicIndex(idx);
    }
}