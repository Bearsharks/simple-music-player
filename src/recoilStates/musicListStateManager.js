import { useEffect } from 'react';
import { atom, useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./atoms/musicListAtoms";
import keyGenerator from '../refs/keyGenerator';
import { NOT_VALID_MUSIC_INFO } from '../refs/constants';
function getMusicInfoByIdx(musicList, idx) {
    return {
        idx: idx,
        key: musicList[idx].key,
    };
}
export function usePlayMusic(playCallback, stopCallBack) {
    const musicList = useRecoilValue(musicListState);
    const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
    useEffect(() => {
        if (curMusicInfo.key !== NOT_VALID_MUSIC_INFO.key) {
            playCallback({
                idx: curMusicInfo.idx,
                ...musicList[curMusicInfo.idx],
            });
        } else {
            stopCallBack();
        }
    }, [curMusicInfo]);
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
    reorderMusicList() {
        this.setMusicList(list => {
            const result = Array.from(list);
            const [removed] = result.splice(this.from, 1);
            result.splice(this.to, 0, removed);
            return result;
        })
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
        this.setMusicList(list => {
            let curMusic_update = { ...list[idx], ...value, key: list[idx].key };
            return list.map((item, i) => {
                if (idx === i) {
                    return curMusic_update;
                }
                return item;
            });
        });
    }
}