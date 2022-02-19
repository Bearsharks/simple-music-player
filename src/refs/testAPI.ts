
import { API } from "./apiSelector";
import { MusicInfo, PlaylistInfo } from "./constants";
import keyGenerator from "./keyGenerator";


let a: any = {
    id1: {
        id: "id1",
        name: "name",
        description: "description",
        items: []
    }
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
        items: items
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
        playlist.info.description = playlist.info.description ? playlist.info.description : a[playlist.info.id].description;
        playlist.info.name = playlist.info.name ? playlist.info.name : a[playlist.info.id].name;
        let result: any = { info: playlist.info };
        result.items = playlist.items ? playlist.items : a[playlist.info.id].items;
        a[playlist.info.id] = result;
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