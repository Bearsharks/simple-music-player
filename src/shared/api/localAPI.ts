import type { API } from './apiSelector';
import type { Playlist } from 'shared/model/constants';
const key = 'simple-music-player:editable-playlists:v1';
function read(): Playlist[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('로컬 재생목록 형식 오류');
  return data;
}
function write(data: Playlist[]) { localStorage.setItem(key, JSON.stringify(data)); }
function find(id: string) { const p = read().find(p => p.info.id === id); if (!p) throw new Error('목록을 찾을 수 없습니다.'); return p; }
const api: API = {
  getPlaylistInfos: async () => read().map(p => p.info),
  getPlaylistInfo: async id => find(id).info,
  getPlaylistItems: async id => find(id).items,
  createPlaylist: async (info, items) => { const id = crypto.randomUUID(); write([...read(), {info: {...info, id}, items}]); return id; },
  deletePlaylist: async id => { const data = read(); if (!data.some(p => p.info.id === id)) return false; write(data.filter(p => p.info.id !== id)); return true; },
  updatePlaylist: async playlist => { const data = read(); const i = data.findIndex(p => p.info.id === playlist.info.id); if (i < 0) return false; data[i] = {info: playlist.info, items: playlist.items ?? data[i].items}; write(data); return true; },
};
export default api;
