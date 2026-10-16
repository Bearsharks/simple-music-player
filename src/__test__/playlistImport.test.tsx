import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {Provider} from 'jotai';
import {vi} from 'vitest';
import PlaylistImport from 'features/youtube/ui/PlaylistImport';
import api from 'shared/api/localAPI';
vi.mock('features/player/api/iframe',()=>({loadIframeApi:async()=>({Player:class {
 constructor(_h:HTMLElement,c:any){queueMicrotask(()=>c.events.onReady());} getPlaylist(){return ['abcdefghijk','lmnopqrstuv'];} destroy(){}
}})}));
beforeEach(()=>localStorage.clear());
it('imports player-provided IDs into editable local storage without login',async()=>{
 const close=vi.fn(); render(<Provider><PlaylistImport close={close}/></Provider>);
 fireEvent.change(screen.getByLabelText('공개 재생목록 URL'),{target:{value:'https://youtube.com/playlist?list=PLtest123'}});
 fireEvent.change(screen.getByLabelText('목록 이름'),{target:{value:'내 음악'}});
 fireEvent.click(screen.getByRole('button',{name:'미리보기'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'로컬에 저장'})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:'로컬에 저장'}));
 await waitFor(()=>expect(close).toHaveBeenCalledOnce());
 const lists=await api.getPlaylistInfos(); expect(lists[0].name).toBe('내 음악');
 expect((await api.getPlaylistItems(lists[0].id)).map(i=>i.videoID)).toEqual(['abcdefghijk','lmnopqrstuv']);
});
