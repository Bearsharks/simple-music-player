import { Suspense, useState } from 'react'
import { act, Renderer, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import { MutableSnapshot, RecoilRoot, useRecoilCallback, useRecoilSnapshot, useRecoilValue } from 'recoil';
import { curMusicIdxState, curMusicInfoState, musicListState, playlistIDsState, playlistInfosState, playlistInfoStateFamily, playlistItemStateFamily, useMusicListManager, usePlaylistManager } from '../recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoItem, MusicListAction, MusicListActionType, Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from '../refs/constants';
import { reset, testAPIget } from '../refs/testAPI';
import { playlistFixture } from '../refs/fixture';

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
    it('LOAD_PLAYLIST', async () => {
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
        expect(result.current.musicList.length).toBe(playlistFixture.items.length);
        for (let i = 0; i < playlistFixture.items.length; i++) {
            expect(result.current.musicList[i].name).toBe(playlistFixture.items[i].name);
        }
    });

});


