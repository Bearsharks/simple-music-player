import { atom } from "recoil"

const musicListOpenState = atom<boolean>({
    key: 'musiclistOpen',
    default: false
})

export default musicListOpenState;