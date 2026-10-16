import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { vi } from 'vitest';
import { StrictMode } from 'react';
import App from 'app/App';
import { playlistFixture } from 'test/fixture';
import { reset } from 'shared/api/testAPI';
const destroy = vi.fn();
vi.mock('features/player/api/iframe', () => ({ loadIframeApi: async () => ({ Player: class {
    constructor(_host: HTMLElement, config: any) { queueMicrotask(()=>config.events.onReady()); }
    destroy=destroy; stopVideo=vi.fn(); getPlayerState=()=>0; loadVideoById=vi.fn();
}}) }));
beforeEach(()=>{reset(); window.history.replaceState({}, '', '/simple-music-player/'); vi.stubGlobal('ResizeObserver', class { observe(){} unobserve(){} disconnect(){} });});
afterEach(()=>vi.unstubAllGlobals());
it('renders the authenticated fixture app with playlist and survives strict mode cleanup', async()=>{
 const {unmount}=render(<StrictMode><Provider><App/></Provider></StrictMode>);
 expect(await screen.findByText(playlistFixture.name)).toBeInTheDocument();
 await waitFor(()=>expect(document.getElementById('player')).toBeInTheDocument());
 unmount();expect(destroy).toHaveBeenCalled();
});
