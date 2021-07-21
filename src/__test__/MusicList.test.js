import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { renderHook, act } from "@testing-library/react-hooks";
import { useRecoilValue, RecoilRoot, useRecoilState, } from "recoil";
import { musicListStateManager, useInitMusicPlayer } from '../recoilStates/musicListStateManager';
import { musicListState, curMusicIndexState, curMusicInfoState } from "../recoilStates/atoms/musicListStates"
import { musicListFixture, queryListFixture } from './fixtures/MusicListFixture'
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
describe('MusicList State Test', () => {
    let testComponent;
    beforeEach(() => {
        const { result } = renderHook(
            () => {
                const [musicList, setMusicList] = useRecoilState(musicListState);
                const [curMusicIndex, setCurMusicIndex] = useRecoilState(curMusicIndexState);
                const curMusicInfo = useRecoilValue(curMusicInfoState);
                const mlsm = new musicListStateManager([musicList, setMusicList], [curMusicIndex, setCurMusicIndex]);
                const doPlay = jest.fn();
                const stopPlay = jest.fn();
                useInitMusicPlayer(doPlay, stopPlay);
                return { mlsm, curMusicIndex, setCurMusicIndex, musicList, setMusicList, curMusicInfo, doPlay };
            },
            {
                wrapper: RecoilRoot
            }
        );
        testComponent = result;
        act(() => {
            testComponent.current.mlsm.setMusicList([]);
        });
    })
    test("at the last, after goNext(), musicInfo will not be change", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);

            testComponent.current.setCurMusicIndex(queryListFixture.length - 1);
        })
        act(() => {
            testComponent.current.mlsm.goNextMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(musicListFixture.length - 1);
    });
    test("at the first, after goPrev(), musicInfo will not be change", () => {
        act(() => {
            testComponent.current.setCurMusicIndex(0);
            testComponent.current.mlsm.appendMusicList(queryListFixture);
        })
        act(() => {
            testComponent.current.mlsm.goPrevMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(0);
    });

    test("after goNext(), musicInfo will be nextinfo", () => {
        act(() => {
            testComponent.current.mlsm.appendMusicList(queryListFixture);
            testComponent.current.setCurMusicIndex(1);
        })
        act(() => {

            testComponent.current.mlsm.goNextMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(2);
    });


    test("after goPrev(), musicInfo will be previnfo", async () => {
        await act(async () => {
            await testComponent.current.mlsm.appendMusicList(queryListFixture);
            testComponent.current.setCurMusicIndex(2);
        })
        act(() => {

            testComponent.current.mlsm.goPrevMusic();
        });

        expect(testComponent.current.curMusicInfo.idx).toEqual(1);
    });
    test("reorderMusicList(start,end), start value will be pop & inserted to after end", async () => {
        await act(async () => {
            await testComponent.current.mlsm.appendMusicList(queryListFixture);
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
            testComponent.current.mlsm.selectMusic(2);
        })
        expect(testComponent.current.doPlay).toHaveBeenCalledWith({
            idx: 2,
            ...testComponent.current.musicList[2],
        });
        act(() => {
            testComponent.current.mlsm.selectMusic(1);
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
            testComponent.current.mlsm.modMusicList(2, { videoId: "testval" });
        })
        expect(testComponent.current.musicList[2].id).toEqual("testval");
        const originkey = testComponent.current.musicList[2].key;
        act(() => {
            testComponent.current.mlsm.modMusicList(2, { videoId: "testval", key: "testkey" });
        });
        expect(testComponent.current.musicList[2].key).toEqual(originkey);
    });
});
