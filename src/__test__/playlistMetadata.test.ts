import { fetchPlaylistMetadata } from "features/youtube/api/playlistMetadata";
const id = "PLBCF2DAC6FFB574DE";
const response = {
  provider_name: "YouTube",
  title: "Google Search Stories",
  // This real playlist oEmbed shape was verified independently of its first video.
  html: `<iframe src="https://www.youtube.com/embed/videoseries?list=${id}"></iframe>`,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("reads the actual playlist title from official keyless oEmbed without inventing description", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        ...response,
        description: "Unspecified oEmbed extension",
        author_name: "Not the description",
      }),
    });
  vi.stubGlobal("fetch", fetch);
  expect(await fetchPlaylistMetadata(id)).toEqual({
    name: "Google Search Stories",
  });
  expect(fetch).toHaveBeenCalledOnce();
  const [url, options] = fetch.mock.calls[0];
  expect(new URL(url).origin).toBe("https://www.youtube.com");
  expect(new URL(url).searchParams.get("url")).toBe(
    `https://www.youtube.com/playlist?list=${id}`,
  );
  expect(options).toMatchObject({
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
});
it.each([
  {
    ...response,
    html: '<iframe src="https://www.youtube.com/embed/GvgqDSnpRQM"></iframe>',
  },
  {
    ...response,
    html: '<iframe src="https://evil.test/embed/videoseries?list=PLBCF2DAC6FFB574DE"></iframe>',
  },
  {
    ...response,
    html: '<iframe src="https://www.youtube.com/embed/videoseries?list=PLother"></iframe>',
  },
  { ...response, title: "" },
  { ...response, title: "x".repeat(1001) },
  { ...response, provider_name: "Other" },
])("rejects non-playlist, mismatched and malformed metadata", async (body) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => body }),
  );
  expect(await fetchPlaylistMetadata(id)).toEqual({});
});
it("does not retry unavailable metadata and cancels its timeout on completion", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });
  vi.stubGlobal("fetch", fetch);
  expect(await fetchPlaylistMetadata(id)).toEqual({});
  expect(fetch).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
it("ignores metadata resolving after cancellation and rejects malformed IDs without network", async () => {
  let finish!: (value: unknown) => void;
  const fetch = vi.fn().mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const pending = fetchPlaylistMetadata(id, controller.signal);
  controller.abort();
  finish({ ok: true, json: async () => response });
  expect(await pending).toEqual({});
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  expect(await fetchPlaylistMetadata("../bad")).toEqual({});
  expect(await fetchPlaylistMetadata(id, controller.signal)).toEqual({});
  expect(fetch).toHaveBeenCalledOnce();
});
