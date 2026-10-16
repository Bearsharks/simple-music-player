import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Suspense, useState } from "react";
import { ytPlayerInitedState } from "features/player/model/ytplayerStates";
import SoundController from "features/player/ui/playerController/SoundController";
import Dialog from "shared/ui/Dialog";
import ErrorToast from "shared/ui/ErrorToast";
import Notice, { useNotice } from "features/overlays/Notice";
import PlaylistPage from "features/playlists/pages/PlaylistPage";
import { playlistInfosState } from "features/playlists/model/playlistAtoms";
import { queueState } from "features/queue/model/queue";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";

it("ports the compact range into native scope and preserves keyboard/Escape ownership", async () => {
  const store = createStore();
  store.set(ytPlayerInitedState, true);
  let volume = 75,
    muted = false;
  const player = {
    getVolume: () => volume,
    isMuted: () => muted,
    setVolume: vi.fn((value) => {
      volume = value;
    }),
    mute: vi.fn(() => {
      muted = true;
    }),
    unMute: vi.fn(() => {
      muted = false;
    }),
  };
  (window as any).player = player;
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>플레이어</button>
        {open && (
          <Dialog label="미디어 패널" onClose={() => setOpen(false)}>
            <SoundController />
          </Dialog>
        )}
      </>
    );
  }
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
  await user.click(screen.getByRole("button", { name: "플레이어" }));
  const trigger = screen.getByRole("button", { name: "음량 조절" });
  await user.keyboard("{ArrowUp}");
  const slider = screen.getByRole("slider", { name: "음량" });
  expect(slider).toHaveFocus();
  expect(slider.closest("dialog")).toBe(
    screen.getByRole("dialog", { name: "미디어 패널" }),
  );
  expect(player.mute).not.toHaveBeenCalled();
  fireEvent.change(slider, { target: { value: "35" } });
  expect(player.setVolume).toHaveBeenCalledWith(35);
  expect(
    screen.queryByRole("button", { name: "음소거" }),
  ).not.toBeInTheDocument();
  fireEvent.change(slider, { target: { value: "0" } });
  expect(slider).toHaveValue("0");
  fireEvent.change(slider, { target: { value: "35" } });
  expect(player.unMute).toHaveBeenCalled();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(
    screen.getByRole("dialog", { name: "미디어 패널" }),
  ).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "플레이어" })).toHaveFocus();
  delete (window as any).player;
});

it("shares a stable page notice stack and moves both actionable notices into a task", async () => {
  const restore = vi.fn(async () => {});
  function Harness() {
    const notice = useNotice();
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          onClick={() =>
            notice("삭제한 곡", { label: "실행 취소", run: restore })
          }
        >
          알림
        </button>
        <button onClick={() => setOpen(true)}>작업</button>
        <Notice />
        <ErrorToast message="저장 오류" />
        {open && (
          <Dialog label="작업" onClose={() => setOpen(false)}>
            <button>폼 저장</button>
          </Dialog>
        )}
      </>
    );
  }
  const user = userEvent.setup();
  render(
    <Provider>
      <Harness />
    </Provider>,
  );
  await user.click(screen.getByRole("button", { name: "알림" }));
  const undo = screen.getByRole("button", { name: "실행 취소" });
  const error = screen.getByRole("alert");
  expect(undo.closest("[data-notice-stack]")).toBe(
    error.closest("[data-notice-stack]"),
  );
  expect(document.querySelectorAll("[data-notice-stack]")).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "작업" }));
  await waitFor(() =>
    expect(undo.closest("dialog")).toBe(
      screen.getByRole("dialog", { name: "작업" }),
    ),
  );
  expect(error.closest("dialog")).toBe(undo.closest("dialog"));
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(undo.closest("[data-notice-stack]")).not.toBeNull(),
  );
  expect(screen.getByRole("button", { name: "실행 취소" })).toBe(undo);
  await user.click(undo);
  expect(restore).toHaveBeenCalledOnce();
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "실행 취소" }),
    ).not.toBeInTheDocument(),
  );
});

it("opens AddVideo only on intent, preserves failed input and blocks duplicate pending writes", async () => {
  await resetDatabase();
  const id = await api.createPlaylist(
    { id: "", name: "빈 목록", description: "", itemCount: 0, thumbnails: [] },
    [],
  );
  const store = createStore();
  await store.get(playlistInfosState);
  const queue = {
    items: [
      {
        key: "playing",
        videoID: "lmnopqrstuv",
        name: "재생 유지",
        owner: "",
        query: "",
        thumbnail: "",
      },
    ],
    index: 0,
  };
  store.set(queueState, queue);
  await act(async () =>
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/playlist/${id}`]}>
          <Suspense fallback="loading">
            <Routes>
              <Route path="/playlist/:id" element={<PlaylistPage />} />
            </Routes>
          </Suspense>
          <Notice />
        </MemoryRouter>
      </Provider>,
    ),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: "곡 추가" });
  await user.click(trigger);
  const url = await screen.findByLabelText("영상 URL");
  expect(url).toHaveFocus();
  await user.type(url, "https://youtu.be/abcdefghijk");
  await user.type(screen.getByLabelText("곡 이름 (선택)"), "직접 입력");
  let reject!: (error: Error) => void;
  const write = vi.spyOn(api, "updatePlaylist").mockImplementationOnce(
    () =>
      new Promise((_resolve, no) => {
        reject = no;
      }),
  );
  const form = screen.getByRole("button", { name: "추가" }).closest("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(write).toHaveBeenCalledOnce());
  expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await act(async () => reject(new Error("추가 저장 실패")));
  expect(screen.getByRole("alert")).toHaveTextContent("추가 저장 실패");
  expect(url).toHaveValue("https://youtu.be/abcdefghijk");
  await user.click(screen.getByRole("button", { name: "추가" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(write).toHaveBeenCalledTimes(2);
  expect(await api.getPlaylistItems(id)).toHaveLength(1);
  expect(store.get(queueState)).toEqual(queue);
  write.mockRestore();
});
