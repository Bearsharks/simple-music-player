import { atom, useRecoilCallback } from "recoil";
import { Options } from "../components/OptionSelector";
import { playlistIDsState, playlistInfoStateFamily, usePlaylistManager } from './atoms/playlistAtoms'
import { Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from "../refs/constants";
export interface FormItem {
    id: string,
    name: string,
    value?: string
}

export const FormPopupOpenState = atom<boolean>({
    key: "formPopupOpen",
    default: false
})
export const FormPopupState = atom<FormPopupData>({
    key: "formPopup",
    default: {} as FormPopupData
})

export enum OptionSelectorKind {
    Playlist, SearchBar
}

export const OptionSelectorOpenState = atom<boolean>({
    key: "optionSelectorOpen",
    default: false
})

export interface OptionSelectorInfo { target: HTMLElement, items: Options[], data?: unknown };
export const OptionSelectorState = atom<OptionSelectorInfo>({
    key: "optionSelector",
    default: {} as OptionSelectorInfo
})

export interface FormPopupData {
    items: FormItem[] | PlaylistInfo[];
    submit: (data: unknown) => void,
    kind: FormKind;
    data?: any;
}

export enum FormKind {
    CreatePlaylist, YoutubeLink, ImportYTPlaylist, SelectPlaylist, AppendPlaylist,
    UpdatePlaylist
}
export function getFormInitData(formKind: FormKind, onSubmitHandler: (data: unknown) => void): FormPopupData {
    return {
        items: [
            { id: "name", name: "이름" },
            { id: "description", name: "설명" },
        ],
        submit: onSubmitHandler,
        kind: FormKind.CreatePlaylist
    }
}



export const useFormPopupManager = function () {
    const playlistManager = usePlaylistManager();
    return useRecoilCallback(({ set, snapshot }) => async (kind: FormKind, data?: unknown) => {
        switch (kind) {
            case FormKind.CreatePlaylist: {
                const popupData: FormPopupData = {
                    items: [
                        { id: "name", name: "이름" },
                        { id: "description", name: "설명" },
                    ],
                    submit: (data: unknown) => {
                        const playListInfo: PlaylistInfo = data as PlaylistInfo;
                        if (playListInfo && playListInfo.name && playListInfo.description) {
                            const createAction: PlaylistAction = {
                                type: PlaylistActionType.CREATE,
                                payload: {
                                    info: playListInfo,
                                    items: []
                                }
                            }
                            playlistManager(createAction);
                            set(FormPopupOpenState, false);
                        }
                    },
                    kind: FormKind.CreatePlaylist
                }
                set(FormPopupState, popupData);
                set(FormPopupOpenState, true);
            } break;
            case FormKind.AppendPlaylist: {
                const playlistIDs: string[] = snapshot.getLoadable(playlistIDsState).contents;
                const playlistInfos = await Promise.all(playlistIDs.map(async (id) => {
                    return await snapshot.getPromise(playlistInfoStateFamily(id));
                }));
                const popupData: FormPopupData = {
                    items: playlistInfos,
                    submit: (id: unknown) => {
                        if (id) {
                            const appendAction: PlaylistAction = {
                                type: PlaylistActionType.APPEND,
                                payload: {
                                    info: { id: id } as PlaylistInfo,
                                    items: data as PlaylistInfo[]
                                }
                            }
                            playlistManager(appendAction);
                        } else {
                            alert('재생목록지정되지않음!');
                        }
                        set(FormPopupOpenState, false);
                    },
                    kind: FormKind.AppendPlaylist
                }
                set(FormPopupState, popupData);
                set(FormPopupOpenState, true);
            } break;
            case FormKind.UpdatePlaylist: {
                if (typeof data !== "string") {
                    throw "playlist id is not string";
                }
                const playlistInfo = await snapshot.getPromise(playlistInfoStateFamily(data));
                const popupData: FormPopupData = {
                    items: [
                        { id: "name", name: "이름", value: playlistInfo.name },
                        { id: "description", name: "설명", value: playlistInfo.description },
                    ],
                    submit: (data: unknown) => {
                        const playListInfo: PlaylistInfo = data as PlaylistInfo;
                        if (playListInfo && playListInfo.name && playListInfo.description) {
                            const updateAction: PlaylistAction = {
                                type: PlaylistActionType.UPDATE,
                                payload: {
                                    info: playListInfo
                                }
                            }
                            playlistManager(updateAction);
                            set(FormPopupOpenState, false);
                        }
                    },
                    kind: FormKind.UpdatePlaylist,
                    data: playlistInfo
                }
                set(FormPopupState, popupData);
                set(FormPopupOpenState, true);
            } break;
            case FormKind.ImportYTPlaylist: {
                const popupData: FormPopupData = {
                    items: [],
                    submit: (data: unknown) => {
                        const playlist: Playlist = data as Playlist;
                        if (!playlist.info.name) throw 'invalid playlist info';
                        for (let item of playlist.items) {
                            if (!item.videoID) throw 'invalid playlist item';
                        }
                        const createAction: PlaylistAction = {
                            type: PlaylistActionType.CREATE,
                            payload: playlist
                        }
                        playlistManager(createAction);
                        set(FormPopupOpenState, false);
                    },
                    kind: FormKind.ImportYTPlaylist
                }
                set(FormPopupState, popupData);
                set(FormPopupOpenState, true);
            } break;

        }
    });
}
