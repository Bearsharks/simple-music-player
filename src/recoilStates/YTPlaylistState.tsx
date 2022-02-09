import { atom, selector, useRecoilCallback } from "recoil";
import { PlaylistInfo } from "../refs/constants";
import { getMyYTPlaylistInfos } from "../refs/youtubeSearch";


const YTPlaylistRequestID = atom({
    key: 'YTPlaylistRequestID',
    default: 0,
});
export const myYTPlaylistInfosState = selector<PlaylistInfo[]>({
    key: 'myYTPlaylist',
    get: async ({ get }) => {

        get(YTPlaylistRequestID);
        const infos = await getMyYTPlaylistInfos();
        return infos
    }
})


// React component to refresh query
export const useRefreshYTPlaylistInfos = () => {
    return useRecoilCallback(
        ({ set }) => async () => {
            set(YTPlaylistRequestID, (id) => id + 1);
        }
    );
}