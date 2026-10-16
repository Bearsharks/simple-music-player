import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Playlists from "features/playlists/ui/playlists/Playlists";
const info = (id: string, name: string) => ({
  id,
  name,
  description: "",
  thumbnails: [],
  itemCount: 2,
});
it("filters real library entries without network search and opens the selected playlist", () => {
  const open = vi.fn();
  render(
    <Playlists
      playlistInfos={[info("a", "밤의 음악"), info("b", "집중 음악")]}
      goToPlaylistPage={open}
      playPlaylist={vi.fn()}
      openCreatePlaylistPopup={vi.fn()}
      openOptionsSelector={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "라이브러리 검색" }), {
    target: { value: "집중" },
  });
  expect(
    screen.queryByRole("button", { name: "밤의 음악 열기" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "집중 음악 열기" }));
  expect(open).toHaveBeenCalledWith("b");
  fireEvent.change(screen.getByRole("textbox", { name: "라이브러리 검색" }), {
    target: { value: "없는 목록" },
  });
  expect(
    screen.getByRole("button", { name: "검색 지우기" }),
  ).toBeInTheDocument();
});
it("keeps create and play actions separate from navigation", () => {
  const open = vi.fn(),
    play = vi.fn(),
    create = vi.fn();
  render(
    <Playlists
      playlistInfos={[info("a", "밤의 음악")]}
      goToPlaylistPage={open}
      playPlaylist={play}
      openCreatePlaylistPopup={create}
      openOptionsSelector={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "밤의 음악 재생" }));
  expect(play).toHaveBeenCalledWith("a");
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "새 재생목록" }));
  expect(create).toHaveBeenCalledOnce();
});
