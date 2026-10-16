import { atom, useStore } from 'jotai';
import { useCallback } from 'react';
import { MusicInfoAction, MusicInfoActionType, MusicListAction, MusicListActionType, MusicInfoItem } from 'shared/model/constants';
import { toMusicInfoItems } from 'shared/model/musicItems';
import { playlistItemStateFamily } from 'features/playlists/model/playlistAtoms';

// Queue and index commit together so subscribers never observe a mismatched pair.
export const queueState = atom<{ items: MusicInfoItem[]; index: number }>({ items: [], index: 0 });
export const musicListState = atom(get => get(queueState).items, (get, set, items: MusicInfoItem[]) => set(queueState, { ...get(queueState), items }));
export const curMusicIdxState = atom(get => get(queueState).index, (get, set, index: number) => set(queueState, { ...get(queueState), index }));
export const curMusicInfoState = atom(get => {
    const { items, index } = get(queueState);
    return items[index] ?? {} as MusicInfoItem;
});
export function removeFromQueue(items: MusicInfoItem[], index: number, keys: Set<string>) {
    const currentKey = items[index]?.key;
    const remaining = items.filter(item => !keys.has(item.key));
    const survivingIndex = remaining.findIndex(item => item.key === currentKey);
    const before = items.slice(0, index).filter(item => !keys.has(item.key)).length;
    return { items: remaining, index: survivingIndex >= 0 ? survivingIndex : Math.max(0, Math.min(before, remaining.length - 1)) };
}
export function useMusicListManager() {
    const store = useStore();
    return useCallback(async (action: MusicListAction) => {
        const T = MusicListActionType;
        let incoming: MusicInfoItem[] = [];
        if ([T.LOAD_PLAYLIST, T.APPEND_PLAYLIST, T.ADD_TO_NEXT_PLAYLIST].includes(action.type)) {
            incoming = toMusicInfoItems(await store.get(playlistItemStateFamily(action.payload)));
        } else if ([T.APPEND_ITEMS, T.ADD_TO_NEXT].includes(action.type)) incoming = toMusicInfoItems(action.payload);
        // Read AFTER async loading: concurrent appends must not overwrite each other.
        const { items, index } = store.get(queueState);
        if (action.type === T.LOAD_PLAYLIST) store.set(queueState, { items: incoming, index: 0 });
        else if ([T.APPEND_PLAYLIST, T.APPEND_ITEMS].includes(action.type)) store.set(queueState, { items: [...items, ...incoming], index });
        else if ([T.ADD_TO_NEXT_PLAYLIST, T.ADD_TO_NEXT].includes(action.type)) {
            const at = items.length ? index + 1 : 0;
            store.set(queueState, { items: [...items.slice(0, at), ...incoming, ...items.slice(at)], index });
        } else if (action.type === T.DELETE) {
            store.set(queueState, removeFromQueue(items, index, new Set(action.payload.map((i: MusicInfoItem) => i.key))));
        } else if (action.type === T.CHANGE_ORDER) {
            const { from, to } = action.payload;
            if (![from, to].every(i => Number.isInteger(i) && i >= 0 && i < items.length)) return;
            const reordered = [...items]; const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
            store.set(queueState, { items: reordered, index: Math.max(0, reordered.findIndex(i => i.key === items[index]?.key)) });
        }
    }, [store]);
}
export function useCurMusicManager() {
    const store = useStore();
    return useCallback(async (action: MusicInfoAction) => {
        const { items, index } = store.get(queueState); const T = MusicInfoActionType;
        if (action.type === T.SET) { store.set(queueState, { items: toMusicInfoItems(action.payload.list), index: Math.max(0, Math.min(action.payload.idx, action.payload.list.length - 1)) }); return; }
        if (action.type === T.SET_INFO && items[index]) {
            store.set(queueState, { items: items.map((item, i) => i === index ? { ...item, ...action.payload, key: item.key } : item), index }); return;
        }
        const next = action.type === T.NEXT ? index + 1 : action.type === T.PREV ? index - 1 : action.payload;
        if (Number.isInteger(next) && next >= 0 && next < items.length) store.set(queueState, { items, index: next });
    }, [store]);
}
