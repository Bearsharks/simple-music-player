import { act, renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { ReactNode } from 'react';
import { playlistIDsState, playlistInfoStateFamily, playlistItemStateFamily, usePlaylistManager } from 'features/playlists/model/playlistAtoms';
import { PlaylistActionType as T } from 'shared/model/constants';
import { reset } from 'shared/api/testAPI';
function setup() {
 const store=createStore();const wrapper=({children}:{children:ReactNode})=><Provider store={store}>{children}</Provider>;
 const {result}=renderHook(usePlaylistManager,{wrapper});return {store,result};
}
beforeEach(reset);
it('creates, updates and deletes a playlist', async()=>{
 const {store,result}=setup();const before=await store.get(playlistIDsState);
 await act(()=>result.current({type:T.CREATE,payload:{info:{name:'new',description:'desc',thumbnails:[],itemCount:0},items:[]}}));
 const ids=await store.get(playlistIDsState);expect(ids).toHaveLength(before.length+1);
 const id=ids.at(-1)!;let info=await store.get(playlistInfoStateFamily(id));expect(info.name).toBe('new');
 await act(()=>result.current({type:T.UPDATE,payload:{info:{...info,name:'changed',description:''},items:[]}}));
 expect((await store.get(playlistInfoStateFamily(id))).name).toBe('changed');
 await act(()=>result.current({type:T.DELETE,payload:id}));expect(await store.get(playlistIDsState)).toEqual(before);
});
it('appends and deletes arbitrary items without mutating selection', async()=>{
 const {store,result}=setup();const id=(await store.get(playlistIDsState))[0];
 const original=await store.get(playlistItemStateFamily(id));
 await act(()=>result.current({type:T.APPEND,payload:{info:{id},items:[{name:'new',query:'new',videoID:'',thumbnail:'',owner:''}]}}));
 const items=await store.get(playlistItemStateFamily(id));expect(items).toHaveLength(original.length+1);
 const selection=[items[2],items[0]];const keys=selection.map(i=>i.key);
 await act(()=>result.current({type:T.DELETE_ITEMS,payload:{id,items:selection}}));
 expect(selection.map(i=>i.key)).toEqual(keys);
 expect(await store.get(playlistItemStateFamily(id))).toEqual([items[1]]);
 expect((await store.get(playlistInfoStateFamily(id))).itemCount).toBe(1);
});
