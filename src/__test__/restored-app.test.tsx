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
