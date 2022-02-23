import { Suspense, useState } from 'react'
import { act, Renderer, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import { MutableSnapshot, RecoilRoot, useRecoilCallback, useRecoilSnapshot, useRecoilValue } from 'recoil';
import { playlistIDsState, playlistInfosState, playlistInfoStateFamily, playlistItemStateFamily, usePlaylistManager } from '../recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicInfoItem, Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from '../refs/constants';
import { reset, testAPIget } from '../refs/testAPI';

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

    it('UPDATE', async () => {
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        if (!result.current) await waitForNextUpdate();
        const tgtID = result.current.ids[0];
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
    it('DELETE_ITEMS', async () => {
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        if (!result.current) await waitForNextUpdate();
        const tgtID = result.current.ids[0];
        const items: MusicInfoItem[] = await result.current.snapshot.getPromise(playlistItemStateFamily(tgtID));
        const tgtItems = [items[0]];
        const DelItemAction: PlaylistAction = {
            type: PlaylistActionType.DELETE_ITEMS,
            payload: {
                id: tgtID,
                items: tgtItems
            }
        }
        act(() => {
            result.current.manager(DelItemAction);
        })
        await waitForNextUpdate();
        const updatedItems: MusicInfoItem[] = await result.current.snapshot.getPromise(playlistItemStateFamily(tgtID));
        expect(updatedItems).toEqual([items[1]]);
    });

    it('APPEND', async () => {
        const { result, waitForNextUpdate } = getRenderHook(useRecoilTest);
        if (!result.current) await waitForNextUpdate();
        const tgtID = result.current.ids[0];
        const items: MusicInfoItem[] = await result.current.snapshot.getPromise(playlistItemStateFamily(tgtID));
        const tgtItems: MusicInfo[] = [{
            videoID: "new", name: "new", query: "new", owner: "new", thumbnail: "new"
        }];
        const appendItemAction: PlaylistAction = {
            type: PlaylistActionType.APPEND,
            payload: {
                info: { id: tgtID },
                items: tgtItems
            }
        }
        act(() => {
            result.current.manager(appendItemAction);
        })
        await waitForNextUpdate();
        console.log(testAPIget(tgtID, 'items'));

        //const updatedItems: MusicInfoItem[] = await result.current.snapshot.getPromise(playlistItemStateFamily(tgtID));
        expect(testAPIget(tgtID, 'items').length).toEqual(items.length + 1);
    });

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


