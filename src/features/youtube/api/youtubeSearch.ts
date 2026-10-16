import { youtubeApiKey } from "shared/config/env";
import { MusicInfo, PlaylistInfo } from "shared/model/constants";

export enum SearchType {
    List, Music, Search
}

function toMusicInfo(data: any, type: SearchType, query: string): MusicInfo {
    if (type === SearchType.List) {
        return {
            videoID: data.snippet.resourceId.videoId,
            name: data.snippet.title,
            query: query,
            thumbnail: data.snippet.thumbnails.default?.url ? data.snippet.thumbnails.default.url : "",
            owner: data.snippet.videoOwnerChannelTitle,
        }
    } else if (type === SearchType.Music) {
        return {
            videoID: data.id,
            name: data.snippet.title,
            thumbnail: data.snippet.thumbnails.default?.url ? data.snippet.thumbnails.default.url : "",
            query: query,
            owner: data.snippet.channelTitle,
        };
    } else {
        return {
            videoID: data.id.videoId,
            name: data.snippet.title,
            query: query,
            thumbnail: data.snippet.thumbnails?.default?.url ?? "",
            owner: data.snippet.channelTitle,
        };
    }
}

export const searchByQuery = async (query: string): Promise<MusicInfo[]> => {
    let queryList: string[] = query.split("\n").map(value => value.trim()).filter(Boolean);
    if (queryList.length <= 0) return [];
    let newMusicList: MusicInfo[] = [];
    for (let i = 0; i < queryList.length; i++) {
        if (queryList[i].substring(0, 4) === 'http') {
            const { id, kind } = urlToId(queryList[i])
            if (!id) console.error(`${i}번째 검색어 잘 못된 url`);
            const searchResult: MusicInfo[] = await youtubeSearch(id, kind);
            newMusicList.push(...searchResult);
        } else {
            newMusicList.push({
                videoID: "",
                name: queryList[i],
                query: queryList[i],
                owner: "",
                thumbnail: ""
            })
        }
    }
    return newMusicList;
}

export default async function youtubeSearch(value: string, type: SearchType, pageToken?: string): Promise<MusicInfo[]> {
    let params: any;
    if (type === SearchType.List) {
        params = {
            part: `snippet`,
            playlistId: value,
            maxResults: 50,
            //fields: `nextPageToken,pageInfo,items(snippet(title,description,resourceId,thumbnails(default)))`
            fields: `nextPageToken,pageInfo,items(snippet(title,resourceId,thumbnails(default),videoOwnerChannelTitle))`
        };
    } else if (type === SearchType.Music) {
        params = {
            part: `snippet`,
            id: value,
            fields: `items(id,snippet(title,thumbnails(default),channelTitle))`
        };
    } else if (type === SearchType.Search) {
        params = {
            part: `snippet`,
            maxResults: 5,
            type: `video`,
            topic: `/m/04rlf`,
            q: `${value} audio`,
            fields: `items(id,snippet(title,thumbnails(default),channelTitle))`
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
export const YTFetch = async (url: string, pageToken?: string): Promise<any[]> => {
    const result: any[] = [];
    const seen = new Set<string>();
    let next = pageToken;
    if (!youtubeApiKey) throw new Error('곡 메타데이터 조회에는 별도 API 키가 필요합니다. URL 목록 재생에는 필요하지 않습니다.');
    for (let page = 0; page < 100; page++) {
        const requestUrl = new URL(url);
        if (next) requestUrl.searchParams.set('pageToken', next);
        const response = await fetch(requestUrl, { headers: { 'X-Goog-Api-Key': youtubeApiKey } });
        if (!response.ok) throw new Error(`YouTube 요청 실패 (${response.status}). 권한 또는 할당량을 확인해 주세요.`);
        const data = await response.json();
        if (!Array.isArray(data.items)) throw new Error('YouTube 응답 형식 오류');
        result.push(...data.items);
        next = data.nextPageToken;
        if (!next) return result;
        if (seen.has(next)) throw new Error('YouTube 페이지 토큰 반복');
        seen.add(next);
    }
    throw new Error('가져올 재생목록이 너무 큽니다. 범위를 줄여 주세요.');
};

export const getYTPlaylistByID = async (id: string): Promise<PlaylistInfo> => {
    const params: any = {
        part: `snippet,contentDetails`,
        id: id
    };
    let query: string = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    let info = (await YTFetch(`https://www.googleapis.com/youtube/v3/playlists?${query}`))[0];
    return {
        id: info.id,
        name: info.snippet.title,
        description: info.snippet.description,
        thumbnails: [info.snippet.thumbnails?.default?.url ?? ""],
        itemCount: info.contentDetails.itemCount
    }
}

export const urlToId = (input: string): { id: string, kind: SearchType } => {
    const url = new URL(input);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('지원하지 않는 URL입니다.');
    const host = url.hostname.toLowerCase();
    if (!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','www.youtu.be'].includes(host)) throw new Error('YouTube URL을 입력해 주세요.');
    const list = url.searchParams.get('list');
    if (list) return {id:list,kind:SearchType.List};
    const id = host.endsWith('youtu.be') ? url.pathname.split('/')[1] : url.searchParams.get('v') ?? (/^\/(shorts|embed)\/([^/]+)/.exec(url.pathname)?.[2]);
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error('유효한 동영상 URL이 아닙니다.');
    return {id,kind:SearchType.Music};
};
