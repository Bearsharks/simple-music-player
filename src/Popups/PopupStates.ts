import { atom, useRecoilCallback } from "recoil";
import { playlistIDsState, playlistInfoStateFamily, usePlaylistManager } from '../recoilStates/atoms/playlistAtoms'
import { Playlist, PlaylistAction, PlaylistActionType, PlaylistInfo } from "../refs/constants";
export const ModalOpenState = atom<boolean>({
    key: "formPopupOpen",
    default: false
})

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

export enum PopupKind {
    PlaylistOptions, MusicOptions, SelectTgtPlaylist, SearchOptions
}
export interface PopupInfo {
    target: HTMLElement,
    kind: PopupKind,
    data?: unknown
};

export const PopupInfoState = atom<PopupInfo>({
    key: "optionSelector",
    default: {} as PopupInfo
})
export const popupOpenState = atom<boolean>({
    key: "popupOpen",
    default: false
})


export interface FormPopupData {
    kind: FormKind;
    data?: any;
}

export enum FormKind {
    CreatePlaylist, UpdatePlaylist, ImportYTPlaylist
}
export const useFormPopupManager = function () {
    return useRecoilCallback(({ set, snapshot }) => async (kind: FormKind, data?: unknown) => {
        switch (kind) {
            case FormKind.CreatePlaylist: {
                const popupData: FormPopupData = {
                    kind: FormKind.CreatePlaylist,
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
                    kind: FormKind.UpdatePlaylist,
                    data: playlistInfo
                }
                set(FormPopupState, popupData);
                set(FormPopupOpenState, true);
            } break;
            case FormKind.ImportYTPlaylist: {
                const popupData: FormPopupData = {
                    kind: FormKind.ImportYTPlaylist
                }
                set(FormPopupState, popupData);
                set(FormPopupOpenState, true);
            } break;

        }
    });
}


