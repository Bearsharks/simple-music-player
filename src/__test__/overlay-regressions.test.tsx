import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider, createStore } from 'jotai';
import { Suspense } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import api from 'shared/api/localAPI';
import { resetDatabase } from 'test/resetDatabase';
import Modal from 'features/overlays/Modal';
import Popup from 'features/overlays/Popup';
import Notice from 'features/overlays/Notice';
import { ModalKind, useModalManager, useOpenMusicOptionsPopup } from 'features/overlays/PopupStates';
import PlaylistPage from 'features/playlists/pages/PlaylistPage';
import { playlistInfosState } from 'features/playlists/model/playlistAtoms';
import { queueState } from 'features/queue/model/queue';
import MusicItem from 'features/queue/ui/musicList/MusicItem';
import Dialog from 'shared/ui/Dialog';
import { useState } from 'react';
const song={key:'playing-song',videoID:'abcdefghijk',name:'저장한 곡',owner:'',query:'',thumbnail:''};
const info={id:'',name:'내 목록',description:'',itemCount:1,thumbnails:[]};
function Launchers() {
 const modal=useModalManager();const menu=useOpenMusicOptionsPopup();
 return <><button onClick={()=>modal(ModalKind.CreatePlaylist)}>새 목록 열기</button>
  <button onClick={event=>menu(event.currentTarget,[song])}>곡 메뉴 열기</button><Modal/><Popup/></>;
}
async function setup() {
 const store=createStore();await store.get(playlistInfosState);
 await act(async()=>{render(<Provider store={store}><Launchers/></Provider>);});
 return store;
}
beforeEach(async()=>{await resetDatabase();});
afterEach(()=>vi.restoreAllMocks());

it('creates canonical empty metadata through the actual form and restores focus after closing', async()=>{
 const user=userEvent.setup();await setup();const opener=screen.getByRole('button',{name:'새 목록 열기'});
 await user.click(opener);const dialog=screen.getByRole('dialog',{name:'새 재생목록'});
 expect(screen.getByLabelText('제목')).toHaveFocus();
 await user.type(screen.getByLabelText('제목'),'  새로 만든 목록  ');
 await user.click(within(dialog).getByRole('button',{name:'만들기'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 expect(opener).toHaveFocus();
 expect(await api.getPlaylistInfos()).toMatchObject([{name:'새로 만든 목록',description:'',itemCount:0,thumbnails:[],createdAt:expect.any(Number)}]);
});

it('traps Tab, closes on Escape and restores the invoking button without changing data', async()=>{
 const user=userEvent.setup();await setup();const opener=screen.getByRole('button',{name:'새 목록 열기'});
 await user.click(opener);const title=screen.getByLabelText('제목');
 await user.tab({shift:true});expect(screen.getByRole('button',{name:'만들기'})).toHaveFocus();
 await user.tab();expect(title).toHaveFocus();
 expect(opener.closest('[inert]')).not.toBeNull();
 await user.keyboard('{Escape}');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(opener).toHaveFocus();expect(opener.closest('[inert]')).toBeNull();
 expect(await api.getPlaylistInfos()).toEqual([]);
});

it('keeps failed save input, rejects repeated submit and allows a successful retry', async()=>{
 const user=userEvent.setup();await setup();await user.click(screen.getByRole('button',{name:'새 목록 열기'}));
 await user.type(screen.getByLabelText('제목'),'보존할 제목');
 let reject!: (error:Error)=>void;
 const create=vi.spyOn(api,'createPlaylist').mockImplementationOnce(()=>new Promise((_resolve,no)=>{reject=no;}));
 const form=screen.getByRole('button',{name:'만들기'}).closest('form')!;
 fireEvent.submit(form);fireEvent.submit(form);
 await waitFor(()=>expect(create).toHaveBeenCalledOnce());expect(screen.getByRole('button',{name:'저장 중…'})).toBeDisabled();
 await user.keyboard('{Escape}');expect(screen.getByRole('dialog')).toBeInTheDocument();
 await act(async()=>reject(new Error('저장 공간 부족')));
 expect(screen.getByRole('alert')).toHaveTextContent('저장 공간 부족');expect(screen.getByLabelText('제목')).toHaveValue('보존할 제목');
 await user.click(screen.getByRole('button',{name:'만들기'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 expect(await api.getPlaylistInfos()).toHaveLength(1);
});

it('supports song playback and menus from the keyboard without a mouse-only click target', async()=>{
 const user=userEvent.setup();const play=vi.fn(),options=vi.fn();
 render(<MusicItem idx={2} item={song} playMusic={play} openOptionsPopup={options}/>);
 await user.tab();await user.keyboard(' ');expect(play).toHaveBeenCalledWith(2);
 await user.tab();await user.keyboard('{Enter}');expect(play).toHaveBeenCalledTimes(2);
 await user.tab();await user.keyboard('{Enter}');expect(options).toHaveBeenCalledWith(screen.getByRole('button',{name:'저장한 곡 더보기'}),[song]);
});

it('opens a keyboard menu, restores focus on Escape, and saves to the selected playlist after a failed append', async()=>{
 const id=await api.createPlaylist(info,[]);const user=userEvent.setup();await setup();
 const opener=screen.getByRole('button',{name:'곡 메뉴 열기'});await user.click(opener);
 expect(screen.getByRole("menuitem",{name:'다음 음악으로 재생'})).toHaveFocus();
 await user.keyboard('{Escape}');expect(screen.queryByRole("menu",{name:'선택 메뉴'})).not.toBeInTheDocument();expect(opener).toHaveFocus();
 await user.keyboard('{Enter}');await user.keyboard('{ArrowDown}{ArrowDown}');await act(async()=>{await user.keyboard(' ');});
 const dialog=await screen.findByRole('dialog',{name:'재생목록에 추가'});
 await user.click(await within(dialog).findByRole('button',{name:'내 목록 선택'}));
 expect(screen.getByLabelText('선택한 재생목록')).toHaveValue('내 목록');
 const update=vi.spyOn(api,'updatePlaylist').mockRejectedValueOnce(new Error('저장 실패'));
 await user.click(within(dialog).getByRole('button',{name:'추가'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패');expect(screen.getByLabelText('선택한 재생목록')).toHaveValue('내 목록');
 await user.click(within(dialog).getByRole('button',{name:'추가'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 expect(await api.getPlaylistItems(id)).toMatchObject([{videoID:song.videoID}]);expect(update).toHaveBeenCalledTimes(2);
});

async function detail(id:string) {
 const store=createStore();await store.get(playlistInfosState);store.set(queueState,{items:[song],index:0});
 await act(async()=>render(<Provider store={store}><MemoryRouter initialEntries={[`/playlist/${id}`]}>
  <Suspense fallback="loading"><Routes><Route path="/playlist/:id" element={<PlaylistPage/>}/><Route path="/" element={<h1>라이브러리 홈</h1>}/></Routes></Suspense>
  <Modal/><Popup/><Notice/>
 </MemoryRouter></Provider>));
 return store;
}

it('protects playlist deletion, keeps failure retryable, then returns from the deleted route without clearing the queue', async()=>{
 const id=await api.createPlaylist(info,[song]);const store=await detail(id);const user=userEvent.setup();
 await screen.findByRole('heading',{name:'내 목록'});
 const opener=screen.getByRole('button',{name:'더보기'});
 await user.click(opener);await user.click(screen.getByRole("menuitem",{name:'재생목록 삭제'}));
 expect(await screen.findByRole('dialog',{name:'재생목록 삭제'})).toHaveTextContent('“내 목록” 재생목록과 저장한 1곡');
 await user.click(screen.getByRole('button',{name:'취소'}));expect(await api.getPlaylistItems(id)).toHaveLength(1);expect(opener).toHaveFocus();
 await user.click(opener);await user.click(screen.getByRole("menuitem",{name:'재생목록 삭제'}));
 const remove=vi.spyOn(api,'deletePlaylist').mockRejectedValueOnce(new Error('삭제 실패'));
 await user.click(await screen.findByRole('button',{name:'삭제'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('삭제 실패');expect(screen.getByRole('dialog')).toBeInTheDocument();
 expect(await api.getPlaylistItems(id)).toHaveLength(1);
 await user.click(screen.getByRole('button',{name:'삭제'}));
 await screen.findByRole('heading',{name:'라이브러리 홈'});
 expect(remove).toHaveBeenCalledTimes(2);expect(await api.getPlaylistInfos()).toEqual([]);
 expect(store.get(queueState)).toEqual({items:[song],index:0});
});

it('deletes a stored track without confirmation and retries Undo while preserving the queue', async()=>{
 const id=await api.createPlaylist(info,[song]);const store=await detail(id);const user=userEvent.setup();
 await user.click(await screen.findByRole('button',{name:'저장한 곡 더보기'}));
 await user.click(screen.getByRole("menuitem",{name:'재생목록에서 삭제'}));
 const undo=await screen.findByRole('button',{name:'실행 취소'});
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(await api.getPlaylistItems(id)).toEqual([]);
 const update=vi.spyOn(api,'updatePlaylist').mockRejectedValueOnce(new Error('복원 실패'));
 await user.click(undo);
 expect(await screen.findByRole('alert')).toHaveTextContent('복원 실패');expect(undo).toBeEnabled();
 await user.click(undo);
 await waitFor(async()=>expect(await api.getPlaylistItems(id)).toHaveLength(1));
 expect(update).toHaveBeenCalledTimes(2);expect(store.get(queueState).items).toEqual([song]);
});

it('shows an actionable missing-playlist state when opening a deleted URL', async()=>{
 await detail('missing');const user=userEvent.setup();
 expect(await screen.findByRole('heading',{name:'재생목록을 찾을 수 없습니다'})).toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'라이브러리로 돌아가기'}));
 expect(screen.getByRole('heading',{name:'라이브러리 홈'})).toBeInTheDocument();
});

it('replaces the playlist picker with creation and import dialogs without leaving inert or scroll locks', async()=>{
 const user=userEvent.setup();await setup();const opener=screen.getByRole('button',{name:'곡 메뉴 열기'});
 const overflow=document.body.style.overflow;
 await user.click(opener);
 await act(async()=>{await user.click(screen.getByRole("menuitem",{name:'재생목록에 추가'}));});
 const choice=await screen.findByRole('button',{name:'새 재생목록 선택'});
 await user.click(choice);await user.click(screen.getByRole('button',{name:'추가'}));
 expect(await screen.findByRole('dialog',{name:'새 재생목록'})).toBeInTheDocument();
 expect(screen.getAllByRole('dialog')).toHaveLength(1);expect(screen.getByLabelText('제목')).toHaveFocus();
 expect(opener.closest('[inert]')).not.toBeNull();expect(document.body.style.overflow).toBe('hidden');
 await user.click(screen.getByRole('button',{name:'유튜브에서 가져오기'}));
 expect(screen.getByRole('dialog',{name:'재생목록 URL 가져오기'})).toBeInTheDocument();
 expect(screen.getAllByRole('dialog')).toHaveLength(1);expect(screen.getByLabelText('공개 재생목록 URL')).toHaveFocus();
 await user.keyboard('{Escape}');
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(document.querySelector('[data-dialog-layer]')).toBeNull();
 expect(opener.closest('[inert]')).toBeNull();expect(document.body.style.overflow).toBe(overflow);expect(opener).toHaveFocus();
 await user.click(screen.getByRole('button',{name:'새 목록 열기'}));
 expect(screen.getByLabelText('제목')).toHaveFocus();await user.keyboard('{Escape}');
 expect(document.body.style.overflow).toBe(overflow);expect(screen.getByRole('button',{name:'새 목록 열기'})).toHaveFocus();
});

it('ignores CSS-hidden elements when moving initial focus or wrapping Tab', async()=>{
 function Example() {
  const [open,setOpen]=useState(false);
  return <><button onClick={()=>setOpen(true)}>열기</button>{open && <Dialog label="키보드 검증" onClose={()=>setOpen(false)}>
   <div style={{display:'none'}}><button>숨겨진 첫 버튼</button></div>
   <input aria-label="보이는 입력"/><button>마지막 버튼</button><button style={{visibility:'hidden'}}>숨겨진 마지막 버튼</button>
  </Dialog>}</>;
 }
 const user=userEvent.setup();render(<Example/>);await user.click(screen.getByRole('button',{name:'열기'}));
 expect(screen.getByLabelText('보이는 입력')).toHaveFocus();await user.tab({shift:true});
 expect(screen.getByRole('button',{name:'마지막 버튼'})).toHaveFocus();
 await user.keyboard('{Escape}');expect(screen.getByRole('button',{name:'열기'})).toHaveFocus();
});

it("returns deletion focus to the next track, then to add when the list becomes empty", async () => {
  const second = {
    ...song,
    key: "second",
    videoID: "lmnopqrstuv",
    name: "남은 곡",
  };
  const id = await api.createPlaylist(info, [song, second]);
  await detail(id);
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "저장한 곡 더보기" }),
  );
  await user.click(screen.getByRole("menuitem", { name: "재생목록에서 삭제" }));
  await waitFor(() =>
    expect(document.querySelector("[data-track-focus]")).toHaveFocus(),
  );
  expect(document.activeElement).toHaveAttribute("aria-label", "남은 곡 재생");
  await user.click(screen.getByRole("button", { name: "남은 곡 더보기" }));
  await user.click(screen.getByRole("menuitem", { name: "재생목록에서 삭제" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "곡 추가 열기" })).toHaveFocus(),
  );
});

it("appends a whole saved playlist at the queue end without replacing its current track", async () => {
  const second = {
    ...song,
    key: "second",
    videoID: "lmnopqrstuv",
    name: "추가할 곡",
  };
  const id = await api.createPlaylist(info, [second]);
  const store = await detail(id);
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "더보기" }));
  await user.click(screen.getByRole("menuitem", { name: "대기열 끝에 추가" }));
  await waitFor(() => expect(store.get(queueState).items).toHaveLength(2));
  expect(store.get(queueState).items.map((item) => item.name)).toEqual([
    "저장한 곡",
    "추가할 곡",
  ]);
  expect(store.get(queueState).index).toBe(0);
  expect(store.get(queueState).items[0].key).toBe(song.key);
});
