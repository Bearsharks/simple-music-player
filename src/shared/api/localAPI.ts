import type { API } from './apiSelector';
import type { Playlist } from 'shared/model/constants';
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
async function find(id: string): Promise<Playlist> {
  const item = await transaction<Playlist | undefined>('readonly', (store, done) => {const req=store.get(id); req.onsuccess=()=>done(req.result);});
  if (!item) throw new Error('목록을 찾을 수 없습니다.');
  return item;
}
const api: API = {
  getPlaylistInfos: async () => (await transaction<Playlist[]>('readonly',(store,done)=>{const req=store.getAll();req.onsuccess=()=>done(req.result);})).map(p=>p.info),
  getPlaylistInfo: async id => (await find(id)).info,
  getPlaylistItems: async id => (await find(id)).items,
  createPlaylist: async (info,items) => {
    const id = crypto.randomUUID();
    return transaction('readwrite',(store,done)=>{store.add({info:{...info,id},items});done(id);});
  },
  deletePlaylist: async id => transaction('readwrite',(store,done)=>{const req=store.get(id);req.onsuccess=()=>{if(!req.result){done(false);return;}store.delete(id);done(true);};}),
  updatePlaylist: async playlist => transaction('readwrite',(store,done)=>{
    const req=store.get(playlist.info.id);req.onsuccess=()=>{
      const previous = req.result as Playlist | undefined;
      if(!previous){done(false);return;}
      store.put({info:playlist.info,items:playlist.items ?? previous.items});done(true);
    };
  }),
};
export default api;
