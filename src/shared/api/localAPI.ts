import type { API } from './apiSelector';
import type { Playlist, PlaylistInfo, MusicInfo } from 'shared/model/constants';
export const DATABASE_NAME = 'simple-music-player-local-v1';
const STORE = 'playlists';
// Original 9e52a5c used server playlists; do not invent a legacy localStorage schema.
// See docs/STORAGE-MIGRATION.md. Existing browser values are left untouched.
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('이 브라우저에서 IndexedDB를 사용할 수 없습니다.')); return; }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE, {keyPath:'info.id'}); };
    request.onerror = () => reject(new Error('로컬 데이터베이스를 열지 못했습니다. 사이트 저장 권한을 확인해 주세요.'));
    request.onblocked = () => reject(new Error('다른 탭을 닫고 다시 시도해 주세요.'));
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
  });
}
async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, done: (value: T) => void) => void): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode); let result: T;
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error('목록을 저장하거나 읽지 못했습니다. 저장 공간과 사이트 권한을 확인해 주세요.')); };
    try { run(tx.objectStore(STORE), value => {result = value;}); }
    catch(e) { tx.abort(); reject(e); }
  });
}
function canonical(info: PlaylistInfo, items: MusicInfo[], id = info.id): Playlist {
  if (!Array.isArray(items)) throw new Error('재생목록 곡 형식이 올바르지 않습니다.');
  return {
    info: {
      ...info,
      id,
      name: typeof info.name === 'string' && info.name.trim() ? info.name.trim() : '새 재생목록',
      description: typeof info.description === 'string' ? info.description : '',
      itemCount: items.length,
      thumbnails: items.map(item => item.thumbnail).filter(value => typeof value === 'string' && value.length > 0).slice(0, 4),
    },
    items,
  };
}
async function find(id: string): Promise<Playlist> {
  const item = await transaction<Playlist | undefined>('readonly', (store, done) => {const req=store.get(id); req.onsuccess=()=>done(req.result);});
  if (!item) throw new Error('목록을 찾을 수 없습니다.');
  return canonical(item.info, item.items);
}
const api: API = {
  getPlaylistInfos: async () => (await transaction<Playlist[]>('readonly',(store,done)=>{const req=store.getAll();req.onsuccess=()=>done(req.result);})).map(p=>canonical(p.info,p.items).info),
  getPlaylistInfo: async id => (await find(id)).info,
  getPlaylistItems: async id => (await find(id)).items,
  createPlaylist: async (info,items) => {
    const id = crypto.randomUUID();
    const playlist = canonical({ ...info, createdAt: Date.now() }, items, id);
    return transaction('readwrite',(store,done)=>{store.add(playlist);done(id);});
  },
  deletePlaylist: async id => transaction('readwrite',(store,done)=>{const req=store.get(id);req.onsuccess=()=>{if(!req.result){done(false);return;}store.delete(id);done(true);};}),
  updatePlaylist: async playlist => transaction('readwrite',(store,done)=>{
    const req=store.get(playlist.info.id);req.onsuccess=()=>{
      const previous = req.result as Playlist | undefined;
      if(!previous){done(false);return;}
      store.put(canonical({ ...previous.info, ...playlist.info, createdAt: previous.info.createdAt }, playlist.items ?? previous.items));done(true);
    };
  }),
};
export default api;

export async function exportPlaylists(): Promise<Playlist[]> {
  return transaction('readonly', (store, done) => {
    const req = store.getAll(); req.onsuccess = () => done(req.result.map((p: Playlist) => canonical(p.info, p.items)));
  });
}
/** One atomic write; existing lists are never replaced by a backup. */
export async function importPlaylists(playlists: Playlist[]): Promise<void> {
  const rows = playlists.map(p => canonical({...p.info, createdAt: p.info.createdAt ?? Date.now()}, p.items, crypto.randomUUID()));
  await transaction<void>('readwrite', (store, done) => { for (const row of rows) store.add(row); done(); });
}
