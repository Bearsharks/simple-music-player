import {useMutation} from "react-query";
import {createPlaylist, deletePlaylist} from "../refs/api";
import {Playlist} from "../refs/constants";
import {CallbackInterface, useRecoilCallback, useRecoilState} from "recoil";
import {playlistIDsState, playlistInfoStateFamily, playlistItemStateFamily} from "../recoilStates/playlistAtoms";

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
        mutate : (id: string, onSuccess?: (isSuccess: boolean) => any) => mutation.mutate(id, {
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