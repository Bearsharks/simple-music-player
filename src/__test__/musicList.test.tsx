import { act, renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { ReactNode } from 'react';
import { queueState, useMusicListManager, useCurMusicManager, removeFromQueue } from 'features/queue/model/queue';
import { MusicListActionType as T, MusicInfoActionType as M } from 'shared/model/constants';
import { playlistFixture } from 'test/fixture';
import { reset } from 'shared/api/testAPI';
function setup() {
  const store = createStore();
  const wrapper = ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;
  const hooks = renderHook(() => ({queue: useMusicListManager(), current: useCurMusicManager()}), {wrapper});
  return { store, hooks };
}
beforeEach(reset);
it('loads, appends and inserts playlists with distinct queue keys', async () => {
  const {store,hooks}=setup();
  await act(() => hooks.result.current.queue({type:T.LOAD_PLAYLIST,payload:playlistFixture.id}));
  const n=playlistFixture.items.length;
  expect(store.get(queueState).items).toHaveLength(n);
  await act(() => hooks.result.current.queue({type:T.APPEND_PLAYLIST,payload:playlistFixture.id}));
  await act(() => hooks.result.current.queue({type:T.ADD_TO_NEXT_PLAYLIST,payload:playlistFixture.id}));
  const {items}=store.get(queueState);
  expect(items).toHaveLength(n*3);
  expect(new Set(items.map(i=>i.key)).size).toBe(items.length);
  expect(items[1].name).toBe(playlistFixture.items[0].name);
});
it('appends raw items, inserts next, reorders while preserving current item', async () => {
 const {store,hooks}=setup();
 await act(() => hooks.result.current.queue({type:T.APPEND_ITEMS,payload:playlistFixture.items}));
 await act(() => hooks.result.current.queue({type:T.ADD_TO_NEXT,payload:playlistFixture.items}));
 const key=store.get(queueState).items[0].key;
 await act(() => hooks.result.current.queue({type:T.CHANGE_ORDER,payload:{from:0,to:2}}));
 expect(store.get(queueState).index).toBe(2);
 expect(store.get(queueState).items[2].key).toBe(key);
});
it('deletes last current track and keeps a valid selection; deletes all', async () => {
 const {store,hooks}=setup();
 await act(() => hooks.result.current.queue({type:T.APPEND_ITEMS,payload:playlistFixture.items}));
 await act(() => hooks.result.current.current({type:M.SET_IDX,payload:1}));
 await act(() => hooks.result.current.queue({type:T.DELETE,payload:[store.get(queueState).items[1]]}));
 expect(store.get(queueState).index).toBe(0);
 await act(() => hooks.result.current.queue({type:T.DELETE,payload:store.get(queueState).items}));
 expect(store.get(queueState)).toEqual({items:[],index:0});
});
it('does not mutate caller arrays during deletion', () => {
 const items=playlistFixture.items.map((v,i)=>({...v,key:String(i)}));
 const result=removeFromQueue(items,1,new Set(['0']));
 expect(items).toHaveLength(2);expect(result.index).toBe(0);
});
it('concurrent playlist appends retain both results', async () => {
 const {store,hooks}=setup();
 await act(async () => { await Promise.all([1,2].map(()=>hooks.result.current.queue({type:T.APPEND_PLAYLIST,payload:playlistFixture.id}))); });
 expect(store.get(queueState).items).toHaveLength(playlistFixture.items.length*2);
});
