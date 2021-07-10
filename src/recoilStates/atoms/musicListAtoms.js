import { atom } from 'recoil';

export const musicListState = atom({
    key: 'musicListState',
    default: []
})
export const curMusicInfoState = atom({
    key: 'curMusicInfoState',
    default: { idx: -1, id: null, key: null }
})