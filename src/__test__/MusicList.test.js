import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { renderHook, act } from "@testing-library/react-hooks";
import { useRecoilValue, RecoilRoot, useRecoilState, useSetRecoilState } from "recoil";
import { useEffect, useRef, useCallback } from 'react';
import { musicListStateManager, usePlayMusic, getMusicInfoByIdx } from '../recoilStates/musicListStateManager';
import { musicListState, curMusicInfoState } from "../recoilStates/atoms/musicListAtoms"
import { musicListFixture, queryListFixture } from './fixtures/MusicListFixture'





describe('MusicList State Test', () => {
    let testComponent;
    beforeEach(() => {
        const { result } = renderHook(
            () => {
                const [musicList, setMusicList] = useRecoilState(musicListState);
                const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
                const mlsm = new musicListStateManager([musicList, setMusicList], [curMusicInfo, setCurMusicInfo]);
                const doPlay = jest.fn();
                const playMusic = usePlayMusic(doPlay);
                const initCurMusicInfo = (idx) => {
                    setCurMusicInfo({
                        id: musicList[idx].id,
                        key: musicList[idx].key,
                        idx: idx
                    });
                }
                return { mlsm, initCurMusicInfo, setMusicList, curMusicInfo, musicList, playMusic, doPlay };
            },
            {
                wrapper: RecoilRoot
            }
        );
        testComponent = result;
    })
    test("at the last, after goNext(), musicInfo will not be change", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);
        })
        act(() => {
            testComponent.current.initCurMusicInfo(queryListFixture.length - 1);
            testComponent.current.mlsm.goNextMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(musicListFixture.length - 1);
    });

    test("at the firat, after goPrev(), musicInfo will not be change", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);
        })
        act(() => {
            testComponent.current.initCurMusicInfo(0);
            testComponent.current.mlsm.goPrevMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(0);
    });

    test("after goNext(), musicInfo will be nextinfo", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);
        })
        act(() => {
            testComponent.current.initCurMusicInfo(0);
            testComponent.current.mlsm.goNextMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(1);
    });

    test("after goPrev(), musicInfo will be previnfo", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);
        })
        act(() => {
            testComponent.current.initCurMusicInfo(1);
            testComponent.current.mlsm.goPrevMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(0);
    });

    test("reorderMusicList(start,end), start value will be pop & inserted to after end", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);
        })
        act(() => {
            testComponent.current.mlsm.reorderMusicList(0, 2);
        });

        expect(testComponent.current.musicList.map((el) => el.q)).toEqual([
            queryListFixture[1],
            queryListFixture[2],
            queryListFixture[0],
        ]);
    });

    test("call playmusic, then playmusic callback will be called", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);
        })
        act(() => {

            testComponent.current.playMusic(2);
        });
        expect(testComponent.current.doPlay).toHaveBeenCalledWith({
            idx: 2,
            ...testComponent.current.musicList[2],
        });
        act(() => {
            testComponent.current.playMusic(1);
        });
        expect(testComponent.current.doPlay).toHaveBeenCalledWith({
            idx: 1,
            ...testComponent.current.musicList[1],
        });
    });

    test("modMusicList test, key is constant", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);

        });
        act(() => {
            testComponent.current.mlsm.modMusicList(2, { id: "testval" });
        })
        expect(testComponent.current.musicList[2].id).toEqual("testval");
        const originkey = testComponent.current.musicList[2].key;
        act(() => {
            testComponent.current.mlsm.modMusicList(2, { key: "testkey" });
        });
        expect(testComponent.current.musicList[2].key).toEqual(originkey);
    });
});
