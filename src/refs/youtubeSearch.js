
export default function youtubeSearch(q) {
    let params = {
        part: `snippet`,
        maxResults: 5,
        type: `video`,
        topic: `/m/04rlf`,
        q: `${q} audio`
    }
    let query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const fields = `items(id,snippet(title,description,thumbnails))`;
    const key = window.youtubeKey;
    let url = `https://www.googleapis.com/youtube/v3/search?key=${key}&fields=${fields}&${query}`;
    return fetch(url, { method: 'GET' });
}