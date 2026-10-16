import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
import Popup from "features/overlays/Popup";
import Notice from "features/overlays/Notice";
import { useOpenSelectTgtPlaylistPopup } from "features/overlays/PopupStates";
import {
  playlistInfosState,
  usePlaylistManager,
} from "features/playlists/model/playlistAtoms";
import { queueState } from "features/queue/model/queue";
import { PlaylistActionType } from "shared/model/constants";
const song = {
  key: "playing",
  name: "추가할 곡",
  videoID: "abcdefghijk",
  query: "",
  owner: "",
  thumbnail: "",
};
const info = {
  id: "",
  name: "기존 목록",
  description: "기존 설명",
  itemCount: 0,
  thumbnails: [],
};
let manager: ReturnType<typeof usePlaylistManager>;
function Harness() {
  const open = useOpenSelectTgtPlaylistPopup();
  manager = usePlaylistManager();
  return (
    <>
      <button onClick={(event) => open(event.currentTarget, [song])}>
        담기
      </button>
      <Popup />
      <Notice />
    </>
  );
}
async function setup() {
  const store = createStore();
  await store.get(playlistInfosState);
  store.set(queueState, { items: [song], index: 0 });
  await act(async () =>
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    ),
  );
  const user = userEvent.setup();
  await act(async () => {
    await user.click(screen.getByRole("button", { name: "담기" }));
  });
  await screen.findByRole("button", { name: "새 재생목록 만들기" });
  return { store, user };
}
beforeEach(resetDatabase);
afterEach(() => vi.restoreAllMocks());

it("keeps destination drafts, appends against latest items and writes edited metadata atomically", async () => {
  const id = await api.createPlaylist(info, [song]);
  const other = await api.createPlaylist({ ...info, name: "다른 목록" }, []);
  const { store, user } = await setup();
  expect(screen.queryByLabelText("이름")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "수정하고 추가" })).toBeDisabled();
  const card = screen.getByRole("button", { name: "기존 목록 선택" });
  await user.click(card);
  expect(card).toHaveFocus();
  await user.clear(screen.getByLabelText("이름"));
  await user.type(screen.getByLabelText("이름"), "바꾼 이름");
  await user.clear(screen.getByLabelText("설명 (선택)"));
  await user.type(screen.getByLabelText("설명 (선택)"), "바꾼 설명");
  await user.click(screen.getByRole("button", { name: "다른 목록 선택" }));
  expect(screen.getByLabelText("이름")).toHaveValue("다른 목록");
  await user.click(card);
  expect(screen.getByLabelText("이름")).toHaveValue("바꾼 이름");
  const concurrent = { ...song, videoID: "lmnopqrstuv", key: "concurrent" };
  await act(async () => {
    await manager({
      type: PlaylistActionType.APPEND,
      payload: { info: { id }, items: [concurrent] },
    });
  });
  const write = vi.spyOn(api, "updatePlaylist");
  await user.click(screen.getByRole("button", { name: "수정하고 추가" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(write).toHaveBeenCalledOnce();
  expect(await api.getPlaylistInfo(id)).toMatchObject({
    name: "바꾼 이름",
    description: "바꾼 설명",
    itemCount: 3,
  });
  expect((await api.getPlaylistItems(id)).map((item) => item.videoID)).toEqual([
    song.videoID,
    concurrent.videoID,
    song.videoID,
  ]);
  expect(await api.getPlaylistItems(other)).toEqual([]);
  expect(store.get(queueState)).toEqual({ items: [song], index: 0 });
});

it("creates with all tracks once, locks duplicate submits and preserves drafts across failure", async () => {
  const { user } = await setup();
  expect(screen.getByLabelText("이름")).toHaveFocus();
  expect(screen.getByLabelText("이름")).toHaveValue("새 재생목록");
  await user.clear(screen.getByLabelText("이름"));
  expect(screen.getByRole("button", { name: "만들고 추가" })).toBeDisabled();
  await user.type(screen.getByLabelText("이름"), "새로 저장");
  await user.type(screen.getByLabelText("설명 (선택)"), "설명 보존");
  let reject!: (error: Error) => void;
  const create = vi.spyOn(api, "createPlaylist").mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  const form = screen
    .getByRole("button", { name: "만들고 추가" })
    .closest("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(create).toHaveBeenCalledOnce());
  expect(screen.getByLabelText("이름")).toBeDisabled();
  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await act(async () => reject(new Error("저장 공간 부족")));
  expect(screen.getByRole("alert")).toHaveTextContent("저장 공간 부족");
  expect(screen.getByLabelText("이름")).toHaveValue("새로 저장");
  expect(screen.getByLabelText("설명 (선택)")).toHaveValue("설명 보존");
  expect(await api.getPlaylistInfos()).toEqual([]);
  await user.click(screen.getByRole("button", { name: "만들고 추가" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(create).toHaveBeenCalledTimes(2);
  expect(create.mock.calls[1][1]).toEqual([song]);
  expect(await api.getPlaylistInfos()).toMatchObject([
    { name: "새로 저장", description: "설명 보존", itemCount: 1 },
  ]);
});

it("preserves legacy long metadata and cancels dirty drafts without writes", async () => {
  const name = "긴".repeat(140),
    description = "설".repeat(1200);
  const id = await api.createPlaylist({ ...info, name, description }, []);
  const { user } = await setup();
  await user.click(screen.getByRole("button", { name: `${name} 선택` }));
  expect(screen.getByLabelText("이름")).toHaveValue(name);
  expect(screen.getByLabelText("설명 (선택)")).toHaveValue(description);
  await user.click(screen.getByRole("button", { name: "수정하고 추가" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(await api.getPlaylistInfo(id)).toMatchObject({
    name,
    description,
    itemCount: 1,
  });
  await act(async () => {
    await user.click(screen.getByRole("button", { name: "담기" }));
  });
  await user.click(
    await screen.findByRole("button", { name: "새 재생목록 만들기" }),
  );
  await user.clear(screen.getByLabelText("이름"));
  await user.type(screen.getByLabelText("이름"), "저장하지 않음");
  await user.click(screen.getByRole("button", { name: "취소" }));
  expect(await api.getPlaylistInfos()).toHaveLength(1);
  expect(await api.getPlaylistItems(id)).toHaveLength(1);
});
