vi.mock("features/youtube/api/videoMetadata", async (original) => ({
  ...await original<typeof import("features/youtube/api/videoMetadata")>(),
  fetchVideoTitles: async () => ({}),
}));
import { vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "jotai";
import { Suspense } from "react";
import PlaylistPage from "features/playlists/pages/PlaylistPage";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
beforeEach(async () => {
  await resetDatabase();
});
it("adds a video URL, persists its name and ordering, and hides reset for an ordinary list", async () => {
  const id = await api.createPlaylist(
    { id: "", name: "테스트", description: "", thumbnails: [], itemCount: 0 },
    [],
  );
  await act(async () => {
    render(
      <Provider>
        <MemoryRouter initialEntries={[`/playlist/${id}`]}>
          <Suspense fallback="loading">
            <Routes>
              <Route path="/playlist/:id" element={<PlaylistPage />} />
            </Routes>
          </Suspense>
        </MemoryRouter>
      </Provider>,
    );
  });
  await screen.findByText("테스트", {}, { timeout: 5000 });
  expect(
    screen.queryByRole("button", { name: "원본으로 초기화" }),
  ).not.toBeInTheDocument();
  for (const [video, name] of [
    ["abcdefghijk", "첫 곡"],
    ["lmnopqrstuv", "둘째 곡"],
  ]) {
    fireEvent.change(screen.getByLabelText("추가할 영상 URL"), {
      target: { value: `https://youtu.be/${video}` },
    });
    fireEvent.change(screen.getByLabelText("곡 이름 (선택)"), {
      target: { value: name },
    });
    fireEvent.click(screen.getByRole("button", { name: "곡 추가" }));
    await screen.findByText(name);
  }
  expect(screen.getByRole("button", { name: "둘째 곡 순서 드래그" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "순서 편집" })).not.toBeInTheDocument();
  expect((await api.getPlaylistInfo(id)).itemCount).toBe(2);
});

it("requires explicit duplicate confirmation and retains both independently keyed entries", async () => {
  const id = await api.createPlaylist(
    {
      id: "",
      name: "중복 확인",
      description: "",
      thumbnails: [],
      itemCount: 0,
    },
    [],
  );
  await act(async () =>
    render(
      <Provider>
        <MemoryRouter initialEntries={[`/playlist/${id}`]}>
          <Suspense fallback="loading">
            <Routes>
              <Route path="/playlist/:id" element={<PlaylistPage />} />
            </Routes>
          </Suspense>
        </MemoryRouter>
      </Provider>,
    ),
  );
  await screen.findByLabelText("추가할 영상 URL");
  for (let i = 0; i < 2; i++) {
    fireEvent.change(screen.getByLabelText("추가할 영상 URL"), {
      target: { value: "https://youtu.be/abcdefghijk" },
    });
    fireEvent.click(screen.getByRole("button", { name: "곡 추가" }));
    if (i === 0)
      await waitFor(() =>
        expect(screen.getByLabelText("추가할 영상 URL")).toHaveValue(""),
      );
  }
  expect(screen.getByRole("alert")).toHaveTextContent(
    "이미 이 목록에 있는 영상",
  );
  expect(await api.getPlaylistItems(id)).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "중복해서 추가" }));
  await waitFor(async () =>
    expect(await api.getPlaylistItems(id)).toHaveLength(2),
  );
});

