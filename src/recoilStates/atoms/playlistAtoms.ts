import { atom, atomFamily, selector, useRecoilCallback } from 'recoil';
import { getPlaylistInfo, getPlaylistItems, getPlaylistInfos, updatePlaylist, deletePlaylist, createPlaylist } from '../../refs/api';
import { INVALID_MUSIC_INFO, PlaylistAction, PlaylistActionType, MusicInfoAction, MusicInfoActionType, MusicListActionType, MusicListAction, PAUSED, PlaylistInfo, playerState, MusicInfo_tmp as MusicInfo } from '../../refs/constants';

export const musicPlayerState = atom({
    key: 'musicPlayerState',
    default: playerState.PAUSED
});

export const curMusicIdxState = atom({
    key: 'curMusicIdx',
    default: 0
});

//처음에 이 아톰을 사용하여 재생목록을 생성한다.
//재생목록 컴포넌트는 prop으로 id를 받아서 각자의 재생목록 정보를 비동기적으로 
//서버에서 받아 상태를 초기화하고 화면을 만든다.
export const playlistIDsState = atom<string[]>({
    key: 'playlistIds',
    default: new Promise((resolve) => {
        getPlaylistInfos().then((result) => {
            const ids = result.map((playlistInfo) => playlistInfo.id);
            resolve(ids);
        })
    })
})


//리코일 콜백으로 정보와 아이템을 아우르는 수정하는 것을 만든다.
export const usePlaylistManager = function () {
    //create, delete, update
    return useRecoilCallback(({ set, reset, snapshot }) => async (action: PlaylistAction) => {
        const { CREATE, DELETE, UPDATE } = PlaylistActionType;
        switch (action.type) {
            case CREATE: {
                const playlistIDs: string[] = snapshot.getLoadable(playlistIDsState).contents;
                const result = await createPlaylist(action.payload.info, action.payload.items);
                if (result) {
                    set(playlistIDsState, playlistIDs.concat(result));
                }
            } break;
            case DELETE: {
                const tgt = action.payload;
                const playlistIDs: string[] = snapshot.getLoadable(playlistIDsState).contents;
                const isSuccess = await deletePlaylist(tgt);
                if (isSuccess) {
                    const newOne: string[] = playlistIDs.filter((item) => item !== tgt);
                    set(playlistIDsState, newOne);
                    reset(playlistItemsState(tgt));
                    reset(playlistInfosState(tgt));
                }
            } break;
            case UPDATE: {
                if (!action.payload.info || !action.payload.info.id) return;
                const tgt: string = action.payload.info.id;
                const result = await updatePlaylist(action.payload.info, action.payload.items);
                if (result) {
                    set(playlistInfosState(tgt), action.payload.info);
                    set(playlistItemsState(tgt), action.payload.items);
                }
            } break;
        }
    });
}


export const playlistInfosState = atomFamily<PlaylistInfo, string>({
    key: 'playlistInfos',
    default: async (id): Promise<PlaylistInfo> => {
        try {
            return await getPlaylistInfo(id);
        } catch (err) {
            console.error(err);
        }
        return {} as PlaylistInfo;
    },
});

export const playlistItemsState = atomFamily<MusicInfo[], string>({
    key: "playlistItems",
    default: async (id): Promise<MusicInfo[]> => {
        try {
            return await getPlaylistItems(id);
        } catch (err) {
            console.error(err);
        }
        return {} as MusicInfo[];
    },
});

//훅으로 셔플일때 정상일때 처리를 하게
export const musicListState = atom<MusicInfo[]>({
    key: "musicList_",
    default: []
})

