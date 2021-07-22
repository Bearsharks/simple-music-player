import { atom, selector } from 'recoil';
import { INVALID_MUSIC_INFO, PAUSED } from '../../refs/constants';

export const musicPlayState = atom({
    key: 'musicPlayState',
    default: PAUSED
})

export const musicListState = atom({
    key: 'musicListState',
    default: []
})
export const curMusicIndexState = atom({
    key: 'curMusicIndexState',
    default: INVALID_MUSIC_INFO.idx
})
export const curMusicInfoState = selector({
    key: 'curMusicInfoState',
    get: ({ get }) => {
        const list = get(musicListState);
        const idx = get(curMusicIndexState);
        if (idx === INVALID_MUSIC_INFO.idx || list.length === 0) {
            return INVALID_MUSIC_INFO;
        }
        return {
            idx: idx,
            ...list[idx]
        }
    },
    set: ({ set }, params) => {
        const [cur, list] = params;
        if (cur === 0 || cur) set(curMusicIndexState, cur);
        if (list) set(musicListState, list);
    },
});