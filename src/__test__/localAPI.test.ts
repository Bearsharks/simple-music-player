import { vi } from "vitest";
import { resetDatabase } from 'test/resetDatabase';
import api from 'shared/api/localAPI';
const info = {id:'',name:'로컬',description:'',thumbnails:[],itemCount:1};
const song = {videoID:'abcdefghijk',name:'음악',query:'',owner:'',thumbnail:''};
beforeEach(async()=>{localStorage.clear();await resetDatabase();});
it('persists create, reorder/update and deletion without a server',async()=>{
 const id=await api.createPlaylist(info,[song]);
 expect((await api.getPlaylistInfos())[0].id).toBe(id);
 expect(await api.getPlaylistItems(id)).toEqual([song]);
 await api.updatePlaylist({info:{...info,id,name:'수정'},items:[]});
 expect((await api.getPlaylistInfo(id)).name).toBe('수정');
 expect(await api.getPlaylistItems(id)).toEqual([]);
 await api.deletePlaylist(id); expect(await api.getPlaylistInfos()).toEqual([]);
});

it('derives creation metadata from actual items and preserves original creation time on edits', async () => {
 const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
 const id = await api.createPlaylist({name:'  빈 목록  '} as any, []);
 expect(await api.getPlaylistInfo(id)).toMatchObject({name:'빈 목록',description:'',itemCount:0,thumbnails:[],createdAt:1000});
 now.mockReturnValue(2000);
 const items = Array.from({length:6},(_,i)=>({...song,thumbnail:`https://i.ytimg.com/${i}.jpg`}));
 await api.updatePlaylist({info:{id,name:'수정',sourcePlaylistUrl:'https://www.youtube.com/playlist?list=PLtest123',createdAt:9999} as any,items});
 expect(await api.getPlaylistInfo(id)).toMatchObject({createdAt:1000,itemCount:6,thumbnails:items.slice(0,4).map(item=>item.thumbnail)});
 await api.updatePlaylist({info:{id,name:'다시 수정'} as any});
 expect(await api.getPlaylistInfo(id)).toMatchObject({createdAt:1000,itemCount:6,sourcePlaylistUrl:'https://www.youtube.com/playlist?list=PLtest123'});
 now.mockRestore();
});

it('reads legacy metadata consistently without inventing creation dates or changing stored tracks', async () => {
 await new Promise<void>((resolve,reject)=>{
  const req=indexedDB.open('simple-music-player-local-v1',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('playlists',{keyPath:'info.id'});
  req.onsuccess=()=>{const db=req.result;const tx=db.transaction('playlists','readwrite');tx.objectStore('playlists').put({info:{id:'legacy',name:'오래된 목록'},items:[song]});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};
 });
 expect(await api.getPlaylistInfo('legacy')).toEqual({id:'legacy',name:'오래된 목록',description:'',itemCount:1,thumbnails:[]});
 expect((await api.getPlaylistInfos())[0].createdAt).toBeUndefined();
 expect(await api.getPlaylistItems('legacy')).toEqual([song]);
});

it('rejects an aborted write without reporting a successful creation', async () => {
 const add = vi.spyOn(IDBObjectStore.prototype,'add').mockImplementation(()=>{throw new DOMException('저장 공간 부족','QuotaExceededError');});
 await expect(api.createPlaylist(info,[song])).rejects.toThrow('저장 공간 부족');
 add.mockRestore();
 expect(await api.getPlaylistInfos()).toEqual([]);
});
