import {useMutation} from "react-query";
import {createPlaylist} from "../refs/api";
import {Playlist} from "../refs/constants";
import {useRecoilState} from "recoil";
import {playlistIDsState} from "../recoilStates/playlistAtoms";

export const useCreateSimplePlaylist = () => {
    const [playlistIds, setPlayListIds] = useRecoilState(playlistIDsState);
    const rq = useMutation((pl: Playlist) => {
        return createPlaylist(pl.info, pl.items);
    });
    return {
        ...rq,
        mutate : (playlist: Playlist, onSuccess: (id:string) => any) => rq.mutate(playlist, {
            onSuccess : (data) => {
                if (data) setPlayListIds(playlistIds.concat(data));
                onSuccess(data);
            }
        })
    };
}