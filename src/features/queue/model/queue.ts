import { atom, useStore } from "jotai";
import { useCallback } from "react";
import {
  MusicInfoAction,
  MusicInfoActionType,
  MusicListAction,
  MusicListActionType,
  MusicInfoItem,
} from "shared/model/constants";
import { toMusicInfoItems } from "shared/model/musicItems";
import { playlistItemStateFamily } from "features/playlists/model/playlistAtoms";

const queueGeneration = atom(0);

// Queue and index commit together so subscribers never observe a mismatched pair.
export const queueState = atom<{ items: MusicInfoItem[]; index: number }>({
  items: [],
  index: 0,
});
export const musicListState = atom(
  (get) => get(queueState).items,
  (get, set, items: MusicInfoItem[]) =>
    set(queueState, { ...get(queueState), items }),
);
export const curMusicIdxState = atom(
  (get) => get(queueState).index,
  (get, set, index: number) => set(queueState, { ...get(queueState), index }),
);
export const curMusicInfoState = atom((get) => {
  const { items, index } = get(queueState);
  return items[index] ?? ({} as MusicInfoItem);
});
export function removeFromQueue(
  items: MusicInfoItem[],
  index: number,
  keys: Set<string>,
) {
  const currentKey = items[index]?.key;
  const remaining = items.filter((item) => !keys.has(item.key));
  const survivingIndex = remaining.findIndex((item) => item.key === currentKey);
  const before = items
    .slice(0, index)
    .filter((item) => !keys.has(item.key)).length;
  return {
    items: remaining,
    index:
      survivingIndex >= 0
        ? survivingIndex
        : Math.max(0, Math.min(before, remaining.length - 1)),
  };
}
export function useMusicListManager() {
  const store = useStore();
  return useCallback(
    async (action: MusicListAction) => {
      const T = MusicListActionType;
      let incoming: MusicInfoItem[] = [];
      if (
        [T.LOAD_PLAYLIST, T.APPEND_PLAYLIST, T.ADD_TO_NEXT_PLAYLIST].includes(
          action.type,
        )
      ) {
        incoming = toMusicInfoItems(
          await store.get(playlistItemStateFamily(action.payload)),
        );
      } else if ([T.APPEND_ITEMS, T.ADD_TO_NEXT].includes(action.type))
        incoming = toMusicInfoItems(action.payload);
      if (action.type === T.LOAD_PLAYLIST && incoming.length === 0) return;
      // Read AFTER async loading: concurrent appends must not overwrite each other.
      const { items, index } = store.get(queueState);
      if (action.type === T.LOAD_PLAYLIST) {
        store.set(queueGeneration, (value) => value + 1);
        store.set(queueState, { items: incoming, index: 0 });
      } else if (action.type === T.CLEAR) {
        store.set(queueGeneration, (value) => value + 1);
        store.set(queueState, { items: [], index: 0 });
      } else if ([T.APPEND_PLAYLIST, T.APPEND_ITEMS].includes(action.type))
        store.set(queueState, { items: [...items, ...incoming], index });
      else if ([T.ADD_TO_NEXT_PLAYLIST, T.ADD_TO_NEXT].includes(action.type)) {
        const at = items.length ? index + 1 : 0;
        store.set(queueState, {
          items: [...items.slice(0, at), ...incoming, ...items.slice(at)],
          index,
        });
      } else if (action.type === T.DELETE) {
        const keys = new Set<string>(
          action.payload.map((item: MusicInfoItem) => item.key),
        );
        const deleted = items.filter((item) => keys.has(item.key));
        const generation = store.get(queueGeneration);
        store.set(queueState, removeFromQueue(items, index, keys));
        let restored = false;
        return {
          deletedCount: deleted.length,
          undo: async () => {
            if (restored) return;
            if (store.get(queueGeneration) !== generation)
              throw new Error(
                "대기열이 교체되거나 비워져 이전 삭제를 되돌릴 수 없습니다.",
              );
            const current = store.get(queueState);
            const currentKey = current.items[current.index]?.key;
            const nextItems = [...current.items];
            for (const item of deleted) {
              if (nextItems.some((track) => track.key === item.key)) continue;
              const originalIndex = items.findIndex(
                (track) => track.key === item.key,
              );
              const after = items
                .slice(originalIndex + 1)
                .find((track) =>
                  nextItems.some((value) => value.key === track.key),
                );
              const before = items
                .slice(0, originalIndex)
                .reverse()
                .find((track) =>
                  nextItems.some((value) => value.key === track.key),
                );
              const at = after
                ? nextItems.findIndex((track) => track.key === after.key)
                : before
                  ? nextItems.findIndex((track) => track.key === before.key) + 1
                  : nextItems.length;
              nextItems.splice(at, 0, item);
            }
            store.set(queueState, {
              items: nextItems,
              index: Math.max(
                0,
                nextItems.findIndex((item) => item.key === currentKey),
              ),
            });
            restored = true;
          },
        };
      } else if (action.type === T.CHANGE_ORDER) {
        const { from, to } = action.payload;
        if (
          ![from, to].every(
            (i) => Number.isInteger(i) && i >= 0 && i < items.length,
          )
        )
          return;
        const reordered = [...items];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        store.set(queueState, {
          items: reordered,
          index: Math.max(
            0,
            reordered.findIndex((i) => i.key === items[index]?.key),
          ),
        });
      }
    },
    [store],
  );
}
export function useCurMusicManager() {
  const store = useStore();
  return useCallback(
    async (action: MusicInfoAction) => {
      const { items, index } = store.get(queueState);
      const T = MusicInfoActionType;
      if (action.type === T.SET) {
        if (!action.payload.list.length) return;
        store.set(queueGeneration, (value) => value + 1);
        store.set(queueState, {
          items: toMusicInfoItems(action.payload.list),
          index: Math.max(
            0,
            Math.min(action.payload.idx, action.payload.list.length - 1),
          ),
        });
        return;
      }
      if (action.type === T.SET_INFO && items[index]) {
        store.set(queueState, {
          items: items.map((item, i) =>
            i === index ? { ...item, ...action.payload, key: item.key } : item,
          ),
          index,
        });
        return;
      }
      const next =
        action.type === T.NEXT
          ? index + 1
          : action.type === T.PREV
            ? index - 1
            : action.payload;
      if (Number.isInteger(next) && next >= 0 && next < items.length)
        store.set(queueState, { items, index: next });
    },
    [store],
  );
}
