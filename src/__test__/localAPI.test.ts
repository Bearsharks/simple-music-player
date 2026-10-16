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
