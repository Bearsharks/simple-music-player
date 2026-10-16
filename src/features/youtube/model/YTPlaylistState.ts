import { useSetAtom } from 'jotai';
import { atomWithRefresh } from 'jotai/utils';
import { getMyYTPlaylistInfos } from 'features/youtube/api/youtubeSearch';
export const myYTPlaylistInfosState = atomWithRefresh(() => getMyYTPlaylistInfos());
export const useRefreshYTPlaylistInfos = () => useSetAtom(myYTPlaylistInfosState);
