
export enum ListEleType {
    Music = "Music",
    Query = "Query",
}

export interface MusicInfo {
    id: string,
    key: string,
    title: string,
    query: string,
    type: ListEleType
}
export const INVALID_MUSIC_INFO = {
    idx: -1,
    id: "",
    key: "",
    title: "",
    query: "",
    type: ListEleType.Music
};

export const DEFAULT_PLAYLIST_NAME = 'My playlist';
export const CUR_PLAYLIST_INDICATER = 'curPlayListName'
export const MUSIC_INFO = {
    videoId: -1,
    title: "",
    description: "",
    thumbnail: ""
};
export const getThumbnail = function (id: string): string {
    return `https://i.ytimg.com/vi/${id}/default.jpg`
}
export const PAUSED = "PAUSED";
export const PLAYING = "PLAYING";