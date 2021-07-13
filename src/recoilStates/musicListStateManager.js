import { useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { musicListState, curMusicIndexState, curMusicInfoState } from "./atoms/musicListStates";
import keyGenerator from '../refs/keyGenerator';
import { INVALID_MUSIC_INFO } from '../refs/constants';
import storeStateManager from './storeStateManager';
import { storeState } from './atoms/storeAtoms';

const ssm = new storeStateManager();

export function useInitMusicPlayer(playCallback, stopCallBack) {
    const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
    const prevKeyRef = useRef(INVALID_MUSIC_INFO.key);
    const store = useRecoilState(storeState);
    useEffect(() => {
        if (curMusicInfo.key === prevKeyRef.current) return;
        debugger;
        //새로운 음악 재생시마다 현재정보를 로컬스토리지에 저장
        ssm.set('curMusicIndex', curMusicInfo.idx);
        if (curMusicInfo.key === INVALID_MUSIC_INFO.key) {
            stopCallBack();
            return;
        }
        prevKeyRef.current = curMusicInfo.key;
        let info = curMusicInfo;
        if (!curMusicInfo.id) {
            const items = ssm.get(curMusicInfo.q);
            if (items) {
                info = { ...info, id: items[0].id.videoId };
            }
        }
        playCallback(info);
    }, [curMusicInfo]);

    useEffect(() => {
        ssm.init(store);
    }, [store])
    useEffect(() => {
        const cur = ssm.get('curMusicIndex');
        const list = ssm.get('musicList');
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
        if (this.curMusicIndex === from) {
            this.setCurMusicIndex(to);
        }

    }
    deleteMusic(idx) {
        const musicInfo = { ...this.musicList[idx], idx: idx };
        const isAlone = this.musicList.length === 1;
        debugger;
        ssm.delete(musicInfo.q);
        if (isAlone) {
            this.updateMusicList([]);
            this.setCurMusicIndex(INVALID_MUSIC_INFO.idx);
            return;
        }
        const isLast = musicInfo.idx === this.musicList.length - 1;
        const isPrevMusic = this.curMusicIndex < musicInfo.idx;
        const result = this.musicList.filter((item, index) => index !== musicInfo.idx);
        this.updateMusicList(result);
        if (isLast) {
            this.setCurMusicIndex(musicInfo.idx - 1);
        } else if (isPrevMusic) {
            this.setCurMusicIndex(musicInfo.idx - 1);
        }
    }
    appendMusicList(newMusicQueryList) {
        newMusicQueryList = newMusicQueryList.filter((element) => element !== "");
        if (newMusicQueryList.length < 1) return;
        const keys = keyGenerator(newMusicQueryList.length);
        const newMusicList = newMusicQueryList.map((el, index) => { return { q: el, id: null, key: keys[index] } });
        for (let info of newMusicList) {
            ssm.store(info.q);
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
        ssm.set('musicList', list);
    }
    modMusicList(idx, data, itemidx) {

        if (!itemidx) itemidx = 0;
        let curMusic_update = { ...this.musicList[idx], id: data.items[itemidx].id.videoId, key: this.musicList[idx].key };
        const result = this.musicList.map((item, i) => (idx === i) ? curMusic_update : item);
        this.updateMusicList(result);
        ssm.set(data.q, data.items);
    }
    selectMusic(idx) {
        this.setCurMusicIndex(idx);
    }
}