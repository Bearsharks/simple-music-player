import { Suspense, useState } from 'react'
import { act, Renderer, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import { MutableSnapshot, RecoilRoot, useRecoilCallback, useRecoilSnapshot, useRecoilValue } from 'recoil';
import { playlistIDsState, playlistInfosState, playlistInfoStateFamily, playlistItemStateFamily, usePlaylistManager } from '../recoilStates/atoms/playlistAtoms';
import { MusicInfoItem, Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from '../refs/constants';
import { reset } from '../refs/testAPI';

//처음에 이 아톰을 사용하여 재생목록을 생성한다.
//재생목록 컴포넌트는 prop으로 id를 받아서 각자의 재생목록 정보를 비동기적으로 
//서버에서 받아 상태를 초기화하고 화면을 만든다.


const getRenderHook = (callback: any): any => {
    return renderHook(callback,
        {
            initialProps: {
                date: new Date()
            },
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

const useAccessRecoilState = function () {
    //create, delete, update
    return useRecoilCallback(({ snapshot }) => async (recoilState: any, key?: any): Promise<any> => {
        if (key) {
            return await snapshot.getPromise(recoilState(key));
        }
        return await snapshot.getPromise(recoilState);
    });
}
const useReset = function () {

    return useRecoilCallback(({ reset }) => (recoilState: any, key?: any) => {
        if (key) {
            reset(recoilState(key));
        } else {
            reset(recoilState);
        }

    });
}
function useRecoilTest() {
    const ids = useRecoilValue(playlistIDsState);
    const manager_ = usePlaylistManager();
    //const init = useReset();
    const snapshot = useRecoilSnapshot();
    const [count, setCount] = useState(0);
    const reload = () => {
        setCount(count + 1);
    }
    const manager = (action: PlaylistAction) => {
        manager_(action).then(() => {
            reload();
        })
    }
    return { ids, manager, reload, snapshot };
};

describe('playlist manager', () => {
    it('CREATE', async () => {
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        renderHook(useRecoilTest,
            {
                initialProps: {
                    date: new Date()
                },
                wrapper: ({ children }) => (
                    <RecoilRoot override={true}>
                        <Suspense fallback="">{children}</Suspense>
                    </RecoilRoot>
                ),
            }
        );
        if (!result.current) await waitForNextUpdate();
        const info = {
            name: "name",
            description: "desc",
        }
        const createAction: PlaylistAction = {
            type: PlaylistActionType.CREATE,
            payload: {
                info: info
            }
        }
        const prevLength = result.current.ids.length;
        act(() => {
            result.current.manager(createAction);
        })
        await waitForNextUpdate();
        expect(result.current.ids.length).toBe(prevLength + 1);

        const createdPlaylistInfo: PlaylistInfo =
            await result.current.snapshot.getPromise(playlistInfoStateFamily(result.current.ids[prevLength]));
        expect(createdPlaylistInfo.name).toBe(info.name);
        expect(createdPlaylistInfo.description).toBe(info.description);
    });

    describe('playlist managesadfr', () => {
        it('UPDATE', async () => {
            reset();
            const { result, waitForNextUpdate, rerender } = getRenderHook(useRecoilTest);
            rerender()
            if (!result.current) await waitForNextUpdate();
            const tgtID = result.current.ids[0];
            console.log('test');
            const info: PlaylistInfo = await result.current.snapshot.getPromise(playlistInfoStateFamily(tgtID));
            const items: MusicInfoItem[] = await result.current.snapshot.getPromise(playlistItemStateFamily(tgtID));
            const newInfo = { ...info, name: "new", description: "new" };
            const newitems = [...items, { videoID: "newID", name: "newname", query: "newq" }];
            const updateAction: PlaylistAction = {
                type: PlaylistActionType.UPDATE,
                payload: {
                    info: newInfo,
                    items: newitems
                }
            }
            act(() => {
                result.current.manager(updateAction);
            })
            await waitForNextUpdate();
            const updatedInfo: PlaylistInfo = await result.current.snapshot.getPromise(playlistInfoStateFamily(tgtID));
            const updatedItems: MusicInfoItem[] = await result.current.snapshot.getPromise(playlistItemStateFamily(tgtID));
            expect(updatedInfo).toEqual(newInfo);
            expect(updatedItems).toEqual(newitems);
        });
    })
    it('DELETE', async () => {
        reset();
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        if (!result.current) await waitForNextUpdate();
        const tgtID = result.current.ids[0];
        const deleteAction: PlaylistAction = {
            type: PlaylistActionType.DELETE,
            payload: tgtID
        }
        const prevLength = result.current.ids.length;
        act(() => {
            result.current.manager(deleteAction);
        })
        await waitForNextUpdate();
        expect(result.current.ids.length).toBe(prevLength - 1);
    });



});


