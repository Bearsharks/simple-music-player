import { useFixtureApi } from 'shared/config/env';
import { MusicInfo, PlaylistInfo } from "shared/model/constants";
import smpServerAPI from 'shared/api/api';
import testAPI from 'shared/api/testAPI';
export interface API {
    getPlaylistInfos: () => Promise<PlaylistInfo[]>;
    getPlaylistInfo: (id: string) => Promise<PlaylistInfo>;
    getPlaylistItems: (id: string) => Promise<MusicInfo[]>;
    createPlaylist: (info: PlaylistInfo, items: MusicInfo[]) => Promise<string>;
    deletePlaylist: (id: string) => Promise<boolean>;
    updatePlaylist: (playlist: { info: PlaylistInfo, items?: MusicInfo[] }) => Promise<boolean>;
    getToken: () => Promise<string>;
    checkAuth: () => Promise<boolean>;
    doSignIn: (staySignedIn?: boolean) => Promise<void>;
}
const api: API = useFixtureApi ? testAPI : smpServerAPI;
export default api;
