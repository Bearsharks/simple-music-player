import { useOpenMusicOptionsPopup } from "features/overlays/PopupStates";
import ProgressBar from "features/player/ui/ConnectedProgressBar";
import type { MusicInfo } from "shared/model/constants";
import SoundController from "./SoundController";
import "./ListeningDock.scss";
export interface PlayerControllerProps {
  musicInfo: MusicInfo;
  isPlaying: boolean;
  goNext: () => void;
  goPrev: () => void;
  togglePlayState: () => void;
  playerVisiblity: boolean;
  togglePlayerVisiblity: () => void;
}
export default function PlayerController(props: PlayerControllerProps) {
  const menu = useOpenMusicOptionsPopup();
  const hasTrack = Boolean(props.musicInfo.name);
  return (
    <footer className="listening-dock" aria-label="재생 컨트롤">
      <div className="dock-track">
        <div className="dock-art">
          {props.musicInfo.thumbnail ? (
            <img
              src={props.musicInfo.thumbnail}
              alt=""
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : (
            <span className="material-icons" aria-hidden="true">
              graphic_eq
            </span>
          )}
        </div>
        <div className="dock-track-text">
          <strong>{props.musicInfo.name || "당신의 다음 트랙은?"}</strong>
          <small>
            {props.musicInfo.owner ||
              (hasTrack
                ? "나만의 플레이리스트"
                : "재생목록에서 음악을 선택하세요")}
          </small>
        </div>
        <button
          className="icon-button dock-more"
          disabled={!hasTrack}
          aria-label="현재 곡 더보기"
          onClick={(e) => menu(e.currentTarget, [props.musicInfo])}
        >
          <span className="material-icons">more_horiz</span>
        </button>
      </div>
      <div className="dock-center">
        <div className="transport">
          <button
            className="icon-button"
            aria-label="이전 곡"
            disabled={!hasTrack}
            onClick={props.goPrev}
          >
            <span className="material-icons">skip_previous</span>
          </button>
          <button
            className="transport-play"
            aria-label={props.isPlaying ? "일시 정지" : "재생"}
            disabled={!hasTrack}
            onClick={props.togglePlayState}
          >
            <span className="material-icons">
              {props.isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
          <button
            className="icon-button"
            aria-label="다음 곡"
            disabled={!hasTrack}
            onClick={props.goNext}
          >
            <span className="material-icons">skip_next</span>
          </button>
        </div>
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
          <span className="material-icons">queue_music</span>
        </button>
      </div>
    </footer>
  );
}
