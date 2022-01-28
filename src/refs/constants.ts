
export enum ListEleType {
    Music = "Music",
    Query = "Query",
}


export interface MusicInfo {
    videoID: string,
    name: string,
    query: string,
    idx? : number
}

export function MusicInfoCheck(params: unknown): params is MusicInfo {
    const musicInfo: MusicInfo = params as MusicInfo;
    return !!(musicInfo.name) && (!!musicInfo.query || !!musicInfo.videoID);
}

export enum MusicInfoActionType {
    NEXT, PREV, SET
}
export interface MusicInfoAction {
    type: MusicInfoActionType
    payload?: any
}

export enum MusicListActionType {
    SET, APPEND_PLAYLIST, APPEND_ITEMS, DELETE, CHANGE_ORDER, ADD_TO_NEXT
}
export interface MusicListAction {
    type: MusicListActionType
    payload?: any
}

export enum PlaylistActionType {
    CREATE, DELETE, UPDATE, APPEND
}
export interface PlaylistAction {
    type: PlaylistActionType
    payload?: any
}

export interface PlaylistInfo {
    id: string,
    name: string,
    description: string
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

export enum playerState {
    PAUSED,
    PLAYING
}