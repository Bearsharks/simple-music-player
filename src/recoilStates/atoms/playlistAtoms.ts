import { atom, atomFamily, selector, useRecoilCallback } from 'recoil';
import { getPlaylistInfo, getPlaylistItems, getPlaylistInfos, updatePlaylist, deletePlaylist, createPlaylist } from '../../refs/api';
import { INVALID_MUSIC_INFO, PlaylistAction, PlaylistActionType, MusicInfoAction, MusicInfoActionType, MusicListActionType, MusicListAction, PAUSED, PlaylistInfo, playerState, MusicInfo } from '../../refs/constants';

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
        const { CREATE, DELETE, UPDATE, APPEND} = PlaylistActionType;
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
                    reset(playlistItemStateFamily(tgt));
                    reset(playlistInfoStateFamily(tgt));
                }
            } break;
            case UPDATE: {
                if (!action.payload.info || !action.payload.info.id) return;
                const tgt: string = action.payload.info.id;
                const result = await updatePlaylist(action.payload);
                if (result) {
                    set(playlistInfoStateFamily(tgt), action.payload.info);
                    set(playlistItemStateFamily(tgt), action.payload.items);
                }
            } break;
            case APPEND: {
                if (!action.payload.info || !action.payload.info.id || !action.payload.items) return;
                const tgt: string = action.payload.info.id;
                const playlistItems: MusicInfo[] = await snapshot.getPromise(playlistItemStateFamily(tgt));
                const newList = playlistItems.concat(action.payload.items);
                const result = await updatePlaylist({info:action.payload.info, items:newList});
                if (result) {
                    set(playlistItemStateFamily(tgt), newList);
                }
            } break;
        }
    });
}


export const playlistInfoStateFamily= atomFamily<PlaylistInfo, string>({
    key: 'playlistInfoFamily',
    default: async (id): Promise<PlaylistInfo> => {
        try {
            return await getPlaylistInfo(id);
        } catch (err) {
            console.error(err);
        }
        return {} as PlaylistInfo;
    },
});
export const playlistInfosState = selector<PlaylistInfo[]>({
    key:'playlistInfos',
    get: async ({get}):Promise<PlaylistInfo[]>=> {
        const playlistIDs: string[] = get(playlistIDsState);
        const playlistInfos = playlistIDs.map((id) =>get(playlistInfoStateFamily(id)));
        return playlistInfos;
    },
})

export const playlistItemStateFamily = atomFamily<MusicInfo[], string>({
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

export const useMusicListManager = function () {
    //create, delete, update
    return useRecoilCallback(({ set, reset, snapshot }) => async (action: MusicListAction) => {
        debugger;
        switch (action.type) {
            case MusicListActionType.SET: {
                const playlistItems = await snapshot.getPromise(playlistItemStateFamily(action.payload));
                set(musicListState, playlistItems);
                break;
            }
            case MusicListActionType.APPEND_PLAYLIST: {
                const musicList = await snapshot.getPromise(musicListState);
                const playlistItems = await snapshot.getPromise(playlistItemStateFamily(action.payload));
                set(musicListState, musicList.concat(playlistItems));
                break;
            }
            case MusicListActionType.ADD_TO_NEXT_PLAYLIST: {
                const musicList = await snapshot.getPromise(musicListState);
                const playlistItems = await snapshot.getPromise(playlistItemStateFamily(action.payload));
                const curIdx = await snapshot.getPromise(curMusicIdxState);
                set(musicListState, musicList.length > 0 ? [
                    ...musicList.slice(0, curIdx + 1),
                    ...playlistItems,
                    ...musicList.slice(curIdx + 1)
                ] : action.payload);
                break;
            }
            case MusicListActionType.APPEND_ITEMS: {
                const musicList = await snapshot.getPromise(musicListState);
                set(musicListState, musicList.concat(action.payload));
            } break;
            case MusicListActionType.ADD_TO_NEXT:
                const musicList = await snapshot.getPromise(musicListState);
                const curIdx = await snapshot.getPromise(curMusicIdxState);
                set(musicListState, musicList.length > 0 ? [
                    ...musicList.slice(0, curIdx + 1),
                    ...action.payload,
                    ...musicList.slice(curIdx + 1)
                ] : action.payload);
                break;
            case MusicListActionType.DELETE: {
                const curIdx = await snapshot.getPromise(curMusicIdxState);
                const tgtInfos:MusicInfo[] = action.payload;
                let list = (await snapshot.getPromise(musicListState)).slice();

                let curMusicDeleted = false;
                for(let i = 0 ; i < tgtInfos.length;i++){
                    const idx = tgtInfos[i].idx;
                    if(idx !== undefined){
                        list[idx] = {} as MusicInfo;
                        if(idx === curIdx) curMusicDeleted = false;
                    } 
                }

                let emptyIdx = 0;
                let nextIdx = -1;                
                for(let i = 0 ; i < list.length;i++){ 
                    if(i === curIdx) nextIdx = emptyIdx;
                    if(list[i].name) list[emptyIdx++] = list[i];     
                }                
                for(let i = 0 ; i < tgtInfos.length;i++) list.pop();

                if( curIdx !==  nextIdx) set(curMusicIdxState, nextIdx);
                set(musicListState, list);
                break;
            }
            case MusicListActionType.CHANGE_ORDER: {
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
        let list = get(musicListState);
        const idx = get(curMusicIdxState);
        if(list.length === 0 || !list[idx]) return {} as MusicInfo;
        return {...list[idx], idx: idx};
    }
});
