import type { MusicInfo } from "shared/model/constants";

/** Only replace our generated labels, never a user's chosen name. */
export function isGeneratedTitle(item: Pick<MusicInfo, "name" | "videoID">) {
  return (
    !item.name.trim() ||
    item.name === `동영상 (${item.videoID})` ||
    new RegExp(
      `^동영상 \\d+ \\(${item.videoID.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)$`,
    ).test(item.name)
  );
}
export type VideoMetadata = { name: string; owner: string };
/** Public YouTube oEmbed only. No proxy, credentials, API key or returned HTML. */
export async function fetchVideoTitles(ids: string[], signal?: AbortSignal) {
  const result: Record<string, VideoMetadata> = {};
  const unique = [...new Set(ids)].filter((id) => /^[\w-]{11}$/.test(id));
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 12000);
  let cursor = 0;
  try {
    await Promise.all(
      Array.from({ length: Math.min(4, unique.length) }, async () => {
        while (cursor < unique.length && !controller.signal.aborted) {
          const id = unique[cursor++];
          try {
            const response = await fetch(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
              {
                signal: controller.signal,
                credentials: "omit",
                referrerPolicy: "no-referrer",
              },
            );
            if (!response.ok) continue;
            const data: unknown = await response.json();
            if (
              !data ||
              typeof data !== "object" ||
              !("title" in data) ||
              typeof data.title !== "string" ||
              !data.title.trim() ||
              data.title.length > 1000
            )
              continue;
            result[id] = {
              name: data.title.trim(),
              owner:
                "author_name" in data && typeof data.author_name === "string"
                  ? data.author_name.slice(0, 300)
                  : "",
            };
          } catch {
            /* A private/deleted video or network failure leaves this item intact. */
          }
        }
      }),
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
  return result;
}
