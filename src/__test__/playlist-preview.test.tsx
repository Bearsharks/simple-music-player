vi.mock("features/youtube/api/playlistMetadata", () => ({
  fetchPlaylistMetadata: async () => ({}),
}));
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "jotai";
import { StrictMode } from "react";
import PlaylistImport from "features/youtube/ui/PlaylistImport";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";

const preview = vi.hoisted(() => ({
  instances: [] as any[],
  resolve: null as null | ((value: any) => void),
  delayed: false,
}));
vi.mock("features/youtube/api/videoMetadata", async (original) => ({
  ...(await original<typeof import("features/youtube/api/videoMetadata")>()),
  fetchVideoTitles: async () => ({}),
}));
vi.mock("features/player/api/iframe", () => {
  const YT = {
    Player: class {
      values: string[] = [];
      destroy = vi.fn();
      config: any;
      constructor(_host: HTMLElement, config: any) {
        this.config = config;
        preview.instances.push(this);
      }
      getPlaylist() {
        return this.values;
      }
    },
  };
  return {
    loadIframeApi: () =>
      preview.delayed
        ? new Promise((resolve) => {
            preview.resolve = () => resolve(YT);
          })
        : Promise.resolve(YT),
  };
});
const url = (id = "PLtest123") => `https://youtube.com/playlist?list=${id}`;
const input = () => screen.getByLabelText("YouTube 재생목록 URL (선택)");
const submit = () => screen.getByRole("button", { name: "만들기" });
async function load(id = "PLtest123") {
  fireEvent.change(screen.getByLabelText(/^이름/), {
    target: { value: "검수 목록" },
  });
  fireEvent.change(input(), { target: { value: url(id) } });
  fireEvent.blur(input());
  await waitFor(() => expect(preview.instances.length).toBeGreaterThan(0));
  return preview.instances.at(-1);
}
async function ready(player: any, values = ["abcdefghijk"]) {
  await act(async () => {
    player.values = values;
    player.config.events.onReady();
  });
}
beforeEach(async () => {
  preview.instances = [];
  preview.delayed = false;
  preview.resolve = null;
  await resetDatabase();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("loads only on blur/URL Enter, reuses an untouched request, and never submits URL Enter", async () => {
  const close = vi.fn();
  render(
    <Provider>
      <StrictMode>
        <PlaylistImport close={close} />
      </StrictMode>
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText(/^이름/), {
    target: { value: "검수 목록" },
  });
  fireEvent.change(input(), { target: { value: url() } });
  expect(preview.instances).toHaveLength(0);
  expect(submit()).toBeDisabled();
  fireEvent.keyDown(input(), { key: "Enter", isComposing: true });
  expect(preview.instances).toHaveLength(0);
  fireEvent.keyDown(input(), { key: "Enter" });
  await waitFor(() => expect(preview.instances).toHaveLength(1));
  fireEvent.blur(input());
  fireEvent.keyDown(input(), { key: "Enter" });
  await ready(preview.instances[0]);
  expect(submit()).toBeEnabled();
  fireEvent.keyDown(input(), { key: "Enter" });
  fireEvent.blur(input());
  expect(preview.instances).toHaveLength(1);
  expect(await api.getPlaylistInfos()).toEqual([]);
  expect(close).not.toHaveBeenCalled();
});

it("loads and saves a mix through the same iframe preview without a type blacklist",async()=>{
  render(<Provider><PlaylistImport close={()=>{}}/></Provider>);
  const player=await load("RDazNG-AU0eGg");
  expect(player.config.playerVars.list).toBe("RDazNG-AU0eGg");
  await ready(player,["azNG-AU0eGg","hWhgrA2dhrk"]);
  fireEvent.click(submit());
  await waitFor(async()=>expect(await api.getPlaylistInfos()).toHaveLength(1));
  const [info]=await api.getPlaylistInfos();
  expect((await api.getPlaylistItems(info.id)).map(item=>item.videoID)).toEqual(["azNG-AU0eGg","hWhgrA2dhrk"]);
});

it("invalidates immediately on change and ignores old results, including returning to the original URL", async () => {
  render(
    <Provider>
      <PlaylistImport close={() => {}} />
    </Provider>,
  );
  const first = await load();
  await ready(first);
  expect(submit()).toBeEnabled();
  fireEvent.change(input(), { target: { value: url("PLother456") } });
  expect(submit()).toBeDisabled();
  expect(first.destroy).toHaveBeenCalledOnce();
  await ready(first, ["lmnopqrstuv"]);
  expect(submit()).toBeDisabled();
  fireEvent.change(input(), { target: { value: url() } });
  fireEvent.blur(input());
  await waitFor(() => expect(preview.instances).toHaveLength(2));
  const second = preview.instances[1];
  await ready(second, ["zzzzzzzzzzz"]);
  await ready(first, ["lmnopqrstuv"]);
  fireEvent.click(submit());
  await waitFor(async () =>
    expect(await api.getPlaylistInfos()).toHaveLength(1),
  );
  const [list] = await api.getPlaylistInfos();
  expect(
    (await api.getPlaylistItems(list.id)).map((item) => item.videoID),
  ).toEqual(["zzzzzzzzzzz"]);
});

it("keeps failures terminal, rejects invalid IDs and retries only explicitly", async () => {
  render(
    <Provider>
      <PlaylistImport close={() => {}} />
    </Provider>,
  );
  const first = await load();
  await ready(first, ["invalid"]);
  expect(await screen.findByRole("alert")).toHaveTextContent("곡 ID");
  expect(submit()).toBeDisabled();
  await ready(first);
  fireEvent.blur(input());
  fireEvent.keyDown(input(), { key: "Enter" });
  expect(preview.instances).toHaveLength(1);
  expect(submit()).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  await waitFor(() => expect(preview.instances).toHaveLength(2));
  expect(first.destroy).toHaveBeenCalledOnce();
  await ready(preview.instances[1]);
  expect(submit()).toBeEnabled();
});

it("cleans up on unmount and never constructs a late API result after timeout", async () => {
  vi.useFakeTimers();
  preview.delayed = true;
  const view = render(
    <Provider>
      <PlaylistImport close={() => {}} />
    </Provider>,
  );
  fireEvent.change(input(), { target: { value: url() } });
  fireEvent.blur(input());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(screen.getByRole("alert")).toHaveTextContent("불러오지 못했습니다");
  await act(async () => {
    preview.resolve?.({});
  });
  expect(preview.instances).toHaveLength(0);
  preview.delayed = false;
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  await act(async () => {});
  const player = preview.instances[0];
  await ready(player);
  view.unmount();
  expect(player.destroy).toHaveBeenCalledOnce();
  await ready(player);
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps blank blur quiet and links invalid URL errors without requesting a player", () => {
  render(
    <Provider>
      <PlaylistImport close={() => {}} />
    </Provider>,
  );
  fireEvent.blur(input());
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.change(input(), {
    target: { value: "https://evil.test/playlist?list=PLtest123" },
  });
  fireEvent.blur(input());
  expect(input()).toHaveAttribute("aria-invalid", "true");
  expect(
    document.getElementById(input().getAttribute("aria-errormessage")!),
  ).toHaveTextContent(screen.getByRole("alert").textContent!);
  expect(preview.instances).toHaveLength(0);
});
