import { it, expect } from "vitest";
import { parseBackup } from "features/playlists/model/backup";
import api, { exportPlaylists, importPlaylists } from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
it("roundtrips playlists and order without replacing existing data", async () => {
  await resetDatabase();
  const items = [
    {
      name: "Sister",
      videoID: "FloP_f-VK_k",
      query: "",
      owner: "심규선",
      thumbnail: "",
    },
  ];
  await api.createPlaylist(
    {
      id: "",
      name: "내 음악",
      description: "",
      itemCount: 1,
      thumbnails: [],
      sourcePlaylistUrl: "https://www.youtube.com/playlist?list=PLabc",
    },
    items,
  );
  const exported = await exportPlaylists();
  const rows = parseBackup(
    JSON.stringify({
      format: "smp-playlists",
      version: 1,
      playlists: exported,
    }),
  );
  await importPlaylists(rows);
  const result = await exportPlaylists();
  expect(result).toHaveLength(2);
  expect(result[0].info.id).not.toBe(result[1].info.id);
  expect(result[1].items[0].name).toBe("Sister");
  expect(result[1].info.sourcePlaylistUrl).toBe(
    exported[0].info.sourcePlaylistUrl,
  );
});
it("rejects malformed backups and strips arbitrary thumbnail URLs", () => {
  expect(() => parseBackup("{}")).toThrow();
  expect(() => parseBackup("{")).toThrow();
  const rows = parseBackup(
    JSON.stringify({
      format: "smp-playlists",
      version: 1,
      playlists: [
        {
          info: { name: "a" },
          items: [
            {
              name: "b",
              videoID: "abcdefghijk",
              thumbnail: "https://evil.example/track",
            },
          ],
        },
      ],
    }),
  );
  expect(rows[0].items[0].thumbnail).toBe(
    "https://i.ytimg.com/vi/abcdefghijk/default.jpg",
  );
});
