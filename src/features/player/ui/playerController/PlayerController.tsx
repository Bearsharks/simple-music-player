import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import ProgressBar from "../ConnectedProgressBar";
import type { MusicInfo } from "shared/model/constants";
import Cover from "shared/ui/Cover";
import Icon from "shared/ui/Icon";
import SoundController from "./SoundController";
import "./ListeningDock.scss";
export interface PlaybackControls {
  isPlaying: boolean;
  goNext: () => void;
  goPrev: () => void;
  togglePlayState: () => void;
  canPlay?: boolean;
  canNext?: boolean;
}
export interface PlayerControllerProps extends PlaybackControls {
  musicInfo: MusicInfo;
  playerVisiblity: boolean;
  togglePlayerVisiblity: () => void;
  openNow?: () => void;
  status?: string;
}
export function Transport(props: PlaybackControls & { leading?: ReactNode }) {
  return (
    <div className="transport">
      {props.leading}
      <button
        className="icon-button previous-track"
        aria-label="이전 곡"
        disabled={props.canPlay === false}
        onClick={props.goPrev}
      >
        <Icon name="previous" />
      </button>
      <button
        className="transport-play"
        aria-label={props.isPlaying ? "일시 정지" : "재생"}
        disabled={props.canPlay === false}
        onClick={props.togglePlayState}
      >
        <Icon name={props.isPlaying ? "pause" : "play"} />
      </button>
      <button
        className="icon-button next-track"
        aria-label="다음 곡"
        disabled={props.canNext === false}
        onClick={props.goNext}
      >
        <Icon name="next" />
      </button>
    </div>
  );
}
export default function PlayerController(props: PlayerControllerProps) {
  const hasTrack = Boolean(props.musicInfo.name);
  return createPortal(
    <footer className="listening-dock" aria-label="재생 컨트롤">
      <ProgressBar readOnly />
      <button
        className="dock-track"
        aria-label="현재 곡 플레이어 열기"
        onClick={props.openNow ?? props.togglePlayerVisiblity}
      >
        {hasTrack ? (
          <Cover
            id={props.musicInfo.videoID || props.musicInfo.name}
            thumbnail={props.musicInfo.thumbnail}
          />
        ) : (
          <span className="dock-empty-art">
            <Icon name="wave" />
          </span>
        )}
        <span className="dock-track-text">
          <strong>{props.musicInfo.name || "음악을 선택해 주세요"}</strong>
          <small>
            {hasTrack
              ? `${props.musicInfo.owner || "YouTube"} · ${props.status || "재생 준비"}`
              : "재생목록에서 재생을 눌러 시작하세요"}
          </small>
        </span>
      </button>
      <div className="dock-center">
        <Transport
          {...props}
          canPlay={props.canPlay ?? hasTrack}
          canNext={props.canNext ?? hasTrack}
        />
        <ProgressBar />
      </div>
      <div className="dock-right">
        <SoundController />
        <span className="dock-divider" />
        <button
          className={`icon-button queue-toggle ${props.playerVisiblity ? "selected" : ""}`}
          aria-label="재생 대기열"
          aria-expanded={props.playerVisiblity}
          onClick={props.togglePlayerVisiblity}
        >
          <Icon name="queue" />
        </button>
      </div>
    </footer>,
    document.body,
  );
}
