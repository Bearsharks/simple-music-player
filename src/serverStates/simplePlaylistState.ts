import {useMutation} from "react-query";
import {createPlaylist, deletePlaylist, updatePlaylist} from "../refs/api";
import {MusicInfoItem, Playlist} from "../refs/constants";
import {CallbackInterface, useRecoilCallback, useRecoilState} from "recoil";
import {playlistIDsState, playlistInfoStateFamily, playlistItemStateFamily} from "../recoilStates/playlistAtoms";
import keyGenerator from "../refs/keyGenerator";
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
            debugger;
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
                debugger;
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