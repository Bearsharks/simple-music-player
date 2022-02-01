import { useState } from 'react'
import { renderHook, act } from '@testing-library/react-hooks';
import { curMusicInfoState, useCurMusicManager, useMusicListManager, musicListState, curMusicIdxState } from '../recoilStates/atoms/playlistAtoms'
import { MusicInfoAction, MusicInfoActionType, MusicInfo } from '../refs/constants'
import { RecoilRoot, useRecoilCallback } from 'recoil';

describe('current music info', () => {
    it('go next music', async () => {
        const { result, waitForNextUpdate } = renderHook(useCurMusicTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.setRecoilState(musicListState, musicInfoFixture);
            result.current.setRecoilState(curMusicIdxState, musicInfoFixture.length - 2);
        })
        const action: MusicInfoAction = {
            type: MusicInfoActionType.NEXT
        }
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const curMusicInfo = await result.current.getRecoilState(curMusicInfoState);
        expect(curMusicInfo).toEqual(musicInfoFixture[musicInfoFixture.length - 1]);

        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const lastMusicInfo = await result.current.getRecoilState(curMusicInfoState);
        expect(lastMusicInfo).toEqual(musicInfoFixture[musicInfoFixture.length - 1]);
    });

    it('go prev music', async () => {
        const { result, waitForNextUpdate } = renderHook(useCurMusicTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.setRecoilState(musicListState, musicInfoFixture);
            result.current.setRecoilState(curMusicIdxState, 1);
        })
        const action: MusicInfoAction = {
            type: MusicInfoActionType.PREV
        }
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const firstMusicInfo = await result.current.getRecoilState(curMusicInfoState);
        expect(firstMusicInfo).toEqual(musicInfoFixture[0]);

        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const lastMusicInfo = await result.current.getRecoilState(curMusicInfoState);
        expect(lastMusicInfo).toEqual(musicInfoFixture[0]);
    });

    it('set musicInfo', async () => {
        const { result, waitForNextUpdate } = renderHook(useCurMusicTest, { wrapper: RecoilRoot });
        act(() => {
            result.current.setRecoilState(musicListState, musicInfoFixture);
            result.current.setRecoilState(curMusicIdxState, 1);
        })
        const action: MusicInfoAction = {
            type: MusicInfoActionType.SET,
            payload: {
                name: "new",
                videoID: "new",
                query: "new",
            }
        }
        act(() => {
            result.current.manager(action);
        })
        await waitForNextUpdate();
        const musicInfo = await result.current.getRecoilState(curMusicInfoState);
        expect(musicInfo).toEqual(action.payload);

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
const musicInfoFixture: MusicInfo[] = [
    {
        videoID: "11",
        name: "노래1",
        query: "노래1"
    },
    {
        videoID: "22",
        name: "노래2",
        query: "노래2"
    },
    {
        videoID: "33",
        name: "노래3",
        query: "노래3"
    },
    {
        videoID: "44",
        name: "노래4",
        query: "노래4"
    },
    {
        videoID: "55",
        name: "노래5",
        query: "노래5"
    }
];
const useSetRecoilState = function () {
    //create, delete, update
    return useRecoilCallback(({ set }) => async (recoilState: any, value: any): Promise<any> => {
        return set(recoilState, value);
    });
}

const useCurMusicTest = () => {
    const manager_ = useCurMusicManager();
    const mlmanager = useMusicListManager();
    const getRecoilState = useAccessRecoilState();
    const setRecoilState = useSetRecoilState();
    const [count, setCount] = useState(0);
    const reload = () => {
        setCount(count + 1);
    }
    const manager = (action: MusicInfoAction) => {
        manager_(action).then(() => {
            reload();
        })
    }
    return { manager, getRecoilState, setRecoilState }
}