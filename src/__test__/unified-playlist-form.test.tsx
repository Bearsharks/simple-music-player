import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "jotai";
import PlaylistImport from "features/youtube/ui/PlaylistImport";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
const mocks = vi.hoisted(() => ({ metadata: vi.fn(), instances: [] as any[] }));
vi.mock("features/youtube/api/playlistMetadata", () => ({
  fetchPlaylistMetadata: mocks.metadata,
}));
vi.mock("features/youtube/api/videoMetadata", () => ({
  fetchVideoTitles: async () => ({}),
}));
vi.mock("features/player/api/iframe", () => ({
  loadIframeApi: async () => ({
    Player: class {
      config: any;
      destroy = vi.fn();
      constructor(_host: HTMLElement, config: any) {
        this.config = config;
        mocks.instances.push(this);
        queueMicrotask(() => config.events.onReady());
      }
      getPlaylist() {
        return ["abcdefghijk", "lmnopqrstuv"];
      }
    },
  }),
}));
const urlInput = () => screen.getByLabelText("YouTube 재생목록 URL (선택)");
const nameInput = () => screen.getByRole("textbox", { name: "이름" });
const descriptionInput = () => screen.getByLabelText("설명");
const submit = () => screen.getByRole("button", { name: "만들기" });
const change = (node: HTMLElement, value: string) =>
  fireEvent.change(node, { target: { value } });
const url = (id = "PLtest123") => `https://youtube.com/playlist?list=${id}`;
async function load(id = "PLtest123") {
  change(urlInput(), url(id));
  fireEvent.blur(urlInput());
  await screen.findByText("2곡");
}
function mount(
  props: Partial<React.ComponentProps<typeof PlaylistImport>> = {},
) {
  return render(
    <Provider>
      <PlaylistImport close={() => {}} {...props} />
    </Provider>,
  );
}
beforeEach(async () => {
  await resetDatabase();
  mocks.instances = [];
  mocks.metadata.mockReset().mockResolvedValue({});
});
afterEach(() => vi.restoreAllMocks());

it("creates a local list from the one form with only a required name and no source snapshot", async () => {
  const created = vi.fn();
  mount({ onCreated: created });
  expect(urlInput()).not.toBeRequired();
  expect(nameInput()).toBeRequired();
  expect(nameInput()).toHaveAttribute("aria-required", "true");
  expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  expect(submit()).toBeDisabled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.blur(nameInput());
  expect(screen.getByRole("alert")).toHaveTextContent("이름을 입력해 주세요.");
  change(nameInput(), "  로컬 목록  ");
  change(descriptionInput(), "  내 설명  ");
  fireEvent.click(submit());
  await waitFor(() => expect(created).toHaveBeenCalledOnce());
  const [info] = await api.getPlaylistInfos();
  expect(info).toMatchObject({
    name: "로컬 목록",
    description: "내 설명",
    itemCount: 0,
  });
  expect(info.sourcePlaylistUrl).toBeUndefined();
  expect(await api.getInitialSnapshot(info.id)).toBeUndefined();
  expect(created).toHaveBeenCalledWith(info.id, "empty");
  expect(mocks.metadata).not.toHaveBeenCalled();
});

it("fills only untouched empty fields and never replaces a user's intentional deletion", async () => {
  let resolve!: (value: unknown) => void;
  mocks.metadata.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  mount();
  await load();
  change(nameInput(), "내 이름");
  change(nameInput(), "");
  change(descriptionInput(), "직접 쓴 설명");
  await act(async () => resolve({ name: "실제 목록 이름" }));
  expect(nameInput()).toHaveValue("");
  expect(descriptionInput()).toHaveValue("직접 쓴 설명");
  expect(submit()).toBeDisabled();
  change(nameInput(), "사용자 이름");
  expect(submit()).toBeEnabled();
  change(urlInput(), "");
  expect(nameInput()).toHaveValue("사용자 이름");
  expect(descriptionInput()).toHaveValue("직접 쓴 설명");
});

it("clears only old automatic metadata on URL edits and never saves retired IDs after clearing the URL", async () => {
  mocks.metadata
    .mockResolvedValueOnce({ name: "원본 A" })
    .mockResolvedValueOnce({ name: "원본 B" });
  const created = vi.fn();
  mount({ onCreated: created });
  await load("PLfirst");
  await waitFor(() => expect(nameInput()).toHaveValue("원본 A"));
  expect(descriptionInput()).toHaveValue("");
  change(descriptionInput(), "내 설명");
  change(urlInput(), url("PLsecond"));
  expect(nameInput()).toHaveValue("");
  expect(descriptionInput()).toHaveValue("내 설명");
  expect(submit()).toBeDisabled();
  expect(mocks.instances[0].destroy).toHaveBeenCalledOnce();
  fireEvent.blur(urlInput());
  await waitFor(() => expect(nameInput()).toHaveValue("원본 B"));
  change(urlInput(), "");
  expect(nameInput()).toHaveValue("");
  change(nameInput(), "빈 로컬 목록");
  fireEvent.click(submit());
  await waitFor(() => expect(created).toHaveBeenCalledOnce());
  const [info] = await api.getPlaylistInfos();
  expect(info).toMatchObject({
    name: "빈 로컬 목록",
    description: "내 설명",
    itemCount: 0,
  });
  expect(info.sourcePlaylistUrl).toBeUndefined();
  expect(await api.getInitialSnapshot(info.id)).toBeUndefined();
  expect(await api.getPlaylistItems(info.id)).toEqual([]);
});

it("discards late metadata for an edited URL and aborts the retired request", async () => {
  let first!: (value: unknown) => void;
  mocks.metadata
    .mockReturnValueOnce(
      new Promise((resolve) => {
        first = resolve;
      }),
    )
    .mockResolvedValueOnce({ name: "현재 목록" });
  const view = mount();
  await load("PLfirst");
  const firstSignal = mocks.metadata.mock.calls[0][1] as AbortSignal;
  await load("PLsecond");
  await waitFor(() => expect(nameInput()).toHaveValue("현재 목록"));
  await act(async () => first({ name: "오래된 목록" }));
  expect(nameInput()).toHaveValue("현재 목록");
  expect(firstSignal.aborted).toBe(true);
  const secondSignal = mocks.metadata.mock.calls[1][1] as AbortSignal;
  view.unmount();
  expect(secondSignal.aborted).toBe(true);
});

it("blocks a nonempty invalid or unloaded URL instead of falling back to local creation", async () => {
  mount();
  change(nameInput(), "보존할 이름");
  change(urlInput(), "https://evil.test/?list=PLtest123");
  expect(submit()).toBeDisabled();
  fireEvent.blur(urlInput());
  fireEvent.submit(submit().closest("form")!);
  expect(urlInput()).toHaveAttribute("aria-invalid", "true");
  expect(await api.getPlaylistInfos()).toEqual([]);
  change(urlInput(), url());
  fireEvent.submit(submit().closest("form")!);
  expect(await api.getPlaylistInfos()).toEqual([]);
  change(urlInput(), "");
  expect(submit()).toBeEnabled();
});

it("never lets the first URL blur gesture become a save after immediate preview readiness", async () => {
  const close = vi.fn();
  mount({ close });
  change(nameInput(), "명시적으로 만들기");
  change(urlInput(), url());
  fireEvent.pointerDown(submit());
  fireEvent.blur(urlInput());
  await screen.findByText("2곡");
  fireEvent.click(submit(), { detail: 1 });
  expect(close).not.toHaveBeenCalled();
  expect(await api.getPlaylistInfos()).toEqual([]);
  fireEvent.pointerDown(submit());
  fireEvent.click(submit(), { detail: 1 });
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
});

it("keeps the existing initial-selection create contract when no URL is provided", async () => {
  const items = [
    {
      videoID: "abcdefghijk",
      name: "선택한 곡",
      owner: "",
      thumbnail: "",
      query: "",
    },
  ];
  const created = vi.fn();
  mount({ initialItems: items, onCreated: created });
  change(nameInput(), "선택곡 목록");
  fireEvent.click(submit());
  await waitFor(() => expect(created).toHaveBeenCalledOnce());
  const [info] = await api.getPlaylistInfos();
  expect(await api.getPlaylistItems(info.id)).toMatchObject(items);
  expect(await api.getInitialSnapshot(info.id)).toBeUndefined();
  expect(created).toHaveBeenCalledWith(info.id, "selection");
});

it("keeps invalid field descriptions after the visible error toast is dismissed", async () => {
  mount();
  fireEvent.blur(nameInput());
  const nameErrorID = nameInput().getAttribute("aria-errormessage")!;
  fireEvent.click(screen.getByRole("button", { name: "오류 알림 닫기" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(document.getElementById(nameErrorID)).toHaveTextContent(
    "이름을 입력해 주세요.",
  );
  expect(nameInput()).toHaveAttribute("aria-invalid", "true");
  change(nameInput(), "내 목록");
  expect(document.getElementById(nameErrorID)).not.toBeInTheDocument();
  change(urlInput(), "https://invalid.example/?list=PLtest123");
  fireEvent.blur(urlInput());
  const urlErrorID = urlInput().getAttribute("aria-errormessage")!;
  expect(urlErrorID).not.toBe(nameErrorID);
  fireEvent.click(screen.getByRole("button", { name: "오류 알림 닫기" }));
  expect(document.getElementById(urlErrorID)?.textContent).not.toBe("");
  expect(urlInput()).toHaveAttribute("aria-invalid", "true");
  change(urlInput(), "");
  expect(document.getElementById(urlErrorID)).not.toBeInTheDocument();
});

it("saves the verified playlist title and user description with one initial snapshot", async () => {
  mocks.metadata.mockResolvedValue({ name: "확인된 목록 제목" });
  const created = vi.fn();
  mount({ onCreated: created });
  await load();
  await waitFor(() => expect(nameInput()).toHaveValue("확인된 목록 제목"));
  expect(descriptionInput()).toHaveValue("");
  change(descriptionInput(), "사용자 설명");
  fireEvent.click(submit());
  await waitFor(() => expect(created).toHaveBeenCalledOnce());
  const [info] = await api.getPlaylistInfos();
  expect(info).toMatchObject({
    name: "확인된 목록 제목",
    description: "사용자 설명",
    itemCount: 2,
    sourcePlaylistUrl: "https://www.youtube.com/playlist?list=PLtest123",
  });
  expect(
    (await api.getInitialSnapshot(info.id))?.items.map((item) => item.videoID),
  ).toEqual(["abcdefghijk", "lmnopqrstuv"]);
  expect(created).toHaveBeenCalledWith(info.id, "import");
});

it("allows manual metadata when optional metadata is unavailable and URL Enter never submits", async () => {
  mount();
  change(nameInput(), "직접 입력");
  change(urlInput(), url());
  fireEvent.keyDown(urlInput(), { key: "Enter", isComposing: true });
  expect(mocks.metadata).not.toHaveBeenCalled();
  expect(submit()).toBeDisabled();
  fireEvent.keyDown(urlInput(), { key: "Enter" });
  await screen.findByText("2곡");
  expect(nameInput()).toHaveValue("직접 입력");
  expect(descriptionInput()).toHaveValue("");
  expect(submit()).toBeEnabled();
  expect(await api.getPlaylistInfos()).toEqual([]);
  change(urlInput(), "");
  fireEvent.keyDown(urlInput(), { key: "Enter" });
  expect(nameInput()).toHaveFocus();
  expect(await api.getPlaylistInfos()).toEqual([]);
});
