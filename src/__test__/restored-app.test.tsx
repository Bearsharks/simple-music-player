import { resetDatabase } from 'test/resetDatabase';
import {render, screen} from '@testing-library/react';
import {Provider} from 'jotai';
import {vi} from 'vitest';
import App from 'app/App';
vi.mock('features/player/api/iframe',()=>({loadIframeApi:async()=>({Player:class {
 constructor(_h:HTMLElement,c:any){queueMicrotask(()=>c.events.onReady());} destroy(){} stopVideo(){} getPlayerState(){return 0;} getDuration(){return 0;} getCurrentTime(){return 0;} getVolume(){return 100;} isMuted(){return false;}
}})}));
beforeEach(async()=>{await resetDatabase();localStorage.clear();window.history.replaceState({},'', '/simple-music-player/');vi.stubGlobal('ResizeObserver',class {observe(){} disconnect(){} unobserve(){}});});
afterEach(()=>vi.unstubAllGlobals());
it('renders the original playlist workspace without a login gate',async()=>{
 render(<Provider><App/></Provider>);
 expect(await screen.findByText('새 재생목록')).toBeInTheDocument();
 expect(screen.queryByText('로그인')).not.toBeInTheDocument();
});
