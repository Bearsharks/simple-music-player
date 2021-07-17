import { getThumbnail } from "./constants";
function toDataObject(data, type) {
    let result = {};
    if (type === "list") {
        result.videoId = data.snippet.resourceId.videoId;
        result.thumbnail = getThumbnail(result.videoId);
        result.title = data.snippet.title;
        result.description = data.snippet.description;
    } else if (type === "music") {
        result.videoId = data.id;
        result.thumbnail = getThumbnail(result.videoId);
        result.title = data.snippet.title;
        result.description = data.snippet.description;
    } else {
        result.videoId = data.id.videoId;
        result.thumbnail = getThumbnail(data.id.videoId);
        result.title = data.snippet.title;
        result.description = data.snippet.description;
    }
    result.type = type
    return result;
}

export default async function youtubeSearch(value, type, pageToken) {
    let params = {
        key: localStorage.getItem("youtubeKey"),
        part: `snippet`,
    }
    if (type === 'list') {
        params = {
            ...params,
            playlistId: value,
            maxResults: 50,
            fields: `nextPageToken,pageInfo,items(snippet(title,description,resourceId))`
        };
        if (pageToken) params.pageToken = pageToken;
    } else if (type === 'music') {
        params = {
            ...params,
            id: value,
            fields: `items(id,snippet(title,description))`
        };
    } else {
        params = {
            ...params,
            maxResults: 5,
            type: `video`,
            topic: `/m/04rlf`,
            q: `${value} audio`,
            fields: `items(id,snippet(title,description))`
        }
    }

    let query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const getUrl = (type, query) => {
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
    } else if (res.status === 400) {
        alert('잘못된 키이거나 해당키의 api 할당량을 초과했습니다.');
    }
    throw new Error('request fail');
}