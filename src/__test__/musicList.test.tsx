import { Suspense, useState } from 'react'
import { act, Renderer, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { curMusicIdxState, curMusicInfoState, musicListState, useMusicListManager } from 'recoilStates/playlistAtoms';
import { MusicInfo, MusicInfoItem, MusicListAction, MusicListActionType } from 'refs/constants';

import { playlistFixture } from 'refs/fixture';

const getRenderHook = <TProps, TResult>(callback: (arg0: TProps) => TResult): RenderHookResult<TProps, TResult, Renderer<TProps>> => {
    return renderHook(callback,
        {
            wrapper: ({ children }) => (
                <>
                    <div>
                        <RecoilRoot override={true}>
                            <Suspense fallback="">{children}</Suspense>
                        </RecoilRoot>
                    </div>
                </>

            ),
        }
    );
}

function useRecoilTest() {
    const musicList: MusicInfoItem[] = useRecoilValue(musicListState);
    const curMusicIdx: number = useRecoilValue(curMusicIdxState);
    const curMusic: MusicInfo = useRecoilValue(curMusicInfoState);
    const manager_ = useMusicListManager();
    const [count, setCount] = useState(0);
    const reload = () => {
        setCount(count + 1);
    }
    const manager = (action: MusicListAction) => {
        manager_(action).then(() => {
            reload();
        })
    }
    return { musicList, curMusicIdx, curMusic, manager, reload };
};

describe('music list manager', () => {
    it('LOAD APPEND ADD', async () => {
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        if (!result.current) await waitForNextUpdate();
        const setAction: MusicListAction = {
            type: MusicListActionType.LOAD_PLAYLIST,
            payload: playlistFixture.id
        }
        act(() => {
            result.current.manager(setAction);
        })
        await waitForNextUpdate();
        //load
        expect(result.current.musicList.length).toBe(playlistFixture.items.length);
        const appendAction: MusicListAction = {
            type: MusicListActionType.APPEND_PLAYLIST,
            payload: playlistFixture.id
        }
        act(() => {
            result.current.manager(appendAction);
        })
        await waitForNextUpdate();
        //append
        expect(result.current.musicList.length).toBe(playlistFixture.items.length * 2);
        for (let i = playlistFixture.items.length; i < playlistFixture.items.length * 2; i++) {
            expect(result.current.musicList[i].name).toBe(playlistFixture.items[i - playlistFixture.items.length].name);
        }
        const addToNextAction: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT_PLAYLIST,
            payload: playlistFixture.id
        }
        act(() => {
            result.current.manager(addToNextAction);
        })
        await waitForNextUpdate();
        //add to next
        expect(result.current.musicList.length).toBe(playlistFixture.items.length * 3);
        for (let i = 1; i <= playlistFixture.items.length; i++) {
            expect(result.current.musicList[i].name).toBe(playlistFixture.items[i - 1].name);
        }
    });
    it('APPEND ADD', async () => {
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        if (!result.current) await waitForNextUpdate();
        const appendAction: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: playlistFixture.items
        }
        act(() => {
            result.current.manager(appendAction);
        })
        await waitForNextUpdate();
        expect(result.current.musicList.length).toBe(playlistFixture.items.length);
        const apptonext: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT,
            payload: playlistFixture.items
        }
        act(() => {
            result.current.manager(apptonext);
        })
        await waitForNextUpdate();
        for (let i = 1; i <= playlistFixture.items.length; i++) {
            expect(result.current.musicList[i].name).toBe(playlistFixture.items[i - 1].name);
        }
    });

    it('delete', async () => {
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        if (!result.current) await waitForNextUpdate();
        const setAction: MusicListAction = {
            type: MusicListActionType.LOAD_PLAYLIST,
            payload: playlistFixture.id
        }
        act(() => {
            result.current.manager(setAction);
        })
        await waitForNextUpdate();

        const delAction: MusicListAction = {
            type: MusicListActionType.DELETE,
            payload: playlistFixture.items
        }
        act(() => {
            result.current.manager(delAction);
        })
        await waitForNextUpdate();
        expect(result.current.musicList.length).toBe(0);
    });
});


