import { atom, selector, useRecoilCallback } from "recoil";
import { playlistInfoStateFamily } from '../recoilStates/playlistAtoms'
import { MusicInfo, MusicInfoItem } from "../refs/constants";
import keyGenerator from "../refs/keyGenerator";
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
    PlaylistOptions, MusicOptions, SelectTgtPlaylist, SearchOptions, YTOptions, PlaylistItemOptions
}
export interface PopupInfo {
    key: string,
    target: HTMLElement,
    kind: PopupKind,
    data?: unknown
};



const PopupInfoState = atom<PopupInfo[]>({
    key: "popupInfoState",
    default: []
})
export const getPopupInfoState = selector<PopupInfo[]>({
    key: "getPopupInfo",
    get: ({ get }) => {
        return get(PopupInfoState);
    }
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

const useOpenPopup = () => {
    return useRecoilCallback(({ set, snapshot }) =>
        (kind: PopupKind, target: HTMLElement, data?: unknown) => {
            set(PopupInfoState, (prev) => {
                const samePopup = prev.filter((info) => info.target === target && info.kind === kind);
                if (samePopup.length) {
                    return prev;
                }
                return [...prev, {
                    key: keyGenerator()[0],
                    target: target,
                    kind: kind,
                    data: data
                }];

            });
        }
    )
}
export const useClosePopup = () => {
    return useRecoilCallback(({ set }) =>
        (key: string) => {
            set(PopupInfoState, (prev) => prev.filter((info) => key !== info.key));
        }
    )
}
export const useOpenMusicOptionsPopup = () => {
    const openPopup = useOpenPopup();
    return (target: HTMLElement, musicInfo: MusicInfo[]) =>
        openPopup(PopupKind.MusicOptions, target, musicInfo);
}
export const useOpenPlaylistItemOptionsPopup = () => {
    const openPopup = useOpenPopup();
    return (target: HTMLElement, playlistID: string, musicInfos: MusicInfoItem[]) =>
        openPopup(PopupKind.PlaylistItemOptions, target, { playlistID, musicInfos });
}
export const useOpenYTOptionsPopup = () => {
    const openPopup = useOpenPopup();
    return (target: HTMLElement) =>
        openPopup(PopupKind.YTOptions, target);
}
export const useOpenSelectTgtPlaylistPopup = () => {
    const openPopup = useOpenPopup();
    return (target: HTMLElement, musicInfo: MusicInfo[]) =>
        openPopup(PopupKind.SelectTgtPlaylist, target, musicInfo);
}
export const useOpenPlaylistOptionsPopup = () => {
    const openPopup = useOpenPopup();
    return (target: HTMLElement, playlistID: string) =>
        openPopup(PopupKind.PlaylistOptions, target, playlistID);
}

export const useOpenSearchOptionsPopup = () => {
    const openPopup = useOpenPopup();
    return (target: HTMLElement, textarea: HTMLTextAreaElement) =>
        openPopup(PopupKind.SearchOptions, target, textarea);
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
            case ModalKind.ImportYTPlaylistLink: {
                const popupData: ModalInfoData = {
                    kind: ModalKind.ImportYTPlaylistLink
                }
                set(ModalInfoState, popupData);
                set(ModalOpenState, true);
            }
        }
    });
}


