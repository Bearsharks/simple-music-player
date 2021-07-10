import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { renderHook, act } from "@testing-library/react-hooks";
import { useRecoilValue, RecoilRoot, useRecoilState, useSetRecoilState } from "recoil";
import { useEffect, useRef, useCallback } from 'react';
import musicListStateManager from '../recoilStates/musicListStateManager';
import { musicListState, curMusicInfoState } from "../recoilStates/atoms/musicListAtoms"
import musicListFixture from './fixtures/MusicListFixture'

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
                const [musicList, setMusicList] = useRecoilStateWithPromise(musicListState);
                const [curMusicInfo, setCurMusicInfo] = useRecoilStateWithPromise(curMusicInfoState);
                const goNext = musicListStateManager.useGoNextMusic();
                const goPrev = musicListStateManager.useGoPrevMusic();
                const reorderMusicList = musicListStateManager.useReorderMusicList();
                const initState = (idx) => {
                    setCurMusicInfo({
                        id: musicList[idx].id,
                        idx: idx
                    });
                }
                useEffect(() => {
                    setMusicList(musicListFixture);
                }, [setMusicList])
                return { goNext, goPrev, initState, reorderMusicList, curMusicInfo, musicList };
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

    test("reorderMusicList(start,end), pop start, start will be inserted to after end", () => {

        act(() => {
            testComponent.current.reorderMusicList(0, 2);
        });

        expect(testComponent.current.musicList).toEqual([
            {
                q: `dynamite 방탄소년단 official audio`,
                id: 2,
            },
            {
                q: `coin 아이유 official audio`,
                id: 3,
            },
            {
                q: `소중한 사람 심규선 official audio`,
                id: 1,
            },
        ]);
    });
});
