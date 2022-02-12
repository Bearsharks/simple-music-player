import { getToken } from "./api";
import { MusicInfo, PlaylistInfo } from "./constants";

export enum SearchType {
    List, Music, Search
}

function toMusicInfo(data: any, type: SearchType, query: string): MusicInfo {
    if (type === SearchType.List) {
        return {
            videoID: data.snippet.resourceId.videoId,
            name: data.snippet.title,
            query: query,
            thumbnail: data.snippet.thumbnails.default.url,
            owner: data.snippet.videoOwnerChannelTitle,
        }
    } else if (type === SearchType.Music) {
        return {
            videoID: data.id,
            name: data.snippet.title,
            thumbnail: data.snippet.thumbnails.default.url,
            query: query,
            owner: data.snippet.channelTitle,
        };
    } else {
        return {
            videoID: data.id.videoId,
            name: data.snippet.title,
            query: query,
            thumbnail: data.snippet.thumbnails.default.url,
            owner: data.snippet.channelTitle,
        };
    }
}

export const searchByQuery = async (query: string): Promise<MusicInfo[]> => {
    let queryList: string[] = query.split("\n").filter((element) => element !== "");
    if (queryList.length <= 0) return [];
    let newMusicList: MusicInfo[] = [];
    for (let i = 0; i < queryList.length; i++) {
        if (queryList[i].substring(0, 4) === 'http') {
            let result: any = {};
            let qs = queryList[i].substring(queryList[i].indexOf('?') + 1).split('&');
            for (let j = 0; j < qs.length; j++) {
                const [kind, value] = qs[j].split('=');
                result[kind] = value;
            }
            if (result['list']) {
                const searchResult: MusicInfo[] = await youtubeSearch(result['list'], SearchType.List);
                newMusicList.push(...searchResult);
            } else if (result['v']) {
                //result.push(...await this.appendMusic(g.id));
                const searchResult: MusicInfo[] = await youtubeSearch(result['v'], SearchType.Music);
                newMusicList.push(...searchResult);
            } else {
                console.log(`${i}번째 검색어 잘 못된 url`);
            }
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
        if (pageToken) params.pageToken = pageToken;
    } else if (type === SearchType.Music) {
        debugger;
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
const YTFetch = async (url: string, pageToken?: string): Promise<any> => {
    if (!sessionStorage.getItem("access_token")) {
        const token = await getToken();
        if (token === "") return;
        sessionStorage.setItem("access_token", token);
    }
    url += `&access_token=${sessionStorage.getItem("access_token")}`;
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

export const getMyYTPlaylistInfos = async (): Promise<PlaylistInfo[]> => {
    const params: any = {
        part: `snippet,contentDetails`,
        mine: true,
        maxResults: 50,
        //fields: `nextPageToken,items(id,snippet(title,description,thumbnails,contentDetails))`
    };
    let query: string = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    let items = await YTFetch(`https://www.googleapis.com/youtube/v3/playlists?${query}`);
    return items.map((info: any): PlaylistInfo => {
        return {
            id: info.id,
            name: info.snippet.title,
            description: info.snippet.description,
            //info.snippet.thumbnails.default
        }
    })
}
