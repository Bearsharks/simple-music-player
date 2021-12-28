class MusicInfo {
    videoId: string;
    title: string;
    description: string;
    thumbnail: string;
    type: string;

    constructor(videoId: string, title: string, description: string, type: string) {
        // 클래스 프로퍼티수에 값을 할당
        this.videoId = videoId;
        this.title = title;
        this.description = description;
        this.thumbnail = `https://i.ytimg.com/vi/${this.videoId}/default.jpg`;
        this.type = type;
    }
};

function toDataObject(data: any, type: string): MusicInfo {
    if (type === "list") {
        return new MusicInfo(
            data.snippet.resourceId.videoId,
            data.snippet.title,
            data.snippet.description,
            type
        );
    } else if (type === "music") {
        return new MusicInfo(
            data.id,
            data.snippet.title,
            data.snippet.description,
            type
        );
    } else {
        return new MusicInfo(
            data.id.videoId,
            data.snippet.title,
            data.snippet.description,
            type
        );
    }
}

export default async function youtubeSearch(value: string, type: string, pageToken?: string): Promise<MusicInfo[]> {
    let params: any;
    if (type === 'list') {
        params = {
            key: localStorage.getItem("youtubeKey"),
            part: `snippet`,
            playlistId: value,
            maxResults: 50,
            fields: `nextPageToken,pageInfo,items(snippet(title,description,resourceId))`
        };
        if (pageToken) params.pageToken = pageToken;
    } else if (type === 'music') {
        params = {
            key: localStorage.getItem("youtubeKey"),
            part: `snippet`,
            id: value,
            fields: `items(id,snippet(title,description))`
        };
    } else {
        params = {
            key: localStorage.getItem("youtubeKey"),
            part: `snippet`,
            maxResults: 5,
            type: `video`,
            topic: `/m/04rlf`,
            q: `${value} audio`,
            fields: `items(id,snippet(title,description))`
        }
    }

    let query: string = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const getUrl = (type: string, query: string) => {
        let path = type === 'list' ? 'playlistItems' : (type === 'music') ? 'videos' : 'search';
        return `https://www.googleapis.com/youtube/v3/${path}?${query}`;
    }
    let res = await fetch(getUrl(type, query), { method: 'GET' });
    if (res.status === 200) {
        const data = await res.json();
        let result = [];
        for (let item of data.items) {
            result.push(toDataObject(item, type));
        }
        if (type === "list" && data.nextPageToken) {
            result = result.concat(await youtubeSearch(value, type, data.nextPageToken));
        }
        return result;
    } else {
        alert('잘못된 키이거나 해당키의 api 할당량을 초과했습니다.');
    }
    throw new Error('request fail');
}