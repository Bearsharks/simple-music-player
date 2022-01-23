import { atom } from "recoil";
import { FormPopupData } from "../FormPopup";

export const FormPopupOpenState = atom<boolean>({
    key: "formPopupOpen",
    default: false
})
export const FormPopupState = atom<FormPopupData>({
    key: "formPopup",
    default: {} as FormPopupData
})