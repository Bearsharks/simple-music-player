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

it("sorts recent lists by persisted creation date and uses a stable fallback for legacy lists", () => {
  const props = {
    goToPlaylistPage: vi.fn(),
    playPlaylist: vi.fn(),
    openCreatePlaylistPopup: vi.fn(),
    openOptionsSelector: vi.fn(),
  };
  const lists = [
    { ...info("a", "Newer"), createdAt: 2000 },
    { ...info("z", "Older"), createdAt: 1000 },
    info("legacy-z", "Z legacy"),
    info("legacy-a", "A legacy"),
  ];
  const { rerender } = render(<Playlists {...props} playlistInfos={lists} />);
  const names = () =>
    screen
      .getAllByRole("button", { name: / 열기$/ })
      .map((button) => button.getAttribute("aria-label"));
  expect(names()).toEqual([
    "Newer 열기",
    "Older 열기",
    "A legacy 열기",
    "Z legacy 열기",
  ]);
  rerender(<Playlists {...props} playlistInfos={[...lists].reverse()} />);
  expect(names()).toEqual([
    "Newer 열기",
    "Older 열기",
    "A legacy 열기",
    "Z legacy 열기",
  ]);
  fireEvent.change(screen.getByRole("combobox", { name: "재생목록 정렬" }), {
    target: { value: "name" },
  });
  expect(names()).toEqual([
    "A legacy 열기",
    "Newer 열기",
    "Older 열기",
    "Z legacy 열기",
  ]);
});

it("offers add instead of playback for an empty card and preserves navigation", () => {
  const play = vi.fn(),
    open = vi.fn();
  render(
    <Playlists
      playlistInfos={[{ ...info("empty", "빈 목록"), itemCount: 0 }]}
      goToPlaylistPage={open}
      playPlaylist={play}
      openCreatePlaylistPopup={vi.fn()}
      openOptionsSelector={vi.fn()}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "빈 목록 재생" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "빈 목록 곡 추가" }));
  expect(open).toHaveBeenCalledWith("empty", true);
  expect(play).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "빈 목록 열기" }));
  expect(open).toHaveBeenCalledWith("empty");
  expect(document.body).not.toHaveTextContent("NaN");
});

it("shows the welcoming actions only for an actually empty library", () => {
  render(
    <Playlists
      playlistInfos={[]}
      goToPlaylistPage={vi.fn()}
      playPlaylist={vi.fn()}
      openCreatePlaylistPopup={vi.fn()}
      openOptionsSelector={vi.fn()}
    />,
  );
  expect(screen.getByText("Feel Every Beat ↗")).toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: "라이브러리 검색" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
