
import { PlaylistInfo, MusicInfo_tmp as MusicInfo } from "./constants";

export async function getPlaylistInfos(): Promise<PlaylistInfo[]> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/playlists`, {
        credentials: 'include'
    });
    const playlistInfos = res.json();
    return playlistInfos;
}

export async function getPlaylistInfo(id: string): Promise<PlaylistInfo> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/playlist/${id}`, {
        credentials: 'include'
    });
    const data: PlaylistInfo = await res.json();
    return data;
}
export async function getPlaylistItems(id: string): Promise<MusicInfo[]> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/playlist/${id}/items`, {
        credentials: 'include'
    });
    const data: MusicInfo[] = await res.json();
    return data;
}

export async function createPlaylist(info: PlaylistInfo, items: MusicInfo[]): Promise<string> {
    const body = { info: info, items: items };
    console.log(`${process.env.REACT_APP_API_URL}/playlist`);
    const res = await fetch(`${process.env.REACT_APP_API_URL}/playlist`, {
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
export async function deletePlaylist(id: string): Promise<boolean> {
    return true;
}
export async function updatePlaylist(info: PlaylistInfo, items: MusicInfo): Promise<boolean> {
    const body = {
        info, items
    }
    const res = await fetch(`${process.env.REACT_APP_API_URL}/playlist/${info.id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data: string = await res.text();
    return data === 'true';
}

export async function getToken() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/token`, {
        credentials: 'include',
    });
    if (res.status !== 200) throw "잘못된 요청";
    return await res.text();
}

// const save = new Promise((resolve) => {
//     fetch('http://localhost:5001/simple-music-player-319201/asia-northeast3/main/playlists', {
//         credentials: 'include',
//     }).then((res) => {
//         return res.json();
//     }).then((data) => {
//         resolve(data);
//     })
// })