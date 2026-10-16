import { atom } from "recoil";

export const sideMenuOpenState = atom<boolean>({
    key: 'sideMenuOpen',
    default: false
});