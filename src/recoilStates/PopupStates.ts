import { atom } from "recoil";
import { Options } from "../components/OptionSelector";
export interface FormItem {
    id: string,
    name: string,
}
export interface FormPopupData {
    items: FormItem[];
    submit: (data: unknown) => void
}

export enum FormKind {
    CreatePlaylist, YoutubeLink, YoutubePlaylist
}
export function getFormInitData(onSubmitHandler: (data: unknown) => void): FormPopupData {
    return {
        items: [
            { id: "name", name: "이름" },
            { id: "description", name: "설명" },
        ],
        submit: onSubmitHandler
    }
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

export interface OptionSelectorInfo { target: HTMLElement, items: Options[] };
export const OptionSelectorState = atom<OptionSelectorInfo>({
    key: "optionSelector",
    default: {} as OptionSelectorInfo
})