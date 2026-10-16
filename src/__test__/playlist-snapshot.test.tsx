import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import api, { exportPlaylists, importPlaylists } from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
import { parseBackup } from "features/playlists/model/backup";
import {
  playlistInfosState,
  playlistInfoStateFamily,
  playlistItemStateFamily,
  usePlaylistManager,
} from "features/playlists/model/playlistAtoms";
import { queueState } from "features/queue/model/queue";
import { PlaylistActionType as T } from "shared/model/constants";
import Popup from "features/overlays/Popup";
import Modal from "features/overlays/Modal";
import { useOpenPlaylistOptionsPopup } from "features/overlays/PopupStates";
const media = vi.hoisted(() => ({ loads: 0 }));
vi.mock("features/youtube/api/videoMetadata", async (original) => ({
  ...(await original<typeof import("features/youtube/api/videoMetadata")>()),
  fetchVideoTitles: async () => ({}),
}));
vi.mock("features/player/api/iframe", () => ({
  loadIframeApi: async () => {
    media.loads++;
    return {
      Player: class {
        constructor(_host: HTMLElement, config: any) {
          queueMicrotask(() => config.events.onReady());
        }
        getPlaylist() {
          return ["lmnopqrstuv"];
        }
        destroy() {}
      },
    };
  },
}));
const track = {
  videoID: "abcdefghijk",
  name: "처음 곡",
  query: "",
  owner: "",
  thumbnail: "https://i.ytimg.com/vi/abcdefghijk/default.jpg",
};
const other = { ...track, videoID: "lmnopqrstuv", name: "편집 곡" };
const info = {
  id: "",
  name: "목록",
  description: "설명",
  thumbnails: [],
  itemCount: 1,
  sourcePlaylistUrl: "https://www.youtube.com/playlist?list=PLtest123",
};
const snapshot = () => ({
  version: 1 as const,
  capturedAt: 1000,
  items: [{ ...track }],
});
let manage: ReturnType<typeof usePlaylistManager>;
async function mount(id: string) {
  const store = createStore();
  await store.get(playlistInfosState);
  store.set(queueState, { items: [{ ...track, key: "playing" }], index: 0 });
  function Harness() {
    manage = usePlaylistManager();
    const open = useOpenPlaylistOptionsPopup();
    return (
      <>
        <button onClick={(event) => open(event.currentTarget, id)}>
          더보기
        </button>
        <Popup />
        <Modal />
      </>
    );
  }
  await act(async () =>
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    ),
  );
  const user = userEvent.setup();
  return {
    store,
    user,
    menu: async () => {
      await act(async () => {
        await user.click(screen.getByRole("button", { name: "더보기" }));
      });
    },
  };
}
beforeEach(async () => {
  media.loads = 0;
  await resetDatabase();
});
afterEach(() => vi.restoreAllMocks());

it("keeps an immutable independent snapshot while metadata APIs only expose its presence", async () => {
  const original = snapshot();
  const id = await api.createPlaylist(info, [track], original);
  original.items[0].name = "외부 변경";
  expect(await api.getInitialSnapshot(id)).toEqual(snapshot());
  const summary = await api.getPlaylistInfo(id);
  expect(summary.hasInitialSnapshot).toBe(true);
  expect(summary).not.toHaveProperty("initialSnapshot");
  expect(summary).not.toHaveProperty("items");
  await api.updatePlaylist({
    info: { ...summary, name: "새 이름", hasInitialSnapshot: false },
    items: [other],
  });
  expect(await api.getInitialSnapshot(id)).toEqual(snapshot());
  expect(await api.getPlaylistInfo(id)).toMatchObject({
    name: "새 이름",
    hasInitialSnapshot: true,
  });
  const copy = await api.getInitialSnapshot(id);
  copy!.items[0].name = "조회본 변경";
  expect(await api.getInitialSnapshot(id)).toEqual(snapshot());
});

it("restores without network, keeps current metadata/queue and invalidates an older track Undo", async () => {
  const id = await api.createPlaylist(info, [track, other], snapshot());
  const { store, user, menu } = await mount(id);
  const items = await store.get(playlistItemStateFamily(id));
  let removed: any;
  await act(async () => {
    removed = await manage({
      type: T.DELETE_ITEMS,
      payload: { id, items: [items[0]] },
    });
    await manage({
      type: T.UPDATE,
      payload: {
        info: { id, name: "사용자 이름", description: "사용자 설명" },
      },
    });
  });
  await menu();
  await user.click(
    screen.getByRole("menuitem", { name: "처음 가져온 목록으로 복원" }),
  );
  await screen.findByRole("heading", {
    name: "처음 가져온 1곡으로 복원할까요?",
  });
  expect(media.loads).toBe(0);
  expect(await api.getPlaylistItems(id)).toHaveLength(1);
  const write = vi
    .spyOn(api, "updatePlaylist")
    .mockRejectedValueOnce(new Error("복원 저장 실패"));
  await user.click(screen.getByRole("button", { name: "복원" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("복원 저장 실패");
  expect((await api.getPlaylistItems(id))[0].videoID).toBe(other.videoID);
  await user.click(screen.getByRole("button", { name: "복원" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(write).toHaveBeenCalledTimes(2);
  expect(media.loads).toBe(0);
  expect(await api.getPlaylistItems(id)).toMatchObject(snapshot().items);
  expect((await store.get(playlistItemStateFamily(id)))[0].key).not.toBe(
    items[0].key,
  );
  expect(await api.getPlaylistInfo(id)).toMatchObject({
    name: "사용자 이름",
    description: "사용자 설명",
  });
  expect(store.get(queueState).items[0].key).toBe("playing");
  await expect(removed.undo()).rejects.toThrow("교체");
});

it.each([true, false])(
  "explicit latest replacement preserves the original snapshot policy (%s)",
  async (hasSnapshot) => {
    const id = await api.createPlaylist(
      info,
      [track],
      hasSnapshot ? snapshot() : undefined,
    );
    const { store, user, menu } = await mount(id);
    await menu();
    expect(
      Boolean(
        screen.queryByRole("menuitem", { name: "처음 가져온 목록으로 복원" }),
      ),
    ).toBe(hasSnapshot);
    await user.click(
      screen.getByRole("menuitem", { name: "YouTube 최신 목록 가져오기" }),
    );
    const replace = await screen.findByRole("button", {
      name: "최신 목록으로 교체",
    });
    await waitFor(() => expect(replace).toBeEnabled());
    expect(media.loads).toBe(1);
    expect(await api.getPlaylistItems(id)).toEqual([track]);
    await act(async () => {
      await manage({
        type: T.UPDATE,
        payload: {
          info: {
            id,
            name: "미리보기 중 바뀐 이름",
            description: "보존할 설명",
          },
        },
      });
    });
    await user.click(replace);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      (await api.getPlaylistItems(id)).map((item) => item.videoID),
    ).toEqual([other.videoID]);
    expect(await api.getPlaylistInfo(id)).toMatchObject({
      name: "미리보기 중 바뀐 이름",
      description: "보존할 설명",
    });
    expect(await api.getInitialSnapshot(id)).toEqual(
      hasSnapshot ? snapshot() : undefined,
    );
    expect(store.get(queueState).items[0].key).toBe("playing");
  },
);

it("roundtrips snapshot backups, accepts legacy v1 and rejects malformed or over-limit snapshots atomically", async () => {
  const id = await api.createPlaylist(info, [other], snapshot());
  const rows = parseBackup(
    JSON.stringify({
      format: "smp-playlists",
      version: 1,
      playlists: await exportPlaylists(),
    }),
  );
  await importPlaylists(rows);
  const exported = await exportPlaylists();
  expect(exported).toHaveLength(2);
  expect(
    exported.every(
      (row) => row.initialSnapshot?.items[0].videoID === track.videoID,
    ),
  ).toBe(true);
  const legacy = parseBackup(
    JSON.stringify({
      format: "smp-playlists",
      version: 1,
      playlists: [{ info, items: [track] }],
    }),
  );
  expect(legacy[0].initialSnapshot).toBeUndefined();
  for (const bad of [
    { ...snapshot(), version: 2 },
    { ...snapshot(), capturedAt: -1 },
    { ...snapshot(), items: [{ ...track, videoID: "bad" }] },
    { ...snapshot(), items: Array.from({ length: 10001 }, () => track) },
  ]) {
    expect(() =>
      parseBackup(
        JSON.stringify({
          format: "smp-playlists",
          version: 1,
          playlists: [{ info, items: [track], initialSnapshot: bad }],
        }),
      ),
    ).toThrow();
  }
  const add = vi
    .spyOn(IDBObjectStore.prototype, "add")
    .mockImplementationOnce(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
  await expect(api.createPlaylist(info, [other], snapshot())).rejects.toThrow();
  add.mockRestore();
  expect(await api.getPlaylistInfos()).toHaveLength(2);
  expect(await api.getInitialSnapshot(id)).toEqual(snapshot());
});

it("rolls back both live/snapshot backup records when the second insert aborts", async () => {
  const id = await api.createPlaylist(info, [other], snapshot());
  const rows = await exportPlaylists();
  const originalAdd = IDBObjectStore.prototype.add;
  let calls = 0;
  const write = vi
    .spyOn(IDBObjectStore.prototype, "add")
    .mockImplementation(function (this: IDBObjectStore, value, key) {
      if (++calls === 2) throw new DOMException("quota", "QuotaExceededError");
      return originalAdd.call(this, value, key);
    });
  await expect(importPlaylists([rows[0], rows[0]])).rejects.toThrow();
  write.mockRestore();
  expect(await api.getPlaylistInfos()).toHaveLength(1);
  expect(await api.getPlaylistItems(id)).toEqual([other]);
  expect(await api.getInitialSnapshot(id)).toEqual(snapshot());
});

it("allows 10000 live and 10000 snapshot tracks but rejects the aggregate snapshot limit", () => {
  const full = Array.from({ length: 10000 }, () => track);
  const backup = (rows: unknown[]) =>
    JSON.stringify({ format: "smp-playlists", version: 1, playlists: rows });
  const rows = parseBackup(
    backup([
      { info, items: full, initialSnapshot: { ...snapshot(), items: full } },
    ]),
  );
  expect(rows[0].items).toHaveLength(10000);
  expect(rows[0].initialSnapshot?.items).toHaveLength(10000);
  expect(() =>
    parseBackup(
      backup([
        { info, items: [], initialSnapshot: { ...snapshot(), items: full } },
        { info, items: [], initialSnapshot: snapshot() },
      ]),
    ),
  ).toThrow("기록의 곡 수");
});

it("hides both source actions on a local playlist without a source URL", async () => {
  const id = await api.createPlaylist(
    { ...info, sourcePlaylistUrl: undefined },
    [track],
  );
  const { menu } = await mount(id);
  await menu();
  expect(
    screen.queryByRole("menuitem", { name: "처음 가져온 목록으로 복원" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("menuitem", { name: "YouTube 최신 목록 가져오기" }),
  ).not.toBeInTheDocument();
});
