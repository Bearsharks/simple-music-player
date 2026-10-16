export const LIBRARY_KEY = 'simple-music-player:youtube-library:v1';
export interface SavedPlaylist { id: string; title: string; url: string; addedAt: string }
export interface Library { version: 1; playlists: SavedPlaylist[]; selectedId: string | null }
export const emptyLibrary = (): Library => ({ version: 1, playlists: [], selectedId: null });
export function parsePlaylistUrl(input: string): { id: string; url: string } {
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error('YouTube 재생목록 URL을 입력해 주세요.'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port || !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be'].includes(url.hostname)) throw new Error('YouTube 재생목록 URL만 등록할 수 있습니다.');
  const id = url.searchParams.get('list');
  if (!id || !/^[A-Za-z0-9_-]{2,150}$/.test(id)) throw new Error('list= 값이 있는 재생목록 URL을 입력해 주세요.');
  if (/^(WL|LL|HL)$/.test(id) || id.startsWith('RD')) throw new Error('나중에 볼 동영상·좋아요·기록·자동 믹스 대신 공개 재생목록을 사용해 주세요.');
  return { id, url: `https://www.youtube.com/playlist?list=${encodeURIComponent(id)}` };
}
export function readLibrary(storage: Pick<Storage, 'getItem'> = localStorage): Library {
  const raw = storage.getItem(LIBRARY_KEY);
  if (!raw) return emptyLibrary();
  let data: Library;
  try { data = JSON.parse(raw); } catch { throw new Error('저장된 목록을 읽지 못했습니다. 기존 데이터를 덮어쓰지 않았습니다.'); }
  if (data?.version !== 1 || !Array.isArray(data.playlists) || data.playlists.length > 1000 || !data.playlists.every(p => p && typeof p.id === 'string' && typeof p.title === 'string' && p.title.length <= 120 && typeof p.url === 'string' && typeof p.addedAt === 'string')) throw new Error('지원하지 않는 저장 형식입니다. 기존 데이터를 보존했습니다.');
  for (const p of data.playlists) { if (parsePlaylistUrl(p.url).id !== p.id) throw new Error('저장된 재생목록 주소가 올바르지 않습니다.'); }
  if (new Set(data.playlists.map(p => p.id)).size !== data.playlists.length || (data.selectedId !== null && !data.playlists.some(p => p.id === data.selectedId))) throw new Error('저장된 목록 선택 정보가 올바르지 않습니다.');
  return data;
}
export function writeLibrary(library: Library, storage: Pick<Storage, 'setItem'> = localStorage) {
  try { storage.setItem(LIBRARY_KEY, JSON.stringify(library)); }
  catch { throw new Error('브라우저에 저장하지 못했습니다. 저장 공간과 사이트 저장 권한을 확인해 주세요.'); }
}
export function addPlaylist(library: Library, input: string, title: string): Library {
  const parsed = parsePlaylistUrl(input);
  if (library.playlists.some(p => p.id === parsed.id)) return { ...library, selectedId: parsed.id };
  if (library.playlists.length >= 1000) throw new Error('재생목록은 최대 1,000개까지 저장할 수 있습니다.');
  return { ...library, selectedId: parsed.id, playlists: [...library.playlists, { ...parsed, title: title.trim().slice(0,120) || `재생목록 ${library.playlists.length + 1}`, addedAt: new Date().toISOString() }] };
}
export function removePlaylist(library: Library, id: string): Library {
  const playlists = library.playlists.filter(p => p.id !== id);
  return { ...library, playlists, selectedId: library.selectedId === id ? playlists[0]?.id ?? null : library.selectedId };
}
