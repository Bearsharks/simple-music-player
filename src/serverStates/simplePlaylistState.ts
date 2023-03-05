import {useMutation} from "react-query";
import {createPlaylist} from "../refs/api";
import {Playlist} from "../refs/constants";


export const useCreateSimplePlaylist = () => {
    return useMutation((pl: Playlist) => {
        return createPlaylist(pl.info, pl.items);
    });
}