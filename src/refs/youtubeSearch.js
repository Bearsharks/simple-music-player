
export default async function youtubeSearch(q) {
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
    let res = await fetch(url, { method: 'GET' });
    if (res.status === 200) {
        return res.json();
    } else if (res.status === 400) {
        alert('잘못된 키이거나 해당키의 api 할당량을 초과했습니다.');
    }
    throw new Error('request fail');
}