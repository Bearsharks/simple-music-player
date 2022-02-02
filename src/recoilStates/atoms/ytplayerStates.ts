import { atom } from "recoil";

export const ytPlayerInitedState = atom<boolean>({
    key:"ytPlayerInited",
    default: false
})