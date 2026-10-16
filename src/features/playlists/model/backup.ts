import { normalizeInitialSnapshot } from "shared/model/playlistSnapshot";
import type { Playlist, MusicInfo } from "shared/model/constants";
export function parseBackup(text: string): Playlist[] {
  if (text.length > 10_000_000)
    throw new Error("백업 파일은 10MB 이하여야 합니다.");
  const data = JSON.parse(text);
  if (
    data?.format !== "smp-playlists" ||
    data.version !== 1 ||
    !Array.isArray(data.playlists) ||
    data.playlists.length > 500
  )
    throw new Error("SMP 백업 파일이 아닙니다.");
  let total = 0;
  let snapshotTotal = 0;
  return data.playlists.map((p: any) => {
    if (
      !p?.info ||
      typeof p.info.name !== "string" ||
      !Array.isArray(p.items) ||
      (total += p.items.length) > 10000
    )
      throw new Error("재생목록 형식이나 곡 수를 확인해 주세요.");
    const items: MusicInfo[] = p.items.map((t: any) => {
      if (
        typeof t?.name !== "string" ||
        typeof t.videoID !== "string" ||
        (t.videoID && !/^[\w-]{11}$/.test(t.videoID))
      )
        throw new Error("백업 곡 형식이 올바르지 않습니다.");
      return {
        name: t.name.slice(0, 1000),
        videoID: t.videoID,
        owner: typeof t.owner === "string" ? t.owner.slice(0, 300) : "",
        query: typeof t.query === "string" ? t.query.slice(0, 1000) : "",
        thumbnail: t.videoID
          ? `https://i.ytimg.com/vi/${t.videoID}/default.jpg`
          : "",
      };
    });
    let sourcePlaylistUrl: string | undefined;
    if (typeof p.info.sourcePlaylistUrl === "string") {
      const url = new URL(p.info.sourcePlaylistUrl);
      const list = url.searchParams.get("list");
      if (
        url.protocol === "https:" &&
        ["www.youtube.com", "youtube.com"].includes(url.hostname) &&
        list &&
        /^[\w-]+$/.test(list)
      )
        sourcePlaylistUrl = `https://www.youtube.com/playlist?list=${list}`;
    }
    const initialSnapshot =
      p.initialSnapshot === undefined
        ? undefined
        : normalizeInitialSnapshot(p.initialSnapshot);
    snapshotTotal += initialSnapshot?.items.length ?? 0;
    if (snapshotTotal > 10000)
      throw new Error("최초 가져오기 기록의 곡 수가 너무 많습니다.");
    return {
      ...(initialSnapshot ? { initialSnapshot } : {}),
      info: {
        id: "",
        name: p.info.name.slice(0, 1000),
        description:
          typeof p.info.description === "string"
            ? p.info.description.slice(0, 5000)
            : "",
        itemCount: items.length,
        thumbnails: [],
        sourcePlaylistUrl,
      },
      items,
    };
  });
}
