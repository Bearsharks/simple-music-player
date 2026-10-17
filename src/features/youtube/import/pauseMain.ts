/** Existing application player stays mounted; only explicit preview playback pauses it. */
export function pauseMain() {
  const player = (window as unknown as {player?:{getPlayerState?:()=>number;pauseVideo?:()=>void}}).player;
  if(player?.getPlayerState?.()===1)player.pauseVideo?.();
}
