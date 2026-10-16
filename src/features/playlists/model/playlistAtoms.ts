import { atom, useStore } from 'jotai';
import { atomWithDefault, RESET } from 'jotai/utils';
import { useCallback } from 'react';
import api from 'shared/api/apiSelector';
import { PlaylistAction, PlaylistActionType, PlaylistInfo, MusicInfoItem } from 'shared/model/constants';
import { toMusicInfoItems } from 'shared/model/musicItems';

// Lazy requests: importing this module never performs network I/O.
export const playlistIDsState = atomWithDefault<string[] | Promise<string[]>>(async () => (await api.getPlaylistInfos()).map(p => p.id));
const infoCache = new Map<string, ReturnType<typeof makeInfo>>();
const itemsCache = new Map<string, ReturnType<typeof makeItems>>();
const makeInfo = (id: string) => atomWithDefault<PlaylistInfo | Promise<PlaylistInfo>>(() => api.getPlaylistInfo(id));
const makeItems = (id: string) => atomWithDefault<MusicInfoItem[] | Promise<MusicInfoItem[]>>(async () => toMusicInfoItems(await api.getPlaylistItems(id)));
export function playlistInfoStateFamily(id: string) {
    if (!infoCache.has(id)) infoCache.set(id, makeInfo(id));
    return infoCache.get(id)!;
}
export function playlistItemStateFamily(id: string) {
    if (!itemsCache.has(id)) itemsCache.set(id, makeItems(id));
    return itemsCache.get(id)!;
}
export const playlistInfosState = atom(async get => Promise.all((await get(playlistIDsState)).map(id => get(playlistInfoStateFamily(id)))));

export function usePlaylistManager() {
    const store = useStore();
    return useCallback(async (action: PlaylistAction) => {
        const { get, set } = store;
        const { CREATE, DELETE, UPDATE, APPEND, DELETE_ITEMS } = PlaylistActionType;
        if (action.type === CREATE) {
            const id = await api.createPlaylist(action.payload.info, action.payload.items ?? []);
            const ids = await get(playlistIDsState);
            if (!ids.includes(id)) set(playlistIDsState, [...ids, id]);
            return;
        }
        if (action.type === DELETE) {
            const id = action.payload as string;
            if (await api.deletePlaylist(id)) {
                set(playlistIDsState, (await get(playlistIDsState)).filter(value => value !== id));
                set(playlistInfoStateFamily(id), RESET);
                set(playlistItemStateFamily(id), RESET);
            }
            return;
        }
        const id = action.type === DELETE_ITEMS ? action.payload.id : action.payload.info?.id;
        if (!id) return;
        const info = await get(playlistInfoStateFamily(id));
        const previous = await get(playlistItemStateFamily(id));
        let nextInfo: PlaylistInfo = { ...info, ...action.payload.info };
        let items: MusicInfoItem[] = previous;
        if (action.type === DELETE_ITEMS) {
            const removed = new Set(action.payload.items.map((item: MusicInfoItem) => item.key));
            items = previous.filter(item => !removed.has(item.key));
        } else if (action.type === APPEND) {
            items = [...previous, ...toMusicInfoItems(action.payload.items ?? [])];
        } else if (action.type === UPDATE && action.payload.items) {
            items = toMusicInfoItems(action.payload.items);
        }
        nextInfo = { ...nextInfo, itemCount: items.length, thumbnails: items.map(i => i.thumbnail).filter(Boolean).slice(0, 4) };
        if (await api.updatePlaylist({ info: nextInfo, items })) {
            set(playlistInfoStateFamily(id), nextInfo);
            set(playlistItemStateFamily(id), items);
        }
    }, [store]);
}
