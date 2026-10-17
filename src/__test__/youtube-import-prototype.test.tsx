import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import YouTubeImportPrototype from "features/youtube/prototype/YouTubeImportPrototype";
import { initialState, prototypeReducer, resolveSamples, sampleInputs, type PrototypeState, type SampleResolver, type SampleTrack } from "features/youtube/prototype/model";

type Resolved = Omit<SampleTrack, "key">[];
const rows = (ids: string[]): Resolved => ids.map((id) => ({ id, title: `Song ${id}`, artist: "Sample artist", seconds: 180, tone: 0, source: `영상 ${id}` }));
const original = rows(["A", "B1", "B2", "B3", "C"]);
function deferred() {
  let resolve!: (tracks: Resolved) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Resolved>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const order = () => [...document.querySelectorAll("[data-sample-track]")].map((node) => node.getAttribute("data-sample-track"));
const button = (name: string) => screen.getByRole("button", { name });
async function setup(resolver: SampleResolver = vi.fn().mockResolvedValue(original)) {
  const user = userEvent.setup();
  render(<MemoryRouter><YouTubeImportPrototype resolver={resolver} /></MemoryRouter>);
  await user.click(button("샘플 가져오기 열기"));
  await waitFor(() => expect(order()).toEqual(["A", "B1", "B2", "B3", "C"]));
  return user;
}
async function controls(user: ReturnType<typeof userEvent.setup>) {
  const summary = screen.getByText("시뮬레이션").closest("summary")!;
  if (!summary.parentElement!.hasAttribute("open")) await user.click(summary);
}
async function edit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(button("B2 삭제"));
  await user.clear(screen.getByLabelText(/재생목록 이름/));
  await user.type(screen.getByLabelText(/재생목록 이름/), "내가 편집한 믹스");
  await user.type(screen.getByLabelText(/설명/), "남겨둘 설명");
}
afterEach(() => { vi.restoreAllMocks(); window.history.replaceState({}, "", "/"); });

describe("sample-only input and atomic state", () => {
  it("resolves metadata and expands playlists in input order, preserving repeated occurrences", async () => {
    const resolved = await resolveSamples([...sampleInputs.original, { kind: "video", id: "A" }]);
    expect(resolved.map((track) => track.id)).toEqual(["A", "B1", "B2", "B3", "C", "A"]);
    expect(resolved[0]).toMatchObject({ title: "Afterglow", artist: "Sunday Tape" });
    expect(sampleInputs.original.every((item) => Object.keys(item).sort().join() === "id,kind")).toBe(true);
  });
  it("rejects stale success/failure after a newer pending request or close", () => {
    let state = prototypeReducer(initialState, { type: "receive", request: { sequence: 1, items: sampleInputs.original } });
    state = prototypeReducer(state, { type: "resolved", sequence: 1, tracks: original });
    state = prototypeReducer(state, { type: "receive", request: { sequence: 2, items: sampleInputs.incoming } });
    state = prototypeReducer(state, { type: "replace", fail: false });
    state = prototypeReducer(state, { type: "receive", request: { sequence: 3, items: sampleInputs.latest } });
    expect(prototypeReducer(state, { type: "resolved", sequence: 2, tracks: rows(["D"]) })).toBe(state);
    expect(prototypeReducer(state, { type: "failed", sequence: 2 })).toBe(state);
    state = prototypeReducer(state, { type: "close" });
    expect(prototypeReducer(state, { type: "resolved", sequence: 3, tracks: rows(["F"]) })).toBe(initialState);
  });
  it("does not move beyond list boundaries or share duplicate runtime keys", () => {
    let state: PrototypeState = prototypeReducer(initialState, { type: "receive", request: { sequence: 1, items: sampleInputs.original } });
    state = prototypeReducer(state, { type: "resolved", sequence: 1, tracks: [...original, original[0]] });
    expect(new Set(state.draft!.tracks.map((track) => track.key)).size).toBe(6);
    expect(prototypeReducer(state, { type: "reorder", key: state.draft!.tracks[0].key, to: -1 })).toBe(state);
  });
  it("inserts a dragged track at its destination without swapping, losing keys, fields or pending requests", () => {
    let state = prototypeReducer(initialState, { type: "receive", request: { sequence: 1, items: sampleInputs.original } });
    state = prototypeReducer(state, { type: "resolved", sequence: 1, tracks: original });
    state = prototypeReducer(state, { type: "edit", field: "title", value: "Edited title" });
    state = prototypeReducer(state, { type: "edit", field: "description", value: "Edited description" });
    state = prototypeReducer(state, { type: "receive", request: { sequence: 2, items: sampleInputs.latest } });
    const before = state;
    const dragged = state.draft!.tracks[3];
    state = prototypeReducer(state, { type: "reorder", key: dragged.key, to: 0 });
    expect(state.draft!.tracks.map((track) => track.id)).toEqual(["B3", "A", "B1", "B2", "C"]);
    expect(state.draft!.tracks[0]).toBe(dragged);
    expect(state.draft).toMatchObject({ title: "Edited title", description: "Edited description" });
    expect(state.pending).toBe(before.pending);
    const restored = prototypeReducer(state, { type: "reorder", key: dragged.key, to: 3 });
    expect(restored.draft!.tracks).toEqual(before.draft!.tracks);
    for (const to of [-1, 5, NaN, 1.5]) expect(prototypeReducer(state, { type: "reorder", key: dragged.key, to })).toBe(state);
  });
});

describe("interactive prototype entrypoint", () => {
  it("opens the isolated component fixture with ordered samples and no fetch, iframe or persistence", async () => {
    const network = vi.spyOn(globalThis, "fetch");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const database = vi.spyOn(indexedDB, "open");
    render(<MemoryRouter><YouTubeImportPrototype /></MemoryRouter>);
    const opener = await screen.findByRole("button", { name: "샘플 가져오기 열기" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(opener);
    await waitFor(() => expect(order()).toEqual(["A", "B1", "B2", "B3", "C"]));
    expect(screen.getByRole("button", { name: "A · Afterglow 미리보기 선택" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("dialog", { name: "목록 편집" })).toBeVisible();
    expect(screen.getByText("데모 · 샘플·무음 · 실제 재생·대기열·저장 변경 없음", { selector: ".yi-demo-note" })).toBeVisible();
    for (const copy of ["YouTube에서 가져오기", "곡을 다듬고, 원하는 곳으로 보내세요.", "영상 · 목록을 보낸 순서대로 펼쳤어요"]) expect(screen.queryByText(copy)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /순서 드래그$/ })).toHaveLength(5);
    expect(document.querySelector("iframe")).toBeNull();
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    expect(database).not.toHaveBeenCalled();
  });

  it("preserves deletion/title/description, shows only the latest unresolved request, and Keep retains edits", async () => {
    const resolver = vi.fn().mockResolvedValue(original);
    const user = await setup(resolver);
    await edit(user);
    await controls(user);
    await user.click(button("요청 보내기 · D + 목록 E"));
    await user.click(button("최신 요청 보내기 · F"));
    expect(screen.getAllByRole("region", { name: "최신 요청 교체 확인" })).toHaveLength(1);
    expect(screen.getByText(/최신 요청 #3 · video F/)).toBeVisible();
    expect(screen.queryByText(/최신 요청 #2/)).not.toBeInTheDocument();
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(order()).toEqual(["A", "B1", "B3", "C"]);
    expect(screen.getByLabelText(/재생목록 이름/)).toHaveValue("내가 편집한 믹스");
    await user.click(button("현재 편집 유지"));
    expect(screen.queryByRole("region", { name: "최신 요청 교체 확인" })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/설명/)).toHaveValue("남겨둘 설명");
    expect(order()).toEqual(["A", "B1", "B3", "C"]);
    expect(resolver).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByLabelText(/재생목록 이름/)).toHaveFocus());
  });

  it("replaces atomically only after confirmation, preserves the old draft on failure, and retries", async () => {
    const next = deferred();
    const retry = deferred();
    const resolver = vi.fn().mockResolvedValueOnce(original).mockReturnValueOnce(next.promise).mockReturnValueOnce(retry.promise);
    const user = await setup(resolver);
    await edit(user);
    await controls(user);
    await user.click(button("요청 보내기 · D + 목록 E"));
    expect(resolver).toHaveBeenCalledTimes(1);
    await user.click(button("새 요청으로 교체"));
    expect(resolver).toHaveBeenLastCalledWith(sampleInputs.incoming);
    expect(order()).toEqual(["A", "B1", "B3", "C"]);
    await act(async () => next.reject(new Error("sample failed")));
    expect(screen.getByRole("alert")).toHaveTextContent("기존 편집본은 그대로");
    expect(screen.getByLabelText(/재생목록 이름/)).toHaveValue("내가 편집한 믹스");
    expect(screen.getByLabelText(/설명/)).toHaveValue("남겨둘 설명");
    await user.click(button("새 요청으로 교체"));
    await act(async () => retry.resolve(rows(["D", "E1", "E2"])));
    expect(order()).toEqual(["D", "E1", "E2"]);
    expect(screen.getByLabelText(/재생목록 이름/)).toHaveValue("나의 새로운 믹스");
    expect(screen.getByLabelText(/설명/)).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "최신 요청 교체 확인" })).not.toBeInTheDocument();
  });

  it("ignores an in-flight replacement when a newer request arrives, until that new request is confirmed", async () => {
    const old = deferred();
    const latest = deferred();
    const resolver = vi.fn().mockResolvedValueOnce(original).mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    const user = await setup(resolver);
    await edit(user);
    await controls(user);
    await user.click(button("요청 보내기 · D + 목록 E"));
    await user.click(button("새 요청으로 교체"));
    await user.click(button("최신 요청 보내기 · F"));
    await act(async () => old.resolve(rows(["D", "E1", "E2"])));
    expect(order()).toEqual(["A", "B1", "B3", "C"]);
    expect(screen.getByLabelText(/재생목록 이름/)).toHaveValue("내가 편집한 믹스");
    expect(resolver).toHaveBeenCalledTimes(2);
    await user.click(button("새 요청으로 교체"));
    expect(resolver).toHaveBeenLastCalledWith(sampleInputs.latest);
    await act(async () => latest.resolve(rows(["F"])));
    expect(order()).toEqual(["F"]);
  });

  it("has keyboard drag handles without arrow buttons, cancels the drag before Dialog, and preserves selection and edits", async () => {
    const user = await setup();
    expect(button("목록 편집 닫기")).toHaveFocus();
    expect(screen.queryByRole("button", { name: /위로 이동|아래로 이동/ })).not.toBeInTheDocument();
    await user.click(button("B2 · Song B2 미리보기 선택"));
    await user.clear(screen.getByLabelText(/재생목록 이름/));
    await user.type(screen.getByLabelText(/재생목록 이름/), "내 편집본");
    const handle = button("B3 순서 드래그");
    handle.focus();
    // Pangea's established sensor reads native keyCode (user-event/jsdom leaves it 0).
    fireEvent.keyDown(handle, { key: " ", code: "Space", keyCode: 32, which: 32 });
    await waitFor(() => expect(document.querySelector('[data-sample-track="B3"]')).toHaveAttribute("data-dragging", "true"));
    fireEvent.keyDown(handle, { key: "Escape", code: "Escape", keyCode: 27, which: 27 });
    await waitFor(() => expect(document.querySelector("[data-dragging]")).toBeNull());
    expect(screen.getByRole("dialog", { name: "목록 편집" })).toBeVisible();
    expect(order()).toEqual(["A", "B1", "B2", "B3", "C"]);
    expect(screen.getByLabelText(/재생목록 이름/)).toHaveValue("내 편집본");
    expect(button("B2 · Song B2 미리보기 선택")).toHaveAttribute("aria-pressed", "true");
  });

  it("preserves deletion focus fallback, simulated preview and all three honest demo actions", async () => {
    const user = await setup();
    await user.click(button("A 삭제"));
    await waitFor(() => expect(button("B1 · Song B1 미리보기 선택")).toHaveFocus());
    await user.click(button("무음 미리보기 시뮬레이션 시작"));
    expect(button("시뮬레이션 일시정지")).toHaveAttribute("aria-pressed", "true");
    for (const name of ["다음 재생", "대기열 끝에 추가", "재생목록 저장"]) {
      await user.click(button(name));
      expect(screen.getByText(/데모 · 4곡/)).toHaveTextContent("실제 재생·대기열·저장 변경 없음");
      expect(screen.queryByText("데모 · 샘플·무음 · 실제 재생·대기열·저장 변경 없음", { selector: ".yi-demo-note" })).not.toBeInTheDocument();
    }
    await user.clear(screen.getByLabelText(/재생목록 이름/));
    await user.type(screen.getByLabelText(/재생목록 이름/), "   ");
    expect(button("재생목록 저장")).toBeDisabled();
    expect(button("다음 재생")).toBeEnabled();
  });

  it("offers local simulated volume and mute restoration across preview selection without touching the real player", async () => {
    const realSetVolume = vi.fn();
    const previous = Object.getOwnPropertyDescriptor(window, "player");
    Object.defineProperty(window, "player", { configurable: true, value: { setVolume: realSetVolume, mute: vi.fn(), unMute: vi.fn() } });
    try {
      const user = await setup();
      await user.click(button("무음 미리보기 시뮬레이션 시작"));
      await user.click(button("미리보기 음량 조절"));
      let slider = screen.getByRole("slider", { name: "미리보기 음량" });
      expect(slider).toHaveAttribute("min", "0");
      expect(slider).toHaveAttribute("max", "100");
      expect(slider).toHaveAttribute("aria-orientation", "vertical");
      expect(slider.closest('dialog[aria-label="목록 편집"]')).not.toBeNull();
      expect(slider).toHaveFocus();
      fireEvent.change(slider, { target: { value: "37" } });
      await user.click(button("미리보기 음소거"));
      expect(slider).toHaveValue("0");
      expect(button("미리보기 음소거 해제")).toHaveAttribute("aria-pressed", "true");
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
      expect(button("미리보기 음량 조절")).toHaveFocus();
      expect(screen.getByRole("dialog", { name: "목록 편집" })).toBeVisible();
      await user.click(button("B3 · Song B3 미리보기 선택"));
      await user.click(button("미리보기 음량 조절"));
      slider = screen.getByRole("slider", { name: "미리보기 음량" });
      expect(slider).toHaveValue("0");
      await user.click(button("미리보기 음소거 해제"));
      expect(slider).toHaveValue("37");
      fireEvent.change(slider, { target: { value: "0" } });
      await user.click(button("미리보기 음소거 해제"));
      expect(slider).toHaveValue("37");
      fireEvent.change(slider, { target: { value: "82" } });
      expect(button("미리보기 음소거")).toHaveAttribute("aria-pressed", "false");
      expect(realSetVolume).not.toHaveBeenCalled();
    } finally {
      if (previous) Object.defineProperty(window, "player", previous);
      else Reflect.deleteProperty(window, "player");
    }
  });

  it("uses Dialog escape/Tab boundaries, restores trigger focus, and ignores completion after close", async () => {
    const pending = deferred();
    const resolver = vi.fn().mockResolvedValueOnce(original).mockReturnValueOnce(pending.promise);
    const user = await setup(resolver);
    await user.tab({ shift: true });
    expect(button("재생목록 저장")).toHaveFocus();
    await user.tab();
    expect(button("목록 편집 닫기")).toHaveFocus();
    await controls(user);
    await user.click(button("요청 보내기 · D + 목록 E"));
    await user.click(button("새 요청으로 교체"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button("샘플 가져오기 열기")).toHaveFocus();
    await act(async () => pending.resolve(rows(["D"])));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("disables all actions for an empty draft and moves focus to the title after the last deletion", async () => {
    const user = await setup();
    for (const id of ["A", "B1", "B2", "B3", "C"]) await user.click(button(`${id} 삭제`));
    expect(screen.getByText("곡 없음")).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText(/재생목록 이름/)).toHaveFocus());
    for (const name of ["다음 재생", "대기열 끝에 추가", "재생목록 저장"]) expect(button(name)).toBeDisabled();
    expect(within(screen.getByRole("region", { name: "무음 시뮬레이션 미리보기" })).getByText("곡이 없습니다")).toBeVisible();
  });
});
