import { atom } from 'recoil';
import { NOT_VALID_MUSIC_INFO } from '../../refs/constants';
export const musicListState = atom({
    key: 'musicListState',
    default: []
})
export const curMusicInfoState = atom({
    key: 'curMusicInfoState',
    default: NOT_VALID_MUSIC_INFO
})