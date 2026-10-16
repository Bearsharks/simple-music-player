vi.mock("features/youtube/api/videoMetadata", async (original) => ({
  ...(await original<typeof import("features/youtube/api/videoMetadata")>()),
  fetchVideoTitles: async () => ({}),
}));
import { resetDatabase } from "test/resetDatabase";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Provider } from "jotai";
import { vi } from "vitest";
import PlaylistImport from "features/youtube/ui/PlaylistImport";
import api from "shared/api/localAPI";
vi.mock("features/player/api/iframe", () => ({
  loadIframeApi: async () => ({
    Player: class {
      constructor(_h: HTMLElement, c: any) {
        queueMicrotask(() => c.events.onReady());
      }
      getPlaylist() {
        return ["abcdefghijk", "lmnopqrstuv"];
      }
      destroy() {}
    },
  }),
}));
beforeEach(async () => {
  localStorage.clear();
  await resetDatabase();
});
it("imports player-provided IDs into editable local storage without login", async () => {
  const close = vi.fn();
  render(
    <Provider>
      <PlaylistImport close={close} />
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText("공개 재생목록 URL"), {
    target: { value: "https://youtube.com/playlist?list=PLtest123" },
  });
  fireEvent.change(screen.getByLabelText("목록 이름"), {
    target: { value: "내 음악" },
  });
  fireEvent.blur(screen.getByLabelText("공개 재생목록 URL"));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "재생목록 추가" }),
    ).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "재생목록 추가" }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  const lists = await api.getPlaylistInfos();
  expect(lists[0].name).toBe("내 음악");
  expect(lists[0].hasInitialSnapshot).toBe(true);
  expect(lists[0]).not.toHaveProperty("initialSnapshot");
  expect(await api.getInitialSnapshot(lists[0].id)).toMatchObject({
    version: 1,
    capturedAt: expect.any(Number),
    items: [{ videoID: "abcdefghijk" }, { videoID: "lmnopqrstuv" }],
  });
  expect(
    (await api.getPlaylistItems(lists[0].id)).map((i) => i.videoID),
  ).toEqual(["abcdefghijk", "lmnopqrstuv"]);
});
it("latest preview waits for explicit replacement and preserves legacy identity and metadata", async () => {
  const source = "https://www.youtube.com/playlist?list=PLtest123";
  const id = await api.createPlaylist(
    {
      id: "",
      name: "편집본",
      description: "편집한 설명",
      thumbnails: [],
      itemCount: 1,
      sourcePlaylistUrl: source,
    },
    [
      {
        videoID: "zzzzzzzzzzz",
        name: "추가한 곡",
        query: "",
        owner: "",
        thumbnail: "",
      },
    ],
  );
  const original = await api.getPlaylistInfo(id);
  const close = vi.fn();
  render(
    <Provider>
      <PlaylistImport original={original} close={close} />
    </Provider>,
  );

  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "최신 목록으로 교체" }),
    ).not.toBeDisabled(),
  );
  expect((await api.getPlaylistItems(id))[0].videoID).toBe("zzzzzzzzzzz");
  expect(close).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("공개 재생목록 URL")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("목록 이름")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "최신 목록으로 교체" }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(await api.getPlaylistInfos()).toHaveLength(1);
  expect(await api.getPlaylistInfo(id)).toMatchObject({
    sourcePlaylistUrl: source,
    name: "편집본",
    description: "편집한 설명",
  });
  expect(await api.getInitialSnapshot(id)).toBeUndefined();
  expect((await api.getPlaylistItems(id)).map((i) => i.videoID)).toEqual([
    "abcdefghijk",
    "lmnopqrstuv",
  ]);
});

it("keeps a failed save visible while preview polling continues and permits retry", async () => {
  const close = vi.fn();
  render(
    <Provider>
      <PlaylistImport close={close} />
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText("공개 재생목록 URL"), {
    target: { value: "https://youtube.com/playlist?list=PLtest123" },
  });
  fireEvent.blur(screen.getByLabelText("공개 재생목록 URL"));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "재생목록 추가" })).toBeEnabled(),
  );
  const create = vi
    .spyOn(api, "createPlaylist")
    .mockRejectedValueOnce(new Error("저장 공간 부족"));
  fireEvent.click(screen.getByRole("button", { name: "재생목록 추가" }));
  await screen.findByRole("alert");
  await new Promise((resolve) => setTimeout(resolve, 1100));
  expect(screen.getByRole("alert")).toHaveTextContent("저장 공간 부족");
  expect(screen.getByLabelText("공개 재생목록 URL")).toHaveValue(
    "https://youtube.com/playlist?list=PLtest123",
  );
  fireEvent.click(screen.getByRole("button", { name: "재생목록 추가" }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(create).toHaveBeenCalledTimes(2);
  create.mockRestore();
});
