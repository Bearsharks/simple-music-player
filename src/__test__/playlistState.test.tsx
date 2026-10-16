import api from "shared/api/testAPI";
import { vi } from "vitest";
vi.mock("shared/config/env", () => ({ useFixtureApi: true }));
import { act, renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";
import {
  playlistIDsState,
  playlistInfoStateFamily,
  playlistItemStateFamily,
  usePlaylistManager,
} from "features/playlists/model/playlistAtoms";
import { PlaylistActionType as T } from "shared/model/constants";
import { reset } from "shared/api/testAPI";
function setup() {
  const store = createStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(usePlaylistManager, { wrapper });
  return { store, result };
}
beforeEach(reset);
it("creates, updates and deletes a playlist", async () => {
  const { store, result } = setup();
  const before = await store.get(playlistIDsState);
  await act(() =>
    result.current({
      type: T.CREATE,
      payload: {
        info: {
          name: "new",
          description: "desc",
          thumbnails: [],
          itemCount: 0,
        },
        items: [],
      },
    }),
  );
  const ids = await store.get(playlistIDsState);
  expect(ids).toHaveLength(before.length + 1);
  const id = ids.at(-1)!;
  let info = await store.get(playlistInfoStateFamily(id));
  expect(info.name).toBe("new");
  await act(() =>
    result.current({
      type: T.UPDATE,
      payload: {
        info: { ...info, name: "changed", description: "" },
        items: [],
      },
    }),
  );
  expect((await store.get(playlistInfoStateFamily(id))).name).toBe("changed");
  await act(() => result.current({ type: T.DELETE, payload: id }));
  expect(await store.get(playlistIDsState)).toEqual(before);
});
it("appends and deletes arbitrary items without mutating selection", async () => {
  const { store, result } = setup();
  const id = (await store.get(playlistIDsState))[0];
  const original = await store.get(playlistItemStateFamily(id));
  await act(() =>
    result.current({
      type: T.APPEND,
      payload: {
        info: { id },
        items: [
          { name: "new", query: "new", videoID: "", thumbnail: "", owner: "" },
        ],
      },
    }),
  );
  const items = await store.get(playlistItemStateFamily(id));
  expect(items).toHaveLength(original.length + 1);
  const selection = [items[2], items[0]];
  const keys = selection.map((i) => i.key);
  await act(() =>
    result.current({ type: T.DELETE_ITEMS, payload: { id, items: selection } }),
  );
  expect(selection.map((i) => i.key)).toEqual(keys);
  expect(await store.get(playlistItemStateFamily(id))).toEqual([items[1]]);
  expect((await store.get(playlistInfoStateFamily(id))).itemCount).toBe(1);
});

it("does not report a missing update as saved or overwrite the cached items", async () => {
  const { store, result } = setup();
  const id = (await store.get(playlistIDsState))[0];
  const before = await store.get(playlistItemStateFamily(id));
  const update = vi.spyOn(api, "updatePlaylist").mockResolvedValueOnce(false);
  await expect(
    result.current({ type: T.UPDATE, payload: { info: { id }, items: [] } }),
  ).rejects.toThrow("목록을 찾을 수 없습니다");
  expect(await store.get(playlistItemStateFamily(id))).toBe(before);
  update.mockRestore();
});

it("restores only deleted songs during Undo, preserving later appends/reorders and stable track keys", async () => {
  const { store, result } = setup();
  const id = (await store.get(playlistIDsState))[0];
  const original = await store.get(playlistItemStateFamily(id));
  const undo = await result.current({
    type: T.DELETE_ITEMS,
    payload: { id, items: [original[0]] },
  });
  if (!undo?.undo) throw new Error("Expected undo");
  await result.current({
    type: T.APPEND,
    payload: {
      info: { id },
      items: [
        {
          name: "추가곡",
          query: "",
          videoID: "abcdefghijk",
          thumbnail: "",
          owner: "",
        },
      ],
    },
  });
  const afterAppend = await store.get(playlistItemStateFamily(id));
  await result.current({
    type: T.UPDATE,
    payload: { info: { id }, items: [...afterAppend].reverse() },
  });
  const reordered = await store.get(playlistItemStateFamily(id));
  expect(reordered.map((item) => item.key)).toEqual(
    [...afterAppend].reverse().map((item) => item.key),
  );
  await undo.undo();
  const restored = await store.get(playlistItemStateFamily(id));
  expect(restored.map((item) => item.key)).toEqual([
    afterAppend[1].key,
    original[0].key,
    original[1].key,
  ]);
  expect((await store.get(playlistInfoStateFamily(id))).itemCount).toBe(3);
  await undo.undo();
  expect(await store.get(playlistItemStateFamily(id))).toHaveLength(3);
});

it("does not resurrect a playlist deleted before Undo", async () => {
  const { store, result } = setup();
  const id = (await store.get(playlistIDsState))[0];
  const items = await store.get(playlistItemStateFamily(id));
  const undo = await result.current({
    type: T.DELETE_ITEMS,
    payload: { id, items },
  });
  await result.current({ type: T.DELETE, payload: id });
  await expect(undo?.undo?.()).rejects.toThrow("재생목록이 삭제되어");
  expect(await store.get(playlistIDsState)).not.toContain(id);
});

it("serializes concurrent appends so neither saved result is lost", async () => {
  const { store, result } = setup();
  const id = (await store.get(playlistIDsState))[0];
  const before = await store.get(playlistItemStateFamily(id));
  await Promise.all(
    ["A", "B"].map((name) =>
      result.current({
        type: T.APPEND,
        payload: {
          info: { id },
          items: [
            {
              name,
              query: "",
              videoID: "abcdefghijk",
              thumbnail: "",
              owner: "",
            },
          ],
        },
      }),
    ),
  );
  expect(await store.get(playlistItemStateFamily(id))).toHaveLength(
    before.length + 2,
  );
});

it("invalidates old Undo after replacing all tracks from the original source", async () => {
  const { store, result } = setup();
  const id = (await store.get(playlistIDsState))[0];
  const previous = await store.get(playlistItemStateFamily(id));
  const undo = await result.current({
    type: T.DELETE_ITEMS,
    payload: { id, items: [previous[0]] },
  });
  const replacement = {
    name: "새 원본곡",
    query: "",
    videoID: "abcdefghijk",
    thumbnail: "",
    owner: "",
  };
  await result.current({
    type: T.UPDATE,
    payload: {
      info: {
        id,
        sourcePlaylistUrl: "https://www.youtube.com/playlist?list=PLtest123",
      },
      items: [replacement],
    },
  });
  await expect(undo?.undo?.()).rejects.toThrow("목록의 곡이 교체되어");
  expect(
    (await store.get(playlistItemStateFamily(id))).map((item) => item.name),
  ).toEqual(["새 원본곡"]);
});
