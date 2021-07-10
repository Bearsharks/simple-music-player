import { useEffect } from 'react';
import { atom, useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./atoms/musicListAtoms";
const musicListStateManager = {
    NOT_VALID_MUSIC_INFO: { idx: -1, id: null, key: null },
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
            debugger;
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

        return (musicInfo) => {
            const isAlone = musicList.length === 1;
            if (isAlone) {
                setMusicList([]);
                setCurMusicInfo(this.NOT_VALID_MUSIC_INFO);
            }
            const isLast = musicInfo.idx === musicList.length - 1;
            const isCurMusic = curMusicInfo === musicInfo;
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
}
export default musicListStateManager;