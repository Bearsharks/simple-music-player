import { apiRequest } from './http';

import { API } from "shared/api/apiSelector";
import { PlaylistInfo, MusicInfo } from "shared/model/constants";
async function getPlaylistInfos(): Promise<PlaylistInfo[]> {
    const res = await apiRequest(`/playlists`, {
        credentials: 'include'
    });
    const playlistInfos = await res.json();
    return playlistInfos;
}
async function getPlaylistInfo(id: string): Promise<PlaylistInfo> {
    const res = await apiRequest(`/playlist/${id}`, {
        credentials: 'include'
    });
    const data: PlaylistInfo = await res.json();
    return data;
}
async function getPlaylistItems(id: string): Promise<MusicInfo[]> {
    const res = await apiRequest(`/playlist/${id}/items`, {
        credentials: 'include'
    });
    const data: MusicInfo[] = await res.json();
    return data;
}

async function createPlaylist(info: PlaylistInfo, items: MusicInfo[]): Promise<string> {
    const body = { info: { ...info, id: null }, items: items };
    const res = await apiRequest(`/playlist`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data: string = await res.text();
    return data;
}
async function deletePlaylist(id: string): Promise<boolean> {
    const res = await apiRequest(`/playlist/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    const data: string = await res.text();
    return data === 'true';
}
async function updatePlaylist(playlist: { info: PlaylistInfo, items?: MusicInfo[] }): Promise<boolean> {

    const res = await apiRequest(`/playlist/${playlist.info.id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify(playlist),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data: string = await res.text();
    return data === 'true';
}
export async function getToken() {
    const res = await apiRequest(`/token`, {
        credentials: 'include',
    });
    if (res.status !== 200) throw new Error("잘못된 요청");
    const token = await res.text();
    if (!token) {
        throw new Error('유튜브 권한이 필요합니다. 다시 로그인해 주세요.');
    }
    return token;

}
export async function checkAuth(): Promise<boolean> {
    const res = await apiRequest(`/isAuthed`, {
        credentials: 'include',
    });
    const data = await res.json();
    if (data.isAuthed) {
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("userimg", data.userimg);
        if (data.key) {
            sessionStorage.setItem("mode", "test");
            sessionStorage.setItem("key", data.key);
        }
    }
    return data.isAuthed as boolean;
}
export async function doSignIn(staySignedIn?: boolean) {
    const loginURL = `/login?staySignedIn=${Boolean(staySignedIn)}`;
    try {
        const res = await apiRequest(loginURL, { credentials: 'include' });
        const url = await res.text();
        (window as any).location = url;
    } catch (err) {
        console.error(err);
    }
}
const _: API = {
    getPlaylistInfos, getPlaylistInfo, getPlaylistItems,
    createPlaylist, deletePlaylist, updatePlaylist,
    getToken, checkAuth, doSignIn
};
export default _;
