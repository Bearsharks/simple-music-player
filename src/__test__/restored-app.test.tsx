vi.mock("features/youtube/api/videoMetadata", async (original) => ({
  ...(await original<typeof import("features/youtube/api/videoMetadata")>()),
  fetchVideoTitles: async () => ({}),
}));
import { resetDatabase } from "test/resetDatabase";
import { render, screen, act } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { playlistInfosState } from "features/playlists/model/playlistAtoms";
import { vi } from "vitest";
import App from "app/App";
vi.mock("features/player/api/iframe", () => ({
  loadIframeApi: async () => ({
    Player: class {
      constructor(_h: HTMLElement, c: any) {
        queueMicrotask(() => c.events.onReady());
      }
      getPlaylist() {
        return ["abcdefghijk", "lmnopqrstuv"];
      }
      loadVideoById() {}
      playVideo() {}
      pauseVideo() {}
      destroy() {}
      stopVideo() {}
      getPlayerState() {
        return 0;
      }
      getDuration() {
        return 0;
      }
      getCurrentTime() {
        return 0;
      }
      getVolume() {
        return 100;
      }
      isMuted() {
        return false;
      }
    },
  }),
}));
beforeEach(async () => {
  await resetDatabase();
  localStorage.clear();
  window.history.replaceState({}, "", "/simple-music-player/");
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());
it("renders the original playlist workspace without a login gate", async () => {
  const store = createStore();
  await store.get(playlistInfosState);
  await act(async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
  });
  expect(
    await screen.findByRole("button", { name: "새 재생목록" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("로그인")).not.toBeInTheDocument();
});

it("navigates a successful UI creation to the new detail and focuses its first URL field", async () => {
  const { fireEvent, waitFor } = await import("@testing-library/react");
  const api = (await import("shared/api/localAPI")).default;
  const store = createStore();
  await store.get(playlistInfosState);
  await act(async () =>
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    ),
  );
  fireEvent.click(await screen.findByRole("button", { name: "새 재생목록" }));
  fireEvent.change(screen.getByLabelText("제목"), {
    target: { value: "방금 만든 목록" },
  });
  fireEvent.click(screen.getByRole("button", { name: "만들기" }));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "방금 만든 목록" }),
    ).toBeInTheDocument(),
  );
  expect(screen.getByLabelText("추가할 영상 URL")).toHaveFocus();
  expect(screen.getByRole("button", { name: "전체 재생" })).toBeDisabled();
  expect((await api.getPlaylistInfos())[0].itemCount).toBe(0);
});

it.each([390, 1440])(
  "keeps the route, open queue and playback when saving its selection at %ipx",
  async (width) => {
    const user = (await import("@testing-library/user-event")).default.setup();
    const { within, waitFor } = await import("@testing-library/react");
    const api = (await import("shared/api/localAPI")).default;
    const { queueState } = await import("features/queue/model/queue");
    const openState = (await import("features/queue/model/musiclistOpenState"))
      .default;
    vi.stubGlobal("innerWidth", width);
    const track = {
      key: "queue-song",
      videoID: "abcdefghijk",
      name: "듣던 곡",
      owner: "",
      query: "",
      thumbnail: "",
    };
    const id = await api.createPlaylist(
      {
        id: "",
        name: "보던 목록",
        description: "",
        itemCount: 0,
        thumbnails: [],
      },
      [],
    );
    window.history.replaceState({}, "", `/simple-music-player/playlist/${id}`);
    const store = createStore();
    await store.get(playlistInfosState);
    store.set(queueState, { items: [track], index: 0 });
    store.set(openState, true);
    await act(async () =>
      render(
        <Provider store={store}>
          <App />
        </Provider>,
      ),
    );
    const save = await screen.findByRole("button", {
      name: "대기열을 재생목록에 저장",
    });
    await user.click(save);
    await user.click(
      await screen.findByRole("button", { name: "새 재생목록 만들기" }),
    );
    await user.clear(screen.getByLabelText("이름"));
    await user.type(screen.getByLabelText("이름"), "듣던 대기열 저장");
    await user.click(screen.getByRole("button", { name: "만들고 추가" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "재생목록에 추가" }),
      ).not.toBeInTheDocument(),
    );
    expect(window.location.pathname).toBe(
      `/simple-music-player/playlist/${id}`,
    );
    expect(store.get(openState)).toBe(true);
    expect(store.get(queueState)).toEqual({ items: [track], index: 0 });
    expect(
      (await api.getPlaylistInfos()).find((p) => p.name === "듣던 대기열 저장")
        ?.itemCount,
    ).toBe(1);
    expect(save).toHaveFocus();
  },
);

it.each([390, 1440])(
  "opens imported detail at its heading with the URL form collapsed at %ipx",
  async (width) => {
    const user = (await import("@testing-library/user-event")).default.setup();
    const { waitFor } = await import("@testing-library/react");
    const openState = (await import("features/queue/model/musiclistOpenState"))
      .default;
    vi.stubGlobal("innerWidth", width);
    const store = createStore();
    await store.get(playlistInfosState);
    store.set(openState, true);
    await act(async () =>
      render(
        <Provider store={store}>
          <App />
        </Provider>,
      ),
    );
    await user.click(screen.getByRole("button", { name: "새 재생목록" }));
    await user.click(
      screen.getByRole("button", { name: "유튜브에서 가져오기" }),
    );
    await user.type(
      screen.getByLabelText("공개 재생목록 URL"),
      "https://youtube.com/playlist?list=PLtest123",
    );
    await user.type(screen.getByLabelText("목록 이름"), "가져온 음악");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "재생목록 추가" }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "재생목록 추가" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "가져온 음악" }),
      ).toHaveFocus(),
    );
    expect(screen.queryByLabelText("추가할 영상 URL")).not.toBeInTheDocument();
    expect(store.get(openState)).toBe(width >= 1200);
  },
);
