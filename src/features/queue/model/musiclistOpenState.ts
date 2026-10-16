import { atom } from "jotai";
const musicListOpenState = atom(false);
const firstPlaybackRevealed = atom(false);
/** Only the first deliberate playback may reveal the panel. Later edits respect dismissal. */
export const revealQueueOnFirstPlay = atom(null, (get, set) => {
  if (!get(firstPlaybackRevealed)) {
    set(firstPlaybackRevealed, true);
    // Never interrupt a narrow-screen task with an unsolicited modal sheet.
    if (window.innerWidth >= 1200) set(musicListOpenState, true);
  }
});
export const playerPanelTabState = atom<"now" | "queue">("queue");
export default musicListOpenState;
