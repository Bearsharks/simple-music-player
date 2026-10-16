import { atom, useStore } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
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

// Serialize local mutations per store so simultaneous saves/Undo cannot replace
// one another with a stale item snapshot. This does not synchronize other tabs.
const replacementVersions = atom<Record<string, number>>({});
const pendingMutations = new WeakMap<ReturnType<typeof useStore>, Promise<unknown>>();
function mutate<T>(store: ReturnType<typeof useStore>, operation: () => Promise<T>): Promise<T> {
    const previous = pendingMutations.get(store) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(operation);
    pendingMutations.set(store, next);
    return next;
}

async function saveItems(store: ReturnType<typeof useStore>, info: PlaylistInfo, items: MusicInfoItem[]) {
    const nextInfo = { ...info, itemCount: items.length, thumbnails: items.map(item => item.thumbnail).filter(Boolean).slice(0, 4) };
    if (!await api.updatePlaylist({ info: nextInfo, items }))
        throw new Error('목록을 찾을 수 없습니다. 라이브러리로 돌아가 다시 확인해 주세요.');
    store.set(playlistInfoStateFamily(info.id), nextInfo);
    store.set(playlistItemStateFamily(info.id), items);
}

export interface PlaylistDeletionUndo {
    deletedCount: number;
    undo: () => Promise<void>;
}

export function usePlaylistManager() {
    const store = useStore();
    return useCallback((action: PlaylistAction): Promise<PlaylistDeletionUndo | void> => mutate(store, async () => {
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
            // false means already absent. Keep failed writes visible, but reconcile stale IDs.
            await api.deletePlaylist(id);
            set(playlistIDsState, (await get(playlistIDsState)).filter(value => value !== id));
            // Do not RESET mounted detail atoms: that would refetch a deleted row before
            // its route unmounts. Membership in playlistIDsState controls detail access.
            return;
        }
        const id = action.type === DELETE_ITEMS ? action.payload.id : action.payload.info?.id;
        if (!id) return;
        const info = await get(playlistInfoStateFamily(id));
        const previous = await get(playlistItemStateFamily(id));
        const nextInfo: PlaylistInfo = { ...info, ...action.payload.info, createdAt: info.createdAt };
        let items: MusicInfoItem[] = previous;
        let replaced = false;
        if (action.type === DELETE_ITEMS) {
            const removed = new Set(action.payload.items.map((item: MusicInfoItem) => item.key));
            items = previous.filter(item => !removed.has(item.key));
        } else if (action.type === APPEND) {
            items = [...previous, ...toMusicInfoItems(action.payload.items ?? [])];
        } else if (action.type === UPDATE && action.payload.items) {
            const keys = new Set(previous.map(item => item.key));
            replaced = !action.payload.items.length || action.payload.items.some((item: MusicInfoItem) => !keys.has(item.key));
            // Reordering keeps track identity; new/imported tracks still get fresh keys.
            items = action.payload.items.map((item: MusicInfoItem) => keys.has(item.key) ? item : toMusicInfoItems([item])[0]);
        }
        await saveItems(store, nextInfo, items);
        if (replaced) set(replacementVersions, versions => ({ ...versions, [id]: (versions[id] ?? 0) + 1 }));
        if (action.type !== DELETE_ITEMS) return;
        const version = get(replacementVersions)[id] ?? 0;
        const remainingKeys = new Set(items.map(item => item.key));
        const deleted = previous.filter(item => !remainingKeys.has(item.key));
        let restored = false;
        return {
            deletedCount: deleted.length,
            undo: () => mutate(store, async () => {
                if (restored) return;
                if (!(await get(playlistIDsState)).includes(id))
                    throw new Error('재생목록이 삭제되어 곡을 복원할 수 없습니다.');
                if ((get(replacementVersions)[id] ?? 0) !== version)
                    throw new Error('목록의 곡이 교체되어 이전 삭제를 되돌릴 수 없습니다.');
                const currentInfo = await get(playlistInfoStateFamily(id));
                const current = [...await get(playlistItemStateFamily(id))];
                for (const item of deleted) {
                    if (current.some(value => value.key === item.key)) continue;
                    const originalIndex = previous.findIndex(value => value.key === item.key);
                    const next = previous.slice(originalIndex + 1).find(value => current.some(track => track.key === value.key));
                    const before = previous.slice(0, originalIndex).reverse().find(value => current.some(track => track.key === value.key));
                    const at = next ? current.findIndex(value => value.key === next.key) :
                        before ? current.findIndex(value => value.key === before.key) + 1 : current.length;
                    current.splice(at, 0, item);
                }
                await saveItems(store, currentInfo, current);
                restored = true;
            }),
        };
    }), [store]);
}
