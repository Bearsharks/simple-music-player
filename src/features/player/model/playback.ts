import { atom } from "jotai";
import { PlayerState, Progress } from "shared/model/constants";
export const musicPlayerState = atom<PlayerState>(PlayerState.ENDED);
export const musicPlayerProgressState = atom<Progress>({
  duration: 0,
  currentTime: 0,
});
export const playbackErrorState = atom("");
/** Increment only for an explicit retry, never for layout/visibility changes. */
export const playbackRetryState = atom(0);
export function playbackStatus(
  state: PlayerState,
  hasTrack: boolean,
  error: string,
  ready: boolean,
) {
  if (!hasTrack) return "재생 대기 중";
  if (error) return "재생 오류";
  if (!ready) return "YouTube 연결 중";
  if (state === PlayerState.PLAYING) return "재생 중";
  if (state === PlayerState.PAUSED) return "일시 정지";
  if (state === PlayerState.ENDED) return "재생 완료";
  if (state === PlayerState.CUED) return "재생 준비";
  return "불러오는 중";
}
