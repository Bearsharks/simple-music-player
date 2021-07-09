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

    test("after goNext(), musicInfo will be nextinfo", () => {
        const { result } = renderHook(
            () => {
                const [musicList, setMusicList] = useRecoilStateWithPromise(musicListState);
                const [curMusicInfo, setCurMusicInfo] = useRecoilStateWithPromise(curMusicInfoState);
                const goNext = musicListStateManager.useGoNextMusic();
                const goPrev = musicListStateManager.useGoPrevMusic();
                const initState = (list, idx) => {
                    setMusicList(list);
                    setCurMusicInfo({
                        id: list[idx].id,
                        idx: idx
                    });
                }
                useEffect(() => {
                    initState(musicListFixture, 0);
                }, [setMusicList, setCurMusicInfo]);
                return { goNext, goPrev, curMusicInfo };
            },
            {
                wrapper: RecoilRoot
            }
        );
        act(() => {
            result.current.goNext();
        });

        expect(result.current.curMusicInfo).toEqual({
            id: musicListFixture[1].id,
            idx: 1
        });
        act(() => {
            result.current.goPrev();
        });

        expect(result.current.curMusicInfo).toEqual({
            id: musicListFixture[0].id,
            idx: 0
        });
    });
    test("마지막 노래라면 goNext()해도 변하지 않아야한다.", () => {
        const { result } = renderHook(
            () => {
                const [musicList, setMusicList] = useRecoilState(musicListState);
                const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
                const goNext = musicListStateManager.useGoNextMusic();
                const initState = (list, idx) => {
                    setMusicList(list);
                    setCurMusicInfo({
                        id: list[idx].id,
                        idx: idx
                    });
                }
                useEffect(() => {
                    initState(musicListFixture, musicListFixture.length - 1);
                }, [setMusicList, setCurMusicInfo]);
                return { goNext, initState, curMusicInfo };
            },
            {
                wrapper: RecoilRoot
            }
        );
        act(() => {
            result.current.goNext();
        });

        expect(result.current.curMusicInfo).toEqual({
            id: musicListFixture[musicListFixture.length - 1].id,
            idx: musicListFixture.length - 1
        });
    });
});
