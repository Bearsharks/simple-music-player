import { atom } from "jotai";
import { PlayerState, Progress } from "shared/model/constants";
export const musicPlayerState = atom<PlayerState>(PlayerState.ENDED);
export const musicPlayerProgressState = atom<Progress>({
  duration: 0,
  currentTime: 0,
});
