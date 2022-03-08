import { atom, selector, useRecoilCallback } from "recoil";
import { PlaylistInfo } from "refs/constants";
import { getMyYTPlaylistInfos } from "refs/youtubeSearch";


const YTPlaylistRequestIDState = atom({
    key: 'YTPlaylistRequestID',
    default: 0,
});
export const myYTPlaylistInfosState = selector<PlaylistInfo[]>({
    key: 'myYTPlaylist',
    get: async ({ get }) => {

        get(YTPlaylistRequestIDState);
        try {
            const infos = await getMyYTPlaylistInfos();
            return infos
        } catch (e) {
            console.error(e);
            alert("재생목록 정보를 가져오지 못했습니다.")
            return [];
        }
    }
})


// React component to refresh query
export const useRefreshYTPlaylistInfos = () => {
    return useRecoilCallback(
        ({ set }) => async () => {
            set(YTPlaylistRequestIDState, (id) => id + 1);
        }
    );
}