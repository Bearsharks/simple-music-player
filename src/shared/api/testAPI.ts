
import { API } from "shared/api/apiSelector";
import { MusicInfo, PlaylistInfo } from "shared/model/constants";
import keyGenerator from "shared/lib/keyGenerator";
import { playlistFixture } from 'test/fixture';
let a: any = {
    id1: playlistFixture
}
export const reset = () => {
    a = {
        id1: playlistFixture
    }
}
export const testAPIget = (id: string, items: string) => {
    return a[id][items];
}
const getToken = async (): Promise<string> => {
    return "aasdfasfasdf";
}
const getPlaylistInfos = async (): Promise<PlaylistInfo[]> => {
    return Object.entries(a).map(el => el[1]) as any;
}
const getPlaylistInfo = async (id: string): Promise<PlaylistInfo> => {
    return a[id];
}
const getPlaylistItems = async (id: string): Promise<MusicInfo[]> => {
    return a[id].items;
};
const createPlaylist = async (info: PlaylistInfo, items: MusicInfo[]): Promise<string> => {
    info.id = keyGenerator()[0];
    a[info.id] = {
        ...info,
        items: items ? items : []
    }
    return info.id;
};
const deletePlaylist = async (id: string): Promise<boolean> => {
    if (!a[id]) return false;
    delete a[id];
    return true;
};
const updatePlaylist = async (playlist: { info: PlaylistInfo, items?: MusicInfo[] }): Promise<boolean> => {
    if (playlist.info.id && a[playlist.info.id]) {
        let origin: any = { ...a[playlist.info.id] };
        origin.description = playlist.info.description ? playlist.info.description : origin.description;
        origin.name = playlist.info.name ? playlist.info.name : origin.name;
        origin.items = playlist.items ? playlist.items : origin.items;
        a[playlist.info.id] = origin;
        return true;
    }
    return false;

};

const checkAuth = async () => true;
const doSignIn = async () => { };

const _: API = {
    getPlaylistInfos, getPlaylistInfo, getPlaylistItems,
    createPlaylist, deletePlaylist, updatePlaylist,
    getToken, checkAuth, doSignIn
};
export default _;