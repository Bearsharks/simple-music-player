import { vi, afterEach, it, expect } from "vitest";
import {
  fetchVideoTitles,
  isGeneratedTitle,
} from "features/youtube/api/videoMetadata";
afterEach(() => vi.unstubAllGlobals());
it("fetches original titles once per ID without credentials or executing HTML", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "심규선 ‘Sister’",
        author_name: "심규선",
        html: "<script>bad</script>",
      }),
    });
  vi.stubGlobal("fetch", fetcher);
  expect(
    await fetchVideoTitles(["FloP_f-VK_k", "FloP_f-VK_k", "invalid"]),
  ).toEqual({ "FloP_f-VK_k": { name: "심규선 ‘Sister’", owner: "심규선" } });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1].credentials).toBe("omit");
});
it("keeps unavailable videos as missing and never retries 403", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 403 });
  vi.stubGlobal("fetch", fetcher);
  expect(await fetchVideoTitles(["abcdefghijk"])).toEqual({});
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("recognizes only generated labels", () => {
  expect(
    isGeneratedTitle({
      videoID: "FloP_f-VK_k",
      name: "동영상 1 (FloP_f-VK_k)",
    }),
  ).toBe(true);
  expect(isGeneratedTitle({ videoID: "FloP_f-VK_k", name: "내 이름" })).toBe(
    false,
  );
});
it("does not fetch when cancelled", async () => {
  const f = vi.fn();
  vi.stubGlobal("fetch", f);
  const c = new AbortController();
  c.abort();
  expect(await fetchVideoTitles(["abcdefghijk"], c.signal)).toEqual({});
  expect(f).not.toHaveBeenCalled();
});
