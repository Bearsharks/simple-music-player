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
import { MemoryRouter } from "react-router-dom";
import Breadcrumb from "features/navigation/ui/Breadcrumb";
import LibraryBackup from "features/playlists/ui/LibraryBackup";
import {
  playlistIDsState,
  playlistInfosState,
  playlistInfoStateFamily,
} from "features/playlists/model/playlistAtoms";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
const info = {
  id: "",
  name: "저장 이름",
  description: "",
  thumbnails: [],
  itemCount: 0,
};
beforeEach(resetDatabase);
afterEach(() => vi.restoreAllMocks());
it("shows only real hierarchy and subscribes to saved metadata without remounting its sibling", async () => {
  const id = await api.createPlaylist(info, []);
  const store = createStore();
  await store.get(playlistInfosState);
  const view = await act(async () =>
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/playlist/${id}`]}>
          <Breadcrumb />
          <iframe title="stable player" />
        </MemoryRouter>
      </Provider>,
    ),
  );
  const iframe = screen.getByTitle("stable player");
  const nav = screen.getByRole("navigation", { name: "현재 위치" });
  expect(await within(nav).findByText("저장 이름")).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(within(nav).getByRole("link", { name: "라이브러리" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(screen.queryByText("내 음악")).not.toBeInTheDocument();
  const saved = await store.get(playlistInfoStateFamily(id));
  act(() =>
    store.set(playlistInfoStateFamily(id), {
      ...saved,
      name: "바뀐 실제 이름",
    }),
  );
  expect(within(nav).getByText("바뀐 실제 이름")).toHaveAttribute(
    "title",
    "바뀐 실제 이름",
  );
  act(() => store.set(playlistIDsState, []));
  expect(await within(nav).findByText("목록 없음")).toBeInTheDocument();
  expect(screen.getByTitle("stable player")).toBe(iframe);
  view.unmount();
});
it("keeps the library link usable during a failed metadata read", async () => {
  const store = createStore();
  store.set(playlistIDsState, ["broken"]);
  store.set(
    playlistInfoStateFamily("broken"),
    Promise.reject(new Error("read failed")),
  );
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await act(async () =>
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/playlist/broken"]}>
          <Breadcrumb />
        </MemoryRouter>
      </Provider>,
    ),
  );
  expect(await screen.findByText("불러오기 실패")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "라이브러리" })).toBeInTheDocument();
  error.mockRestore();
});
it("keeps the file input mounted after menu closes and preserves data on cancel or validation failure", async () => {
  const user = userEvent.setup();
  const store = createStore();
  await store.get(playlistInfosState);
  render(
    <Provider store={store}>
      <LibraryBackup />
    </Provider>,
  );
  const trigger = screen.getByRole("button", { name: "라이브러리 더보기" });
  expect(
    screen.queryByRole("button", { name: "목록 내보내기" }),
  ).not.toBeInTheDocument();
  await user.click(trigger);
  const input = screen.getByLabelText("재생목록 백업 파일");
  const nativeClick = vi.spyOn(input, "click");
  await user.click(screen.getByRole("menuitem", { name: "백업 가져오기" }));
  expect(nativeClick).toHaveBeenCalledOnce();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(screen.getByLabelText("재생목록 백업 파일")).toBe(input);
  fireEvent.change(input, {
    target: {
      files: [
        {
          size: 100,
          text: async () =>
            JSON.stringify({
              format: "smp-playlists",
              version: 1,
              playlists: [{ info, items: [] }],
            }),
        },
      ],
    },
  });
  const dialog = await screen.findByRole("dialog", { name: "백업 가져오기" });
  await user.click(within(dialog).getByRole("button", { name: "취소" }));
  expect(await api.getPlaylistInfos()).toEqual([]);
  expect(trigger).toHaveFocus();
  fireEvent.change(input, {
    target: { files: [{ size: 100, text: async () => "invalid" }] },
  });
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.change(input, {
    target: {
      files: [
        {
          size: 100,
          text: async () =>
            JSON.stringify({
              format: "smp-playlists",
              version: 1,
              playlists: [{ info, items: [] }],
            }),
        },
      ],
    },
  });
  await screen.findByRole("dialog");
  await user.click(screen.getByRole("button", { name: "가져오기" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(await api.getPlaylistInfos()).toMatchObject([{ name: "저장 이름" }]);
  expect(trigger).toHaveFocus();
});
