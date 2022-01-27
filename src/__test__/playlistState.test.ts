import { atom, snapshot_UNSTABLE } from 'recoil'
import { useState } from 'react'
import { renderHook, act } from '@testing-library/react-hooks';
import { playlistIDsState, usePlaylistManager, playlistInfosState, playlistItemsState } from '../recoilStates/atoms/playlistAtoms'
import { PlaylistInfo, PlaylistAction, PlaylistActionType, MusicInfo } from '../refs/constants'
import { RecoilRoot, useRecoilValue, useRecoilCallback, useRecoilState } from 'recoil';

describe('playlist atom', () => {
    it('get playlist ids', async () => {
        const { result, waitForNextUpdate } = renderHook(usePlaylistTest, { wrapper: RecoilRoot }
        );
        expect(result.current.ids.length).toBe(4);
    });
    it('create playlist', async () => {
        const { result, waitForNextUpdate } = renderHook(usePlaylistTest, { wrapper: RecoilRoot }
        );
        const action: PlaylistAction = {
            type: PlaylistActionType.CREATE,
            payload: {
                info: { id: "5", name: "5번", description: "5번 설명" },
                items: [{
                    videoID: "55",
                    name: "노래5",
                    query: "노래5"
                }]
            }
        }
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate({
            timeout: 2000
        });
        expect(result.current.ids.length).toBe(5);
        const info = await result.current.getRecoilState(playlistInfosState, action.payload.info.id);
        expect(info).toEqual(action.payload.info);
        const items = await result.current.getRecoilState(playlistItemsState, action.payload.info.id);
        expect(items.length).toEqual(5);
    });

    it('delete playlist', async () => {
        const { result, waitForNextUpdate } = renderHook(usePlaylistTest, { wrapper: RecoilRoot });
        const action: PlaylistAction = {
            type: PlaylistActionType.DELETE,
            payload: "4"
        }
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        expect(result.current.ids.length).toBe(3);
    });

    it('update playlist', async () => {
        const { result, waitForNextUpdate } = renderHook(usePlaylistTest, { wrapper: RecoilRoot });
        const action: PlaylistAction = {
            type: PlaylistActionType.UPDATE,
            payload: {
                info: { id: "4", name: "5번", description: "5번 설명" },
                items: [{
                    videoID: "55",
                    name: "노래5",
                    query: "노래5"
                }]
            }
        }
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const info = await result.current.getRecoilState(playlistInfosState, action.payload.info.id);
        expect(info).toEqual(action.payload.info);
        const items = await result.current.getRecoilState(playlistItemsState, action.payload.info.id);
        expect(items).toEqual(action.payload.items);
    });
});

const useAccessRecoilState = function () {
    //create, delete, update
    return useRecoilCallback(({ snapshot }) => async (recoilState: any, key?: any): Promise<any> => {
        if (key) {
            return await snapshot.getPromise(recoilState(key));
        }
        return await snapshot.getPromise(recoilState);

    });
}

const usePlaylistTest = () => {
    const manager_ = usePlaylistManager();
    const ids = useRecoilValue(playlistIDsState);
    const [count, setCount] = useState(0);
    const getRecoilState = useAccessRecoilState();
    const reload = () => {
        setCount(count + 1);
    }
    const manager = (action: PlaylistAction) => {
        manager_(action).then(() => {
            reload();
        })
    }
    return { manager, ids, getRecoilState } //{ manager, ids, items, info }
}