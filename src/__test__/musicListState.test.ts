import { useState } from 'react'
import { renderHook, act } from '@testing-library/react-hooks';
import { musicListState, useMusicListManager } from '../recoilStates/atoms/playlistAtoms'
import { MusicListAction, MusicListActionType, MusicInfo_tmp as MusicInfo } from '../refs/constants'
import { RecoilRoot, useRecoilCallback } from 'recoil';

describe('music list state', () => {
    it('get music list of a playlist', async () => {
        const action: MusicListAction = {
            type: MusicListActionType.GET,
            payload: "4"
        }
        const { result, waitForNextUpdate } = renderHook(useMusiclistTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const musicList = await result.current.getRecoilState(musicListState);
        expect(musicList.length).toBe(5);
    });

    it('APPEND PLAYLIST to music list', async () => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_PLAYLIST,
            payload: "4"
        }
        const { result, waitForNextUpdate } = renderHook(useMusiclistTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const musicList = await result.current.getRecoilState(musicListState);
        expect(musicList.length).toBe(5);
    });

    it('APPEND items to music list', async () => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: [
                {
                    videoID: "11",
                    name: "노래1",
                    query: "노래1"
                },
                {
                    videoID: "22",
                    name: "노래2",
                    query: "노래2"
                }]
        }
        const { result, waitForNextUpdate } = renderHook(useMusiclistTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const musicList = await result.current.getRecoilState(musicListState);
        expect(musicList).toEqual(action.payload);
    });

    it('DELETE items', async () => {
        const appendAction: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: [
                {
                    videoID: "11",
                    name: "노래1",
                    query: "노래1"
                },
                {
                    videoID: "22",
                    name: "노래2",
                    query: "노래2"
                }]
        }
        const deleteAction: MusicListAction = {
            type: MusicListActionType.DELETE,
            payload: 0
        }
        const { result, waitForNextUpdate } = renderHook(useMusiclistTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.manager(appendAction);
        })
        await waitForNextUpdate();
        act(() => {
            result.current.manager(deleteAction);
        })
        await waitForNextUpdate();
        const musicList = await result.current.getRecoilState(musicListState);
        expect(musicList[0].videoID).toBe('22');
    });

    it('Change order', async () => {
        const appendAction: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: [
                {
                    videoID: "11",
                    name: "노래1",
                    query: "노래1"
                },
                {
                    videoID: "22",
                    name: "노래2",
                    query: "노래2"
                }]
        }
        const changeAction: MusicListAction = {
            type: MusicListActionType.CHANGE_ORDER,
            payload: { from: 0, to: 1 }
        }
        const { result, waitForNextUpdate } = renderHook(useMusiclistTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.manager(appendAction);
        })
        await waitForNextUpdate();
        act(() => {
            result.current.manager(changeAction);
        })
        await waitForNextUpdate();
        const musicList = await result.current.getRecoilState(musicListState);
        expect(musicList[0].videoID).toBe('22');
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

const useMusiclistTest = () => {
    const manager_ = useMusicListManager();
    const getRecoilState = useAccessRecoilState();
    const [count, setCount] = useState(0);
    const reload = () => {
        setCount(count + 1);
    }
    const manager = (action: MusicListAction) => {
        manager_(action).then(() => {
            reload();
        })
    }
    return { manager, getRecoilState }
}