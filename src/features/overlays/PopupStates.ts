import { atom, useStore } from "jotai";
import { playlistInfoStateFamily } from 'features/playlists/model/playlistAtoms';
import { MusicInfo, MusicInfoArrayCheck, MusicInfoItem } from "shared/model/constants";
import keyGenerator from "shared/lib/keyGenerator";
export const ModalOpenState = atom<boolean>(false)
export const ModalInfoState = atom<ModalInfoData>({} as ModalInfoData)

export enum OptionSelectorKind {
    Playlist, SearchBar
}

export const OptionSelectorOpenState = atom<boolean>(false)

export enum PopupKind {
    PlaylistOptions, MusicOptions, SelectTgtPlaylist, SearchOptions, YTOptions, PlaylistItemOptions
}
export interface PopupInfo {
    key: string,
    target: HTMLElement,
    kind: PopupKind,
    data?: unknown
};



const PopupInfoState = atom<PopupInfo[]>([])
export const getPopupInfoState = atom((get) => get(PopupInfoState));
export const popupOpenState = atom<boolean>(false)


export interface ModalInfoData {
    kind: ModalKind;
    data?: any;
}

export enum ModalKind {
    CreatePlaylist, UpdatePlaylist, ImportMyYTPlaylist, ImportYTPlaylistLink
}

const useOpenPopup = () => {
    const store = useStore();
    const { set } = store;
    return (kind: PopupKind, target: HTMLElement, data?: unknown) => {
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

}
export const useClosePopup = () => {
    const store = useStore();
    const { set } = store;
    return (key: string) => {
            set(PopupInfoState, (prev) => prev.filter((info) => key !== info.key));
        }

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
    const store = useStore();
    const { set } = store;
    return async (kind: ModalKind, data?: unknown) => {
        switch (kind) {
            case ModalKind.CreatePlaylist:
                if (data && !MusicInfoArrayCheck(data)) {
                    throw "musicInfo is not valid";
                }
                const popupData: ModalInfoData = data ? {
                    kind: ModalKind.CreatePlaylist,
                    data: data
                } : { kind: ModalKind.CreatePlaylist }
                set(ModalInfoState, popupData);
                set(ModalOpenState, true);
                break;
            case ModalKind.UpdatePlaylist: {
                if (typeof data !== "string") {
                    throw "playlist id is not string";
                }
                const playlistInfo = await store.get(playlistInfoStateFamily(data));
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
    };
}


