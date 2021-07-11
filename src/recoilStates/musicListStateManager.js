import { useEffect } from 'react';
import { atom, useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./atoms/musicListAtoms";
import keyGenerator from '../refs/keyGenerator';
import { NOT_VALID_MUSIC_INFO } from '../refs/constants';
const musicListStateManager = {

    useGoNextMusic: () => {
        const musicList = useRecoilValue(musicListState);
        const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
        return (() => {
            setCurMusicInfo(cur => {
                if (musicList.length > cur.idx + 1) {
                    return {
                        idx: cur.idx + 1,
                        id: musicList[cur.idx + 1].id,
                        key: musicList[cur.idx + 1].key,
                    }
                }
                return cur;
            })
        })
    },
    useGoPrevMusic: () => {
        const musicList = useRecoilValue(musicListState);
        const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
        return (() => {
            setCurMusicInfo(cur => {
                if (0 <= cur.idx - 1) {
                    return {
                        idx: cur.idx - 1,
                        id: musicList[cur.idx - 1].id,
                        key: musicList[cur.idx - 1].key,
                    }
                }
                return cur;
            })
        })
    },
    useReorderMusicList: () => {
        const setMusicList = useSetRecoilState(musicListState);
        return (from, to) => {
            setMusicList(list => {
                const result = Array.from(list);
                const [removed] = result.splice(from, 1);
                result.splice(to, 0, removed);
                return result;
            })
        }
    },
    useDeleteMusic: () => {
        const [musicList, setMusicList] = useRecoilState(musicListState);
        const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);

        return (idx) => {
            debugger;
            const musicInfo = { ...musicList[idx], idx: idx };
            const isAlone = musicList.length === 1;
            if (isAlone) {
                setMusicList([]);
                setCurMusicInfo(NOT_VALID_MUSIC_INFO);
                return;
            }
            const isLast = musicInfo.idx === musicList.length - 1;
            const isCurMusic = curMusicInfo.key === musicInfo.key;
            const isPrevMusic = curMusicInfo.idx < musicInfo.idx;
            setMusicList(list => musicList.filter((item, index) => index !== musicInfo.idx));
            if (isLast) {
                const prev = musicList[musicInfo.idx - 1];
                const musicInfo_update = {
                    idx: musicInfo.idx - 1,
                    id: prev.id,
                    key: prev.key,
                }
                setCurMusicInfo(() => musicInfo_update);
            } else if (isPrevMusic) {
                const musicInfo_update = {
                    idx: musicInfo.idx - 1,
                    id: musicInfo.id,
                    key: musicInfo.key,
                }
                setCurMusicInfo(() => musicInfo_update);
            } else if (isCurMusic) {
                const next = musicList[musicInfo.idx + 1];
                const musicInfo_update = {
                    idx: musicInfo.idx,
                    id: next.id,
                    key: next.key,
                }
                setCurMusicInfo(() => musicInfo_update);
            }
        }
    },
    useAppendMusicList: () => {
        const setMusicList = useSetRecoilState(musicListState);
        const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
        return (newMusicQueryList) => {
            newMusicQueryList = newMusicQueryList.filter((element) => element !== "");
            if (newMusicQueryList.length < 1) return;
            const keys = keyGenerator(newMusicQueryList.length);
            let newMusicList = newMusicQueryList.map((el, index) => { return { q: el, id: null, key: keys[index] } });
            setMusicList(list => [...list, ...newMusicList]);
            if (curMusicInfo.key === NOT_VALID_MUSIC_INFO.key) {
                setCurMusicInfo(() => musicListStateManager.getMusicInfoByIdx(newMusicList, 0));
            }
        }
    },
    getMusicInfoByIdx: (musicList, idx) => {
        return {
            idx: idx,
            key: musicList[idx].key,
        };
    },
    usePlayMusic: (playCallback) => {
        const musicList = useRecoilValue(musicListState);
        const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
        useEffect(() => {
            if (curMusicInfo.key !== NOT_VALID_MUSIC_INFO.key) {

                playCallback({
                    idx: curMusicInfo.idx,
                    ...musicList[curMusicInfo.idx],
                });
            } else {
                if (window.player) window.player.stopVideo();
            }

        }, [curMusicInfo]);
        return (idx) => {
            if (idx < 0 || idx >= musicList.length) throw new Error(`musicList out of bound : length - ${musicList.length}, idx - ${idx}`)
            const musicInfo = musicListStateManager.getMusicInfoByIdx(musicList, idx);
            if (curMusicInfo.key !== musicInfo.key)
                setCurMusicInfo(() => musicListStateManager.getMusicInfoByIdx(musicList, idx));
        }
    },
    useModMusicList: () => {
        const setMusicList = useSetRecoilState(musicListState);
        return (idx, value) => {
            setMusicList(list => {
                let curMusic_update = { ...list[idx], ...value, key: list[idx].key };
                return list.map((item, i) => {
                    if (idx === i) {
                        return curMusic_update;
                    }
                    return item;
                });
            });
        }
    },
}
export default musicListStateManager;