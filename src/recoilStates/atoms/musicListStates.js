import { atom, selector, selectorFamily } from 'recoil';
import { INVALID_MUSIC_INFO, PAUSED, PlaylistInfo } from '../../refs/constants';

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

//수정이 성공한다. 그러면 셋을 한다.

export const PlaylistInfos = atom({
    key: 'PlaylistInfos',
    default: new Promise((resolve) => {
        fetch('http://localhost:5001/simple-music-player-319201/asia-northeast3/main/playlists', {
            credentials: 'include',
        }).then((res) => {
            return res.json();
        }).then((data) => {
            resolve(data);
        })
    })
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

export const MusicPlayerList = selector({
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