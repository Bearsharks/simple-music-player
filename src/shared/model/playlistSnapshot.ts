import type { InitialPlaylistSnapshot, MusicInfo } from "./constants";
/** Snapshot data is independent of live items/runtime keys and contains no HTML. */
export function normalizeInitialSnapshot(
  value: unknown,
): InitialPlaylistSnapshot {
  const snapshot = value as InitialPlaylistSnapshot | null;
  if (
    !snapshot ||
    snapshot.version !== 1 ||
    !Number.isSafeInteger(snapshot.capturedAt) ||
    snapshot.capturedAt <= 0 ||
    !Array.isArray(snapshot.items) ||
    snapshot.items.length < 1 ||
    snapshot.items.length > 10000
  )
    throw new Error("최초 가져오기 기록 형식이 올바르지 않습니다.");
  const items: MusicInfo[] = snapshot.items.map((item) => {
    if (
      !item ||
      typeof item.videoID !== "string" ||
      !/^[\w-]{11}$/.test(item.videoID) ||
      typeof item.name !== "string" ||
      item.name.length > 1000 ||
      (item.owner != null &&
        (typeof item.owner !== "string" || item.owner.length > 300)) ||
      (item.query != null &&
        (typeof item.query !== "string" || item.query.length > 1000))
    )
      throw new Error("최초 가져오기 기록의 곡 형식이 올바르지 않습니다.");
    return {
      name: item.name,
      videoID: item.videoID,
      owner: item.owner ?? "",
      query: item.query ?? "",
      thumbnail: `https://i.ytimg.com/vi/${item.videoID}/default.jpg`,
    };
  });
  return { version: 1, capturedAt: snapshot.capturedAt, items };
}
