import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { useState } from "react";
import { vi } from "vitest";
import Dialog from "shared/ui/Dialog";
import Cover, { coverSeed } from "shared/ui/Cover";
import ReadBoundary from "shared/ui/ReadBoundary";
import {
  queueState,
  useMusicListManager,
  useCurMusicManager,
} from "features/queue/model/queue";
import openState, {
  revealQueueOnFirstPlay,
} from "features/queue/model/musiclistOpenState";
import {
  MusicListActionType as T,
  MusicInfoActionType,
  PlayerState,
} from "shared/model/constants";
import { playbackStatus } from "features/player/model/playback";
import MusicPlayer from "features/player/pages/MusicPlayer";
import Popup from "features/overlays/Popup";
import Modal from "features/overlays/Modal";
import Notice from "features/overlays/Notice";
import ProgressBar from "features/player/ui/ProgressBar";

const media = vi.hoisted(() => ({
  constructed: 0,
  destroyed: 0,
  loads: [] as string[],
  config: null as any,
}));
vi.mock("features/player/api/iframe", () => ({
  loadIframeApi: async () => ({
    Player: class {
      config: any;
      state = 0;
      constructor(host: HTMLElement, config: any) {
        this.config = config;
        media.config = config;
        media.constructed++;
        host.replaceWith(
          Object.assign(document.createElement("iframe"), {
            title: "Simulated official player",
          }),
        );
        queueMicrotask(() => config.events.onReady());
      }
      destroy() {
        media.destroyed++;
      }
      stopVideo() {
        this.state = 0;
      }
      loadVideoById(value: any) {
        media.loads.push(value.videoId);
        this.playVideo();
      }
      playVideo() {
        this.state = 1;
        this.config.events.onStateChange({ data: 1 });
      }
      pauseVideo() {
        this.state = 2;
        this.config.events.onStateChange({ data: 2 });
      }
      getPlayerState() {
        return this.state;
      }
      getCurrentTime() {
        return 0;
      }
      getDuration() {
        return 180;
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
const song = (key: string) => ({
  key,
  name: `곡 ${key}`,
  videoID: key.padEnd(11, "a"),
  thumbnail: "",
  owner: "",
  query: "",
});
afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).player;
});

it("uses stable ID artwork, unique SVG IDs and a wave fallback after thumbnail failure", () => {
  const { container } = render(
    <>
      <Cover id="stable" thumbnail="https://example.com/a.jpg" />
      <Cover id="stable" />
    </>,
  );
  const covers = container.querySelectorAll("[data-cover-seed]");
  expect(covers[0].getAttribute("data-cover-seed")).toBe(
    String(coverSeed("stable")),
  );
  expect(covers[1].getAttribute("data-cover-seed")).toBe(
    covers[0].getAttribute("data-cover-seed"),
  );
  const ids = [...container.querySelectorAll("linearGradient")].map(
    (value) => value.id,
  );
  expect(new Set(ids).size).toBe(ids.length);
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelectorAll("svg")).toHaveLength(2);
});
it("shows read failure distinctly from an empty library and retries without clearing data", () => {
  let broken = true;
  const retry = vi.fn(() => {
    broken = false;
  });
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  function Data() {
    if (broken) throw new Error("read denied");
    return <p>보존된 목록</p>;
  }
  render(
    <ReadBoundary onRetry={retry}>
      <Data />
    </ReadBoundary>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "목록을 삭제하지 않았습니다",
  );
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(screen.getByText("보존된 목록")).toBeInTheDocument();
  expect(retry).toHaveBeenCalledOnce();
  error.mockRestore();
});
it("reveals only once and keeps later playback from overriding explicit dismissal", () => {
  const store = createStore();
  vi.stubGlobal("innerWidth", 1440);
  store.set(revealQueueOnFirstPlay);
  expect(store.get(openState)).toBe(true);
  store.set(openState, false);
  store.set(revealQueueOnFirstPlay);
  expect(store.get(openState)).toBe(false);
  vi.unstubAllGlobals();
});
it("does not automatically open a modal player at narrow widths", () => {
  const store = createStore();
  vi.stubGlobal("innerWidth", 390);
  store.set(revealQueueOnFirstPlay);
  expect(store.get(openState)).toBe(false);
  vi.unstubAllGlobals();
});
it("restores queue deletion around subsequent append/reorder while preserving the current song identity", async () => {
  const store = createStore();
  const original = [song("a"), song("b"), song("c")];
  store.set(queueState, { items: original, index: 1 });
  const { result } = renderHook(() => useMusicListManager(), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
  const undo = await result.current({ type: T.DELETE, payload: [original[0]] });
  await result.current({ type: T.APPEND_ITEMS, payload: [song("d")] });
  await result.current({ type: T.CHANGE_ORDER, payload: { from: 2, to: 0 } });
  await undo?.undo();
  await undo?.undo();
  const queue = store.get(queueState);
  expect(queue.items.map((item) => item.name)).toEqual([
    "곡 d",
    "곡 a",
    "곡 b",
    "곡 c",
  ]);
  expect(queue.items[queue.index].key).toBe("b");
});
it("invalidates queue Undo after clear or replacement and keeps a valid index after current/last deletion", async () => {
  const store = createStore();
  const original = [song("a"), song("b")];
  store.set(queueState, { items: original, index: 1 });
  const { result } = renderHook(
    () => ({ list: useMusicListManager(), current: useCurMusicManager() }),
    {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    },
  );
  const undo = await result.current.list({
    type: T.DELETE,
    payload: [original[1]],
  });
  expect(store.get(queueState).index).toBe(0);
  await result.current.current({
    type: MusicInfoActionType.SET,
    payload: { list: [song("c")], idx: 0 },
  });
  await expect(undo?.undo()).rejects.toThrow("교체되거나");
  const second = await result.current.list({
    type: T.DELETE,
    payload: store.get(queueState).items,
  });
  expect(store.get(queueState)).toEqual({ items: [], index: 0 });
  await result.current.list({ type: T.CLEAR });
  await expect(second?.undo()).rejects.toThrow("비워져");
});
it("keeps media DOM stable while modal nesting and responsive mode changes restore locks correctly", async () => {
  function Example() {
    const [open, setOpen] = useState(false);
    const [narrow, setNarrow] = useState(true);
    const [child, setChild] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>플레이어 열기</button>
        <button onClick={() => setNarrow((value) => !value)}>폭 변경</button>
        <Dialog
          open={open}
          modal={narrow}
          priority={0}
          label="플레이어"
          onClose={() => setOpen(false)}
        >
          <div data-testid="media-host" />
          <button onClick={() => setChild(true)}>저장 대상</button>
          <button onClick={() => setOpen(false)}>큐 닫기</button>
        </Dialog>
        {child && (
          <Dialog label="저장 확인" onClose={() => setChild(false)}>
            <button onClick={() => setNarrow((value) => !value)}>
              넓이 전환
            </button>
            <button onClick={() => setChild(false)}>작업 닫기</button>
          </Dialog>
        )}
      </>
    );
  }
  const user = userEvent.setup();
  const { container } = render(<Example />);
  const original = screen.getByTestId("media-host");
  const overflow = document.body.style.overflow;
  await user.click(screen.getByRole("button", { name: "플레이어 열기" }));
  await user.click(screen.getByRole("button", { name: "저장 대상" }));
  await user.click(screen.getByRole("button", { name: "넓이 전환" }));
  expect(container).toHaveAttribute("inert");
  expect(document.body.style.overflow).toBe("hidden");
  await user.click(screen.getByRole("button", { name: "넓이 전환" }));
  expect(screen.getByRole("dialog", { name: "저장 확인" })).toContainElement(
    document.activeElement as HTMLElement,
  );
  await user.click(screen.getByRole("button", { name: "작업 닫기" }));
  expect(container).toHaveAttribute("inert");
  await user.keyboard("{Escape}");
  expect(container).not.toHaveAttribute("inert");
  expect(document.body.style.overflow).toBe(overflow);
  expect(screen.getByTestId("media-host")).toBe(original);
});
it("renders mobile mini progress as display-only and labels unknown duration without a fabricated length", () => {
  const { rerender } = render(
    <ProgressBar
      progress={{ duration: 0, currentTime: 0 }}
      setProgress={vi.fn()}
      readOnly
    />,
  );
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  rerender(
    <ProgressBar
      progress={{ duration: 0, currentTime: 0 }}
      setProgress={vi.fn()}
    />,
  );
  expect(screen.getByText("—")).toBeInTheDocument();
  expect(screen.getByRole("slider")).toBeDisabled();
});
it("distinguishes actual player states, including restricted video errors", () => {
  expect(playbackStatus(PlayerState.PLAYING, true, "", true)).toBe("재생 중");
  expect(playbackStatus(PlayerState.PAUSED, true, "", true)).toBe("일시 정지");
  expect(playbackStatus(PlayerState.BUFFERING, true, "", true)).toBe(
    "불러오는 중",
  );
  expect(playbackStatus(PlayerState.ENDED, true, "", true)).toBe("재생 완료");
  expect(playbackStatus(PlayerState.PLAYING, true, "restricted", true)).toBe(
    "재생 오류",
  );
});
it("keeps the simulated official player instance through tabs, close/reopen, resize, and queue reorder", async () => {
  const store = createStore();
  store.set(queueState, { items: [song("a"), song("b")], index: 0 });
  store.set(openState, true);
  media.constructed = 0;
  media.destroyed = 0;
  media.loads = [];
  vi.stubGlobal("innerWidth", 390);
  await act(async () =>
    render(
      <Provider store={store}>
        <MusicPlayer />
        <Popup />
        <Modal />
        <Notice />
      </Provider>,
    ),
  );
  await waitFor(() => expect(media.loads).toHaveLength(1));
  const frame = screen.getByTitle("Simulated official player");
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "현재 곡" }));
  expect(screen.getByRole("tab", { name: "현재 곡" })).toHaveAttribute(
    "tabindex",
    "0",
  );
  await user.keyboard("{End}");
  expect(screen.getByRole("tab", { name: "대기열 (2)" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "곡 a 더보기" }));
  expect(
    screen.getByRole("group", { name: "선택 메뉴" }).closest("dialog"),
  ).not.toBeNull();
  await user.keyboard("{Escape}");
  expect(
    screen.queryByRole("group", { name: "선택 메뉴" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("dialog", { name: "지금 재생 및 대기열" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "곡 a 더보기" }));
  await user.click(screen.getByRole("button", { name: "목록에서 삭제" }));
  await user.click(await screen.findByRole("button", { name: "실행 취소" }));
  await user.click(screen.getByRole("button", { name: "대기열 순서 편집" }));
  await user.click(screen.getByRole("button", { name: "곡 b 위로" }));
  await user.click(screen.getByRole("button", { name: "대기열 닫기" }));
  await user.click(screen.getByRole("button", { name: "재생 대기열" }));
  await act(async () => {
    vi.stubGlobal("innerWidth", 1440);
    fireEvent(window, new Event("resize"));
  });
  expect(
    screen.getByRole("complementary", { name: "지금 재생 및 대기열" }),
  ).toBeInTheDocument();
  expect(screen.getByTitle("Simulated official player")).toBe(frame);
  expect(media.constructed).toBe(1);
  expect(media.destroyed).toBe(0);
  vi.unstubAllGlobals();
});
