import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import Dialog from "shared/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "shared/ui/shadcn/select";
import { useOpenPlaylistItemOptionsPopup } from "features/overlays/PopupStates";
import Popup from "features/overlays/Popup";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
import {
  playlistInfosState,
  playlistItemStateFamily,
} from "features/playlists/model/playlistAtoms";

it("keeps a Radix select inside its native-dialog scope and gives each Escape one owner", async () => {
  function Example() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("recent");
    return (
      <>
        <button onClick={() => setOpen(true)}>폼 열기</button>
        {open && (
          <Dialog label="정렬 테스트" onClose={() => setOpen(false)}>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger aria-label="정렬">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">최근순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
              </SelectContent>
            </Select>
          </Dialog>
        )}
      </>
    );
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "폼 열기" }));
  const trigger = screen.getByRole("combobox", { name: "정렬" });
  await user.keyboard("{Enter}");
  const options = await screen.findByRole("listbox");
  expect(options.closest("dialog")).toBe(screen.getByRole("dialog"));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "폼 열기" })).toHaveFocus();
  expect(document.body.style.overflow).not.toBe("hidden");
});

it("keeps an async menu failure retryable while its error toast is dismissed", async () => {
  await resetDatabase();
  const id = await api.createPlaylist(
    { id: "", name: "목록", description: "", thumbnails: [], itemCount: 1 },
    [
      {
        name: "곡",
        videoID: "abcdefghijk",
        query: "",
        owner: "",
        thumbnail: "",
      },
    ],
  );
  const store = createStore();
  await store.get(playlistInfosState);
  const items = await store.get(playlistItemStateFamily(id));
  function Example() {
    const open = useOpenPlaylistItemOptionsPopup();
    return (
      <>
        <button onClick={(event) => open(event.currentTarget, id, items)}>
          목록 메뉴
        </button>
        <Popup />
      </>
    );
  }
  const write = vi
    .spyOn(api, "updatePlaylist")
    .mockRejectedValueOnce(new Error("메뉴 저장 실패"));
  const user = userEvent.setup();
  await act(async () =>
    render(
      <Provider store={store}>
        <Example />
      </Provider>,
    ),
  );
  await user.click(screen.getByRole("button", { name: "목록 메뉴" }));
  await user.click(screen.getByRole("menuitem", { name: "재생목록에서 삭제" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("메뉴 저장 실패");
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "오류 알림 닫기" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.click(screen.getByRole("menuitem", { name: "재생목록에서 삭제" }));
  await waitFor(() =>
    expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
  );
  expect(write).toHaveBeenCalledTimes(2);
  write.mockRestore();
});
