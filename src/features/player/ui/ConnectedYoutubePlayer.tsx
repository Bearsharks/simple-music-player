import { loadIframeApi } from "../api/iframe";
import { useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  MusicInfoActionType,
  MusicInfoItem,
  PlayerState,
} from "shared/model/constants";
import { ytPlayerInitedState } from "features/player/model/ytplayerStates";
import youtubeSearch, { SearchType } from "features/youtube/api/youtubeSearch";
import {
  useCurMusicManager,
  curMusicInfoState,
} from "features/queue/model/queue";
import {
  musicPlayerState,
  musicPlayerProgressState,
  playbackErrorState,
  playbackRetryState,
} from "features/player/model/playback";

const handleKeyboardEvent = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement | null;
  if (
    e.defaultPrevented ||
    target?.closest(
      "input,textarea,select,button,[contenteditable=true],[role=dialog],[role=group]",
    ) ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  const player = (window as any).player;
  if (!player) return;
  if ([" ", "ArrowRight", "ArrowLeft", "m"].includes(e.key)) e.preventDefault();
  if (e.key === " ") {
    if (player.getPlayerState() === PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  } else if (e.key === "ArrowRight") {
    player.seekTo(player.getCurrentTime() + 5);
  } else if (e.key === "ArrowLeft") {
    player.seekTo(player.getCurrentTime() - 5);
  } else if (e.key === "m") {
    if (player.isMuted()) player.unMute();
    else player.mute();
  }
};

function YoutubePlayer() {
  const setYTPlayerInited = useSetAtom(ytPlayerInitedState);
  const [readyPlayer, setReadyPlayer] = useState<any>(null);
  const activePlayer = useRef<any>(null);
  const setPlayState = useSetAtom(musicPlayerState);
  const curMusicManager = useCurMusicManager();
  const curMusic = useAtomValue(curMusicInfoState);
  const setProgress = useSetAtom(musicPlayerProgressState);
  const prevMusicRef = useRef<MusicInfoItem | undefined>(undefined);
  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyboardEvent);
    };
  }, []);
  const host = useRef<HTMLDivElement>(null);
  const setError = useSetAtom(playbackErrorState);
  const retry = useAtomValue(playbackRetryState);
  useEffect(() => {
    let cancelled = false;
    let player: any;
    setYTPlayerInited(false);
    setReadyPlayer(null);
    setPlayState(PlayerState.BUFFERING);
    setError("");
    prevMusicRef.current = undefined;
    const timeout = window.setTimeout(() => {
      if (!cancelled)
        setError(
          "YouTube 플레이어가 응답하지 않습니다. 연결을 확인하고 다시 시도해 주세요.",
        );
    }, 20000);
    loadIframeApi()
      .then((YT) => {
        if (cancelled || !host.current) return;
        const mount = document.createElement("div");
        host.current.replaceChildren(mount);
        player = new YT.Player(mount, {
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, autoplay: 1 },
          events: {
            onReady: () => {
              if (!cancelled) {
                clearTimeout(timeout);
                // The ready instance changes even if false → true is batched.
                setReadyPlayer(player);
                setYTPlayerInited(true);
                setError("");
              }
            },
            onError: () => {
              if (!cancelled)
                setError(
                  "이 영상을 재생할 수 없습니다. 삭제·비공개·임베드 제한 또는 연결 상태를 확인해 주세요.",
                );
            },
            onStateChange: (event: { data: number }) => {
              if (cancelled) return;
              setPlayState(event.data);
              if (event.data === PlayerState.PLAYING) setError("");
              if (event.data === PlayerState.ENDED) {
                setProgress({
                  duration: player.getDuration(),
                  currentTime: player.getDuration(),
                });
                void curMusicManager({ type: MusicInfoActionType.NEXT });
              }
            },
          },
        });
        activePlayer.current = player;
        (window as any).player = player;
      })
      .catch((error) => {
        clearTimeout(timeout);
        if (!cancelled) setError(error.message);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (activePlayer.current === player) activePlayer.current = null;
      player?.destroy();
      if ((window as any).player === player) delete (window as any).player;
      setYTPlayerInited(false);
    };
  }, [
    curMusicManager,
    setPlayState,
    setProgress,
    setYTPlayerInited,
    setError,
    retry,
  ]);
  useEffect(() => {
    if (!readyPlayer || readyPlayer !== activePlayer.current) return;
    let cancelled = false;
    const player = readyPlayer;
    if (!curMusic.query && !curMusic.videoID) {
      player.stopVideo();
      setProgress({ duration: 0, currentTime: 0 });
      setError("");
      prevMusicRef.current = undefined;
      return;
    }
    if (
      player.getPlayerState() !== PlayerState.ENDED &&
      prevMusicRef.current &&
      curMusic.key === prevMusicRef.current.key &&
      curMusic.videoID === prevMusicRef.current.videoID
    )
      return;

    setError("");
    setProgress({ duration: 0, currentTime: 0 });
    setPlayState(PlayerState.BUFFERING);
    if (curMusic.videoID) {
      player.loadVideoById({ videoId: curMusic.videoID });
    } else {
      youtubeSearch(curMusic.query, SearchType.Search)
        .then((data) => {
          if (cancelled) return;
          if (!data[0]) throw new Error("재생할 영상을 찾을 수 없습니다.");
          curMusicManager({
            type: MusicInfoActionType.SET_INFO,
            payload: data[0],
          });
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || "영상을 찾지 못했습니다.");
        });
    }
    prevMusicRef.current = curMusic;
    return () => {
      cancelled = true;
    };
  }, [
    curMusic,
    readyPlayer,
    curMusicManager,
    setError,
    setProgress,
    setPlayState,
  ]);

  return <div id="player" ref={host}></div>;
}

export default YoutubePlayer;
