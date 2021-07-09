import { useEffect } from 'react';
import { atom, useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./atoms/musicListAtoms";
const musicListStateManager = {
    useGoNextMusic: () => {
        const musicList = useRecoilValue(musicListState);
        const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
        return (() => {
            if (musicList.length > curMusicInfo.idx + 1) {
                setCurMusicInfo({
                    idx: curMusicInfo.idx + 1,
                    id: musicList[curMusicInfo.idx + 1].id
                })
            }
        })
    },
    useGoPrevMusic: () => {
        const musicList = useRecoilValue(musicListState);
        const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
        return (() => {
            if (musicList.length > curMusicInfo.idx - 1) {
                setCurMusicInfo({
                    idx: curMusicInfo.idx - 1,
                    id: musicList[curMusicInfo.idx - 1].id
                })
            }
        })
    },
}

export default musicListStateManager;