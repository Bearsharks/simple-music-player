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
  expect(
    screen.queryByRole("button", { name: "둘째 곡 위로" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "순서 편집" }));
  fireEvent.click(screen.getByRole("button", { name: "둘째 곡 위로" }));
  await waitFor(async () =>
    expect((await api.getPlaylistItems(id))[0].name).toBe("둘째 곡"),
  );
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

it("restores keyboard reorder focus after pending failure, retry and an end position", async () => {
  const user = (await import("@testing-library/user-event")).default.setup();
  const { vi } = await import("vitest");
  const tracks = ["첫 곡", "둘째 곡", "셋째 곡"].map((name, i) => ({
    name,
    videoID: String(i).repeat(11),
    owner: "",
    thumbnail: "",
    query: "",
  }));
  const id = await api.createPlaylist(
    {
      id: "",
      name: "순서 키보드",
      description: "",
      itemCount: 3,
      thumbnails: [],
    },
    tracks,
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
  await user.click(await screen.findByRole("button", { name: "순서 편집" }));
  const up = screen.getByRole("button", { name: "셋째 곡 위로" });
  let reject!: (error: Error) => void;
  const update = vi.spyOn(api, "updatePlaylist").mockImplementationOnce(
    () =>
      new Promise((_resolve, no) => {
        reject = no;
      }),
  );
  try {
    await user.click(up);
    await waitFor(() => expect(up).toBeDisabled());
    up.blur(); // Chromium removes focus from a newly disabled control.
    await act(async () => reject(new Error("순서 저장 실패")));
    expect(up).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("순서 저장 실패");
    expect((await api.getPlaylistItems(id))[2].name).toBe("셋째 곡");
    await user.keyboard("{Enter}");
    await waitFor(async () =>
      expect((await api.getPlaylistItems(id))[1].name).toBe("셋째 곡"),
    );
    expect(up).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "셋째 곡 아래로" }),
      ).toHaveFocus(),
    );
    expect(up).toBeDisabled();
    await user.keyboard("{Enter}");
    await waitFor(async () =>
      expect((await api.getPlaylistItems(id))[1].name).toBe("셋째 곡"),
    );
    expect(
      screen.getByRole("button", { name: "셋째 곡 아래로" }),
    ).toHaveFocus();
  } finally {
    update.mockRestore();
  }
});
