import { getToken } from "./api";
import { MusicInfo } from "./constants";

function toMusicInfo(data: any, type: SearchType): MusicInfo {
    if (type === SearchType.List) {
        return {
            videoID : data.snippet.resourceId.videoId,
            name : data.snippet.title,
            //data.snippet.description,
            query : "",
        }
    } else if (type === SearchType.Music) {
        return{
            videoID : data.id,
            name : data.snippet.title,
            //data.snippet.description,
            query : "",
        };
    } else {
        return {
            videoID : data.id.videoId,
            name : data.snippet.title,
            // data.snippet.description,
            query : "",
        };
    }
}
export enum SearchType{
    List, Music, Search
}
export default async function youtubeSearch(value: string, type: SearchType, pageToken?: string): Promise<MusicInfo[]> {
    if (!sessionStorage.getItem("access_token")) {
        try {
            const token = await getToken();
            sessionStorage.setItem("access_token", token);
        } catch (e) {
            console.error(e);
            return [];
        }
    }
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
        let path = type === SearchType.List ? 'playlistItems' : (type === SearchType.Music) ? 'videos' : 'search';
        return `https://www.googleapis.com/youtube/v3/${path}?${query}`;
    }
    let res = await fetch(getUrl(type, query), { method: 'GET' });
    if (res.status === 200) {
        const data = await res.json();
        let result = [];
        for (let item of data.items) {
            result.push(toMusicInfo(item, type));
        }
        if (type === SearchType.List && data.nextPageToken) {
            result = result.concat(await youtubeSearch(value, type, data.nextPageToken));
        }
        return result;
    } else if (res.status === 403 || res.status === 401) {
        //유튜브 읽기 권한이 없다면 무한루프가 발생하기 때문에 없다면 확인후 권한을 달라고 하자
        sessionStorage.setItem("access_token", "");
        youtubeSearch(value, type, pageToken ? pageToken : undefined);
    }
    else {
        alert('잘못된 키이거나 해당키의 api 할당량을 초과했습니다.');
    }
    throw new Error('request fail');
}