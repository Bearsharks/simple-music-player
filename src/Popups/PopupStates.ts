import { atom, useRecoilCallback } from "recoil";
import { playlistInfoStateFamily } from '../recoilStates/atoms/playlistAtoms'
export const ModalOpenState = atom<boolean>({
    key: "ModalOpen",
    default: false
})
export const ModalInfoState = atom<ModalInfoData>({
    key: "ModalInfo",
    default: {} as ModalInfoData
})

export enum OptionSelectorKind {
    Playlist, SearchBar
}

export const OptionSelectorOpenState = atom<boolean>({
    key: "optionSelectorOpen",
    default: false
})

export enum PopupKind {
    PlaylistOptions, MusicOptions, SelectTgtPlaylist, SearchOptions, YTOptions
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


export interface ModalInfoData {
    kind: ModalKind;
    data?: any;
}

export enum ModalKind {
    CreatePlaylist, UpdatePlaylist, ImportMyYTPlaylist, ImportYTPlaylistLink
}

export const useModalManager = function () {
    return useRecoilCallback(({ set, snapshot }) => async (kind: ModalKind, data?: unknown) => {
        switch (kind) {
            case ModalKind.CreatePlaylist: {
                const popupData: ModalInfoData = {
                    kind: ModalKind.CreatePlaylist,
                }
                set(ModalInfoState, popupData);
                set(ModalOpenState, true);
            } break;
            case ModalKind.UpdatePlaylist: {
                if (typeof data !== "string") {
                    throw "playlist id is not string";
                }
                const playlistInfo = await snapshot.getPromise(playlistInfoStateFamily(data));
                const popupData: ModalInfoData = {
                    kind: ModalKind.UpdatePlaylist,
                    data: playlistInfo
                }
                set(ModalInfoState, popupData);
                set(ModalOpenState, true);
            } break;
            case ModalKind.ImportMyYTPlaylist: {
                const popupData: ModalInfoData = {
                    kind: ModalKind.ImportMyYTPlaylist
                }
                set(ModalInfoState, popupData);
                set(ModalOpenState, true);
            } break;
        }
    });
}


