import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { renderHook, act } from "@testing-library/react-hooks";
import { useRecoilValue, RecoilRoot, useRecoilState, useSetRecoilState } from "recoil";
import { useEffect, useRef, useCallback } from 'react';
import musicListStateManager from '../recoilStates/musicListStateManager';
import { musicListState, curMusicInfoState } from "../recoilStates/atoms/musicListAtoms"
import { musicListFixture, queryListFixture } from './fixtures/MusicListFixture'

const useRecoilStateWithPromise = initialState => {
    const [state, setState] = useRecoilState(initialState);
    const resolverRef = useRef(null);

    useEffect(() => {
        if (resolverRef.current) {
            resolverRef.current(state);
            resolverRef.current = null;
        }
        /**
         * Since a state update could be triggered with the exact same state again,
         * it's not enough to specify state as the only dependency of this useEffect.
         * That's why resolverRef.current is also a dependency, because it will guarantee,
         * that handleSetState was called in previous render
         */
    }, [resolverRef.current, state]);

    const handleSetState = useCallback(
        stateAction => {
            setState(stateAction);
            return new Promise(resolve => {
                resolverRef.current = resolve;
            });
        },
        [setState]
    );

    return [state, handleSetState];
};



describe('MusicList State Test', () => {
    let testComponent;
    beforeEach(() => {
        const { result } = renderHook(
            () => {
                const [musicList, setMusicList] = useRecoilState(musicListState);
                const [curMusicInfo, setCurMusicInfo] = useRecoilStateWithPromise(curMusicInfoState);
                const goNext = musicListStateManager.useGoNextMusic();
                const goPrev = musicListStateManager.useGoPrevMusic();
                const reorderMusicList = musicListStateManager.useReorderMusicList();
                const modMusicList = musicListStateManager.useModMusicList();
                const doPlay = jest.fn();
                const playMusic = musicListStateManager.usePlayMusic(doPlay);
                const appendMusicList = musicListStateManager.useAppendMusicList();
                const initState = (idx) => {
                    setCurMusicInfo({
                        id: musicList[idx].id,
                        idx: idx
                    });
                }
                useEffect(() => {
                    setMusicList(musicListFixture);
                }, [setMusicList])
                return { goNext, goPrev, initState, reorderMusicList, curMusicInfo, musicList, playMusic, doPlay, modMusicList, appendMusicList };
            },
            {
                wrapper: RecoilRoot
            }
        );
        testComponent = result;
    })
    test("at the last, after goNext(), musicInfo will not be change", () => {
        act(() => {
            testComponent.current.initState(musicListFixture.length - 1);
            testComponent.current.goNext();
        });

        expect(testComponent.current.curMusicInfo).toEqual({
            id: musicListFixture[musicListFixture.length - 1].id,
            idx: musicListFixture.length - 1
        });
    });
    test("at the firat, after goPrev(), musicInfo will not be change", () => {
        act(() => {
            testComponent.current.initState(0);
            testComponent.current.goPrev();
        });

        expect(testComponent.current.curMusicInfo).toEqual({
            id: musicListFixture[0].id,
            idx: 0
        });
    });
    test("after goNext(), musicInfo will be nextinfo", () => {
        act(() => {
            testComponent.current.initState(0);
            testComponent.current.goNext();
        });

        expect(testComponent.current.curMusicInfo).toEqual({
            id: musicListFixture[1].id,
            idx: 1
        });
    });
    test("after goPrev(), musicInfo will be previnfo", () => {

        act(() => {
            testComponent.current.initState(2);
            testComponent.current.goPrev();
        });

        expect(testComponent.current.curMusicInfo).toEqual({
            id: musicListFixture[1].id,
            idx: 1
        });
    });

    test("reorderMusicList(start,end), start value will be pop & inserted to after end", () => {

        act(() => {
            testComponent.current.reorderMusicList(0, 2);
        });

        expect(testComponent.current.musicList).toEqual([
            {
                q: `dynamite 방탄소년단 official audio`,
                id: null,
            },
            {
                q: `coin 아이유 official audio`,
                id: null,
            },
            {
                q: `소중한 사람 심규선 official audio`,
                id: null,
            },
        ]);
    });

    test("call playmusic, then playmusic callback will be called", () => {
        act(() => {
            testComponent.current.playMusic(2);
        });
        expect(testComponent.current.doPlay).toHaveBeenCalledWith(musicListStateManager.getMusicInfoByIdx(musicListFixture, 2));
        act(() => {
            testComponent.current.playMusic(1);
        });
        expect(testComponent.current.doPlay).toHaveBeenCalledWith(musicListStateManager.getMusicInfoByIdx(musicListFixture, 1));
    });

    test("modMusicList test, key is constant", () => {
        act(() => {
            testComponent.current.appendMusicList(queryListFixture);
            testComponent.current.modMusicList(4, { id: "testval" });
        });
        expect(testComponent.current.musicList[4].id).toEqual("testval");
        const originkey = testComponent.current.musicList[4].key;
        act(() => {
            testComponent.current.modMusicList(4, { key: "testkey" });
        });
        expect(testComponent.current.musicList[4].key).toEqual(originkey);
    });
});
