export const INVALID_MUSIC_INFO = { idx: -1, id: -1, key: -1 };
export const DEFAULT_PLAYLIST_NAME = 'My playlist';
export const CUR_PLAYLIST_INDICATER = 'curPlayListName'
export const MUSIC_INFO = {
    videoId: -1,
    title: "",
    description: "",
    thumbnail: ""
};
export const getThumbnail = function (id) {
    return `https://i.ytimg.com/vi/${id}/default.jpg`
}
export const PAUSED = "PAUSED";
export const PLAYING = "PLAYING";