import { atom, useRecoilCallback } from "recoil";
import { Options } from "../components/OptionSelector";
import { playlistIDsState, playlistInfosState, usePlaylistManager } from './atoms/playlistAtoms'
import { MusicInfoCheck, PlaylistAction, PlaylistActionType, PlaylistInfo } from "../refs/constants";
export interface FormItem {
    id: string,
    name: string,
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
    CreatePlaylist, YoutubeLink, YoutubePlaylist, SelectPlaylist, AppendPlaylist
}
//리코일 콜백으로 정보와 아이템을 아우르는 수정하는 것을 만든다.

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
                    return await snapshot.getPromise(playlistInfosState(id));
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
        }
    });
}
