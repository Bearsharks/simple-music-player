import { useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./atoms/musicListAtoms";
import keyGenerator from '../refs/keyGenerator';
import { NOT_VALID_MUSIC_INFO } from '../refs/constants';
export function getMusicInfoByIdx(musicList, idx) {
    return {
        idx: idx,
        key: musicList[idx].key,
    };
}
export function usePlayMusic(playCallback, stopCallBack) {
    const musicList = useRecoilValue(musicListState);
    const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
    const prevKeyRef = useRef(NOT_VALID_MUSIC_INFO.key);
    useEffect(() => {
        if (curMusicInfo.key === prevKeyRef.current) return;
        if (curMusicInfo.key === NOT_VALID_MUSIC_INFO.key) {
            stopCallBack();
            return;
        }
        playCallback({
            idx: curMusicInfo.idx,
            ...musicList[curMusicInfo.idx],
        });
        prevKeyRef.current = curMusicInfo.key;
    }, [curMusicInfo, musicList]);
    return (idx) => {
        if (idx < 0 || idx >= musicList.length) throw new Error(`musicList out of bound : length - ${musicList.length}, idx - ${idx}`)
        const musicInfo = getMusicInfoByIdx(musicList, idx);
        if (curMusicInfo.key !== musicInfo.key)
            setCurMusicInfo(() => getMusicInfoByIdx(musicList, idx));
    }
}
export class musicListStateManager {
    constructor(ml, ci) {
        this.musicList = ml[0];
        this.setMusicList = ml[1];
        this.curMusicInfo = ci[0];
        this.setCurMusicInfo = ci[1];
        this.goNextMusic = this.goNextMusic.bind(this);
        this.goPrevMusic = this.goPrevMusic.bind(this);
        this.reorderMusicList = this.reorderMusicList.bind(this);
        this.deleteMusic = this.deleteMusic.bind(this);
        this.appendMusicList = this.appendMusicList.bind(this);
        this.modMusicList = this.modMusicList.bind(this);
    }
    goNextMusic() {
        this.setCurMusicInfo(cur => {
            if (this.musicList.length > cur.idx + 1) {
                return {
                    idx: cur.idx + 1,
                    id: this.musicList[cur.idx + 1].id,
                    key: this.musicList[cur.idx + 1].key,
                }
            }
            return cur;
        })
    }
    goPrevMusic() {
        this.setCurMusicInfo(cur => {
            if (0 <= cur.idx - 1) {
                return {
                    idx: cur.idx - 1,
                    id: this.musicList[cur.idx - 1].id,
                    key: this.musicList[cur.idx - 1].key,
                }
            }
            return cur;
        })
    }
    reorderMusicList(from, to) {
        if (to === from) return;
        const result = Array.from(this.musicList);
        const [removed] = result.splice(from, 1);
        result.splice(to, 0, removed);
        this.setMusicList(result)
        if (this.curMusicInfo.idx === from) {
            this.setCurMusicInfo({ ...this.curMusicInfo, idx: to })
        }

    }
    deleteMusic(idx) {
        const musicInfo = { ...this.musicList[idx], idx: idx };
        const isAlone = this.musicList.length === 1;
        if (isAlone) {
            this.setMusicList([]);
            this.setCurMusicInfo(NOT_VALID_MUSIC_INFO);
            return;
        }
        const isLast = musicInfo.idx === this.musicList.length - 1;
        const isCurMusic = this.curMusicInfo.key === musicInfo.key;
        const isPrevMusic = this.curMusicInfo.idx < musicInfo.idx;
        this.setMusicList(list => this.musicList.filter((item, index) => index !== musicInfo.idx));
        if (isLast) {
            const prev = this.musicList[musicInfo.idx - 1];
            const musicInfo_update = {
                idx: musicInfo.idx - 1,
                id: prev.id,
                key: prev.key,
            }
            this.setCurMusicInfo(() => musicInfo_update);
        } else if (isPrevMusic) {
            const musicInfo_update = {
                idx: musicInfo.idx - 1,
                id: musicInfo.id,
                key: musicInfo.key,
            }
            this.setCurMusicInfo(() => musicInfo_update);
        } else if (isCurMusic) {
            const next = this.musicList[musicInfo.idx + 1];
            const musicInfo_update = {
                idx: musicInfo.idx,
                id: next.id,
                key: next.key,
            }
            this.setCurMusicInfo(() => musicInfo_update);
        }
    }
    appendMusicList(newMusicQueryList) {
        newMusicQueryList = newMusicQueryList.filter((element) => element !== "");
        if (newMusicQueryList.length < 1) return;
        const keys = keyGenerator(newMusicQueryList.length);
        let newMusicList = newMusicQueryList.map((el, index) => { return { q: el, id: null, key: keys[index] } });
        this.setMusicList(list => [...list, ...newMusicList]);
        if (this.curMusicInfo.key === NOT_VALID_MUSIC_INFO.key) {
            this.setCurMusicInfo(() => getMusicInfoByIdx(newMusicList, 0));
        }
    }

    modMusicList(idx, value) {
        let curMusic_update = { ...this.musicList[idx], ...value, key: this.musicList[idx].key };
        this.setMusicList(this.musicList.map((item, i) => (idx === i) ? curMusic_update : item));
    }
}