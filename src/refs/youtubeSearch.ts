import { getToken } from "./api";
import { MusicInfo } from "./constants";

export enum SearchType {
    List, Music, Search, Playlist
}
function toMusicInfo(data: any, type: SearchType, query: string): MusicInfo {
    if (type === SearchType.List) {
        return {
            videoID: data.snippet.resourceId.videoId,
            name: data.snippet.title,
            //data.snippet.description,
            query: query,
        }
    } else if (type === SearchType.Music) {
        return {
            videoID: data.id,
            name: data.snippet.title,
            //data.snippet.description,
            query: query,
        };
    } else {
        return {
            videoID: data.id.videoId,
            name: data.snippet.title,
            // data.snippet.description,
            query: query,
        };
    }
}

export default async function youtubeSearch(value: string, type: SearchType, pageToken?: string): Promise<MusicInfo[]> {
    let params: any;
    if (type === SearchType.List) {
        params = {
            access_token: sessionStorage.getItem("access_token"),
            part: `snippet`,
            playlistId: value,
            maxResults: 50,
            fields: `nextPageToken,pageInfo,items(snippet(title,description,resourceId))`
        };
        if (pageToken) params.pageToken = pageToken;
    } else if (type === SearchType.Music) {
        params = {
            access_token: sessionStorage.getItem("access_token"),
            part: `snippet`,
            id: value,
            fields: `items(id,snippet(title,description))`
        };
    } else if (type === SearchType.Search) {
        params = {
            access_token: sessionStorage.getItem("access_token"),
            part: `snippet`,
            maxResults: 5,
            type: `video`,
            topic: `/m/04rlf`,
            q: `${value} audio`,
            fields: `items(id,snippet(title,description))`
        }
    }
    let query: string = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const getUrl = (type: SearchType, query: string) => {
        let path = (type === SearchType.List) ? 'playlistItems' :
            (type === SearchType.Music) ? 'videos' : 'search';
        return `https://www.googleapis.com/youtube/v3/${path}?${query}`;
    }
    let items = await YTFetch(getUrl(type, query));
    let result: MusicInfo[] = [];
    for (let item of items) {
        result.push(toMusicInfo(item, type, value));
    }
    return result;
}

//파람만들기 파람으로 패스 만들기 결과 반환하기
const YTFetch = async (url: string, pageToken?: string): Promise<any> => {
    if (!sessionStorage.getItem("access_token")) {
        try {
            const token = await getToken();
            sessionStorage.setItem("access_token", token);
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    let res = await fetch(url);
    if (res.status === 200) {
        const data = await res.json();
        if (data.nextPageToken) {
            return data.items.concat(await YTFetch(url, data.nextPageToken));
        }
        return data.items;
    } else if (res.status === 403 || res.status === 401) {
        //유튜브 읽기 권한이 없다면 무한루프가 발생하기 때문에 없다면 확인후 권한을 달라고 하자
        sessionStorage.setItem("access_token", "");
        return YTFetch(url, pageToken);
    }
    else {
        alert('잘못된 키이거나 해당키의 api 할당량을 초과했습니다.');
    }
    throw new Error('request fail');
}

export const getMyYTPlaylist = async () => {
    const params: any = {
        access_token: sessionStorage.getItem("access_token"),
        mine: true,
        maxResults: 50,
        fields: `nextPageToken,items(id,snippet(title,description,thumbnails,contentDetails))`
    };
    let query: string = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    let items = await YTFetch(`https://www.googleapis.com/youtube/v3/playlists?${query}`);
    return items;
}
