import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import PlayerController from "../ui/playerController/PlayerController";
import PlayerDetail from "../ui/playerDetail/PlayerDetail";
import {
  curMusicInfoState,
  curMusicIdxState,
  musicListState,
  useCurMusicManager,
} from "features/queue/model/queue";
import musiclistOpenState, {
  playerPanelTabState,
} from "features/queue/model/musiclistOpenState";
import {
  musicPlayerState,
  musicPlayerProgressState,
  playbackErrorState,
  playbackStatus,
} from "../model/playback";
import { ytPlayerInitedState } from "../model/ytplayerStates";
import { MusicInfoActionType, PlayerState } from "shared/model/constants";
export default function MusicPlayer() {
  const [open, setOpen] = useAtom(musiclistOpenState);
  const [tab, setTab] = useAtom(playerPanelTabState);
  const track = useAtomValue(curMusicInfoState);
  const list = useAtomValue(musicListState);
  const index = useAtomValue(curMusicIdxState);
  const state = useAtomValue(musicPlayerState);
  const error = useAtomValue(playbackErrorState);
  const ready = useAtomValue(ytPlayerInitedState);
  const setProgress = useSetAtom(musicPlayerProgressState);
  const manage = useCurMusicManager();
  useEffect(() => {
    const timer = setInterval(() => {
      const player = (window as any).player;
      if (
        ready &&
        [PlayerState.PLAYING, PlayerState.PAUSED].includes(
          player?.getPlayerState(),
        )
      ) {
        setProgress({
          currentTime: player.getCurrentTime(),
          duration: player.getDuration(),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [ready, setProgress]);
  const controls = {
    isPlaying: ready && !error && state === PlayerState.PLAYING,
    canPlay: Boolean(track.key) && ready && !error,
    canNext: index < list.length - 1,
    goNext: () => {
      void manage({ type: MusicInfoActionType.NEXT });
    },
    goPrev: () => {
      const player = (window as any).player;
      if (player?.getCurrentTime() >= 2) player.seekTo(0);
      else void manage({ type: MusicInfoActionType.PREV });
    },
    togglePlayState: () => {
      const player = (window as any).player;
      state === PlayerState.PLAYING
        ? player?.pauseVideo()
        : player?.playVideo();
    },
  };
  const status = playbackStatus(state, Boolean(track.key), error, ready);
  return (
    <>
      <PlayerController
        {...controls}
        musicInfo={track}
        status={status}
        playerVisiblity={open}
        openNow={() => {
          setTab("now");
          setOpen(true);
        }}
        togglePlayerVisiblity={() => {
          setTab("queue");
          setOpen(!(open && tab === "queue"));
        }}
      />
      <PlayerDetail
        {...controls}
        musicList={list}
        playerVisiblity={open}
        status={status}
      />
    </>
  );
}