//리코일 콜백으로 정보와 아이템을 아우르는 수정하는 것을 만든다.
export const useMusicListManager = function () {
    //create, delete, update
    return useRecoilCallback(({ set, reset, snapshot }) => async (action: MusicListAction) => {
        const { GET, APPEND_PLAYLIST, APPEND_ITEMS, DELETE, CHANGE_ORDER, ADD_TO_NEXT } = MusicListActionType;
        switch (action.type) {
            case GET: {
                const playlistItems = await snapshot.getPromise(playlistItemsState(action.payload));
                set(musicListState, playlistItems);
                break;
            }
            case APPEND_PLAYLIST: {
                const musicList = await snapshot.getPromise(musicListState);
                const playlistItems = await snapshot.getPromise(playlistItemsState(action.payload));
                set(musicListState, musicList.concat(playlistItems));
                break;
            }
            case APPEND_ITEMS: {
                const musicList = await snapshot.getPromise(musicListState);
                set(musicListState, musicList.concat(action.payload));
            } break;
            case ADD_TO_NEXT:
                const musicList = await snapshot.getPromise(musicListState);
                const curIdx = await snapshot.getPromise(curMusicIdxState);
                set(musicListState, musicList.length > 0 ? [
                    ...musicList.slice(0, curIdx + 1),
                    ...action.payload,
                    ...musicList.slice(curIdx + 1)
                ] : action.payload);
                break;
            case DELETE: {
                const curIdx = await snapshot.getPromise(curMusicIdxState);
                const tgt = action.payload;
                const list = await snapshot.getPromise(musicListState);
                const items = list.filter((item, index) => index !== tgt);

                const isLast = tgt === list.length - 1;
                const isPrevMusic = curIdx > tgt;
                const isCurMusic = curIdx === tgt;
                if ((isCurMusic && isLast) || isPrevMusic) set(curMusicIdxState, curIdx - 1);
                set(musicListState, items);
                break;
            }
            case CHANGE_ORDER: {
                const list = await snapshot.getPromise(musicListState);
                const curIdx = await snapshot.getPromise(curMusicIdxState);
                const { to, from } = action.payload;
                const result = Array.from(list);
                const [removed] = result.splice(from, 1);
                result.splice(to, 0, removed);
                set(musicListState, result);

                const isCurMusic = curIdx === from;
                const isGoToNextFromPrev = curIdx > from && curIdx <= to;
                const isGoToPrevFromNext = curIdx < from && curIdx >= to;
                if (isCurMusic)
                    set(curMusicIdxState, to);
                else if (isGoToNextFromPrev && curIdx - 1 >= 0)
                    set(curMusicIdxState, curIdx - 1);
                else if (isGoToPrevFromNext && curIdx + 1 < list.length)
                    set(curMusicIdxState, curIdx + 1);
                break;
            }
            default:
                break;
        }
    });
}

function MusicInfoActionCheck(params: unknown): params is MusicInfoAction {
    return !!((params as MusicInfoAction).type);
}

export const useCurMusicManager = function () {
    return useRecoilCallback(({ set, snapshot }) => async (action: MusicInfoAction) => {
        const list: MusicInfo[] = snapshot.getLoadable(musicListState).contents;
        const idx: number = snapshot.getLoadable(curMusicIdxState).contents;
        const { NEXT, PREV, SET } = MusicInfoActionType;
        switch (action.type) {
            case NEXT:
                if (idx + 1 < list.length) set(curMusicIdxState, idx + 1);
                break;
            case PREV:
                if (idx - 1 >= 0) set(curMusicIdxState, idx - 1);
                break;
            case SET:
                const { name, videoID, query } = action.payload;
                const musicInfo = {} as MusicInfo;
                musicInfo.name = name ? name : list[idx].name;
                musicInfo.videoID = videoID ? videoID : list[idx].videoID;
                musicInfo.query = query ? query : list[idx].query;
                set(musicListState, [
                    ...list.slice(0, idx), // everything before current post
                    musicInfo,
                    ...list.slice(idx + 1)]
                );
                break;
            default:
                throw "유효하지 않은 액션타입";
        }
    });
}

export const curMusicInfoState = selector<MusicInfo>({
    key: 'curMusicInfoState',
    get: ({ get }) => {
        const list = get(musicListState);
        const idx = get(curMusicIdxState);
        if (idx === INVALID_MUSIC_INFO.idx || list.length <= 0) {
            return {} as MusicInfo;
        }
        return list[idx];
    }
});
