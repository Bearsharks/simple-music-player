import {useMutation} from "react-query";
import {createPlaylist, deletePlaylist, updatePlaylist} from "../refs/api";
import {MusicInfo, MusicInfoItem, Playlist, PlaylistInfo} from "../refs/constants";
import {CallbackInterface, useRecoilCallback, useRecoilState} from "recoil";
import {playlistIDsState, playlistInfoStateFamily, playlistItemStateFamily} from "../recoilStates/playlistAtoms";
import keyGenerator from "../refs/keyGenerator";
import {useNotice} from "../popups/Notice";

export const useCreateSimplePlaylist = () => {
    const [playlistIds, setPlayListIds] = useRecoilState(playlistIDsState);
    const mutation = useMutation((pl: Playlist) => {
        return createPlaylist(pl.info, pl.items);
    });
    return {
        ...mutation,
        mutate : (playlist: Playlist, onSuccess: (id:string) => any) => mutation.mutate(playlist, {
            onSuccess : (data) => {
                if (data) setPlayListIds(playlistIds.concat(data));
                onSuccess(data);
            }
        })
    };
}

export const useDeleteSimplePlaylist = () => {
    const [playlistIds, setPlayListIds] = useRecoilState(playlistIDsState);
    const resetDeletedPlaylist = useRecoilCallback(({reset}: CallbackInterface)  => {
        return (id: string) => {
            reset(playlistItemStateFamily(id));
            reset(playlistInfoStateFamily(id));
        }
    });
    const mutation = useMutation((id: string) => {
        return deletePlaylist(id);
    });
    return {
        ...mutation,
        mutate : (id: string, onSuccess?: (isSuccess: boolean) => void) => mutation.mutate(id, {
            onSuccess : (isSuccess: boolean) => {
                if (!isSuccess) return;
                const newOne: string[] = playlistIds.filter((item) => item !== id);
                setPlayListIds(newOne);
                resetDeletedPlaylist(id);

                onSuccess?.(isSuccess);
            }
        })
    };
}

export const useUpdateSimplePlaylist = () => {
    const update = useRecoilCallback(({set, snapshot}) => {
        return (playlist: Playlist) => {
            set(playlistInfoStateFamily(playlist.info.id), playlist.info);

            if (playlist.items) {
                const keys = keyGenerator(playlist.items.length);
                const newMusicInfoItems: MusicInfoItem[] = playlist.items.map((item,idx) => ({...item, key: keys[idx]}));
                set(playlistItemStateFamily(playlist.info.id), newMusicInfoItems);
            }
        }
    })

    const mutation = useMutation((playlist: Playlist) => {
        return updatePlaylist(playlist);
    });

    return {
        ...mutation,
        mutate: (playlist: Playlist, onSuccess?: (isSuccess: boolean) => void) => mutation.mutate(playlist, {
            onSuccess : (isSuccess: boolean) => {
                if (!isSuccess) return;
                update(playlist);
                onSuccess?.(isSuccess);
            }
        })
    }
}



export const useDeleteSimplePlaylistItems = () => {
    const getPlaylist = useRecoilCallback(({snapshot}) => {
        return (id: string) => {
            const info: PlaylistInfo = snapshot.getLoadable(playlistInfoStateFamily(id)).contents;
            const items: MusicInfoItem[] = snapshot.getLoadable(playlistItemStateFamily(id)).contents;
            return {info, items};
        }
    })
    const mutation = useUpdateSimplePlaylist();

    return {
        ...mutation,
        mutate: (id: string, tgtItems: MusicInfoItem[], onSuccess?: (isSuccess: boolean) => void) => {
            const {info, items} = getPlaylist(id);
            const tgtItemsSet = new Set(tgtItems.map(item => item.key));
            const remainItems = items.filter(item => !tgtItemsSet.has(item.key));
            mutation.mutate({info, items: remainItems},
                (isSuccess: boolean) => {
                    onSuccess?.(isSuccess);
                }
            )
        }
    }
}



export const useAppendSimplePlaylistItems = () => {
    const getPlaylist = useRecoilCallback(({snapshot}) => {
        return (id: string) => {
            const info: PlaylistInfo = snapshot.getLoadable(playlistInfoStateFamily(id)).contents;
            const items: MusicInfoItem[] = snapshot.getLoadable(playlistItemStateFamily(id)).contents;
            return {info, items};
        }
    })
    const mutation = useUpdateSimplePlaylist();
    const setNotice = useNotice();

    return {
        ...mutation,
        mutate: (id: string, tgtItems: MusicInfo[], onSuccess?: (isSuccess: boolean) => void) => {
            const {info, items} = getPlaylist(id);
            const newMusicInfoItems: MusicInfoItem[] = keyGenerator(tgtItems.length).map((key, idx) => ({
                ...tgtItems[idx], key
            }))
            const newMusicItems: MusicInfoItem[] = [...items, ...newMusicInfoItems];
            const newPlaylistInfo: PlaylistInfo = {...info, itemCount: newMusicItems.length};
            mutation.mutate({
                info: newPlaylistInfo,
                items: newMusicItems
            }, (isSuccess: boolean) => {
                    onSuccess?.(isSuccess);
                    setNotice("추가 성공!");
                }
            )
        }
    }
}