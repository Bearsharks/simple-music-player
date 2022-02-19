import { MusicInfo, PlaylistInfo } from "./constants";
import smpServerAPI from './api';
import testAPI from './testAPI';
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

const api: API = (process.env.MODE === "TEST") ? testAPI : smpServerAPI;
export default api;