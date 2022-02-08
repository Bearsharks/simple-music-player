
import { PlaylistInfo, MusicInfo } from "./constants";

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
    const body = { info: { ...info, id: null }, items: items };
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
    const res = await fetch(`${process.env.REACT_APP_API_URL}/playlist/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    const data: string = await res.text();
    return data === 'true';
}
export async function updatePlaylist(playlist: { info: PlaylistInfo, items?: MusicInfo[] }): Promise<boolean> {

    const res = await fetch(`${process.env.REACT_APP_API_URL}/playlist/${playlist.info.id}`, {
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
    const res = await fetch(`${process.env.REACT_APP_API_URL}/token`, {
        credentials: 'include',
    });
    if (res.status !== 200) throw "잘못된 요청";
    const token = await res.text();
    if (!token) {
        alert('유튜브 권한이 필요합니다.')
        await doSignIn();
    }
    return token;

}

export async function checkAuth() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/isAuthed`, {
        credentials: 'include',
    });
    return (res.status === 200) && 'true' === await res.text();
}

export const doSignIn = async (staySignedIn?: boolean) => {
    debugger;
    const loginURL = `${process.env.REACT_APP_API_URL}/login?staySignedIn=${staySignedIn}`;
    try {
        const res = await fetch(loginURL, { credentials: 'include' });
        const url = await res.text();
        (window as any).location = url;
    } catch (err) {
        console.error(err);
    }

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