export type PlaylistMetadata = { name?: string; description?: string };

/** Read playlist oEmbed metadata only, never the first video's title or HTML. */
export async function fetchPlaylistMetadata(
  id: string,
  signal?: AbortSignal,
): Promise<PlaylistMetadata> {
  if (!/^[A-Za-z0-9_-]{2,150}$/.test(id) || signal?.aborted) return {};
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 8000);
  try {
    const url = `https://www.youtube.com/playlist?list=${id}`;
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      {
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      },
    );
    if (!response.ok || controller.signal.aborted) return {};
    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("provider_name" in data) ||
      data.provider_name !== "YouTube" ||
      !("title" in data) ||
      typeof data.title !== "string" ||
      !data.title.trim() ||
      data.title.length > 1000 ||
      !("html" in data) ||
      typeof data.html !== "string" ||
      data.html.length > 20000 ||
      controller.signal.aborted
    )
      return {};
    // Inspect the declared source as text only. Do not insert returned HTML or
    // accept a watch-video response as metadata for the playlist itself.
    const src = /\bsrc=["']([^"']+)["']/i.exec(data.html)?.[1];
    if (!src) return {};
    const embed = new URL(src.replace(/&amp;/g, "&"));
    if (
      embed.protocol !== "https:" ||
      !["www.youtube.com", "youtube.com"].includes(embed.hostname) ||
      embed.username ||
      embed.password ||
      embed.port ||
      embed.pathname !== "/embed/videoseries" ||
      embed.searchParams.get("list") !== id
    )
      return {};
    // YouTube's public playlist oEmbed has no playlist description field.
    return { name: data.title.trim() };
  } catch {
    // Optional metadata must not prevent a valid preview or invent a title.
    return {};
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
