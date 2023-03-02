import { atom } from "recoil";

export const ytPlayerInitState = atom<boolean>({
    key:"ytPlayerInited",
    default: false
})