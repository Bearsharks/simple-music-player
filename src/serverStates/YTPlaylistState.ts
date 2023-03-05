import { getMyYTPlaylistInfos } from "refs/youtubeSearch";
import {useQuery} from "react-query";

export const useMyYTPlaylistInfos = () => {
    return useQuery("myPlayListInfos", getMyYTPlaylistInfos, {onSuccess: data => console.log(data)});
}