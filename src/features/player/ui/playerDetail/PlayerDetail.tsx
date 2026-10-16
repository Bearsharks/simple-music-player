import { useEffect, useId, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  MusicListActionType,
  type MusicInfoItem,
} from "shared/model/constants";
import YoutubePlayer from "../ConnectedYoutubePlayer";
import ProgressBar from "../ConnectedProgressBar";
import SoundController from "../playerController/SoundController";
import {
  Transport,
  type PlaybackControls,
} from "../playerController/PlayerController";
import { playbackErrorState, playbackRetryState } from "../../model/playback";
import { useOpenSelectTgtPlaylistPopup } from "features/overlays/PopupStates";
import MusicList from "features/queue/ui/ConnectedMusicList";
import {
  curMusicInfoState,
  useMusicListManager,
} from "features/queue/model/queue";
import musiclistOpenState, {
  playerPanelTabState,
} from "features/queue/model/musiclistOpenState";
import Dialog from "shared/ui/Dialog";
import Cover from "shared/ui/Cover";
import Icon from "shared/ui/Icon";
import "./PlayerDetail.scss";
export interface PlayerDetailProps extends PlaybackControls {
  playerVisiblity: boolean;
  musicList: MusicInfoItem[];
  status: string;
}
export default function PlayerDetail({
  playerVisiblity,
  musicList,
  status,
  ...controls
}: PlayerDetailProps) {
  const [wide, setWide] = useState(() => window.innerWidth >= 1200);
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1200);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const [tab, setTab] = useAtom(playerPanelTabState);
  const [clearOpen, setClearOpen] = useState(false);
  const save = useOpenSelectTgtPlaylistPopup();
  const manage = useMusicListManager();
  const setOpen = useSetAtom(musiclistOpenState);
  const closePanel = () => {
    setOpen(false);
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(".queue-toggle")?.focus(),
    );
  };
  const current = useAtomValue(curMusicInfoState);
  const error = useAtomValue(playbackErrorState);
  const retry = useSetAtom(playbackRetryState);
  const hasMountedPlayer = useRef(false);
  if (musicList.length) hasMountedPlayer.current = true;
  const id = useId();
  return (
    <>
      <Dialog
        label="지금 재생 및 대기열"
        open={playerVisiblity}
        modal={!wide}
        priority={0}
        onClose={closePanel}
        className="now-panel"
      >
        <header className="now-heading">
          <div>
            <h2>지금 재생</h2>
          </div>
          <button
            className="icon-button"
            aria-label="대기열 닫기"
            data-empty-track-focus
            onClick={closePanel}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="queue-tabs" role="tablist" aria-label="플레이어 보기">
          {(["now", "queue"] as const).map((value, index) => (
            <button
              key={value}
              role="tab"
              id={`${id}-${value}-tab`}
              aria-controls={`${id}-${value}`}
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 1
                      : 1 - index;
                setTab(next === 0 ? "now" : "queue");
                event.currentTarget.parentElement
                  ?.querySelectorAll("button")
                  [next].focus();
              }}
            >
              {value === "now" ? "현재 곡" : `대기열 (${musicList.length})`}
            </button>
          ))}
        </div>
        <div className="queue-body">
          <section
            id={`${id}-now`}
            role="tabpanel"
            aria-labelledby={`${id}-now-tab`}
            hidden={tab !== "now"}
          >
            <div className="video-surface">
              {hasMountedPlayer.current ? (
                <YoutubePlayer />
              ) : (
                <div className="now-empty">
                  <Icon name="wave" />
                  <p>좋아하는 음악을 선택해 주세요.</p>
                </div>
              )}
            </div>
            <div className="now-title">
              <h3>{current.name || "아직 재생 중인 곡이 없어요"}</h3>
              <p>
                {current.owner ||
                  (current.name
                    ? "YouTube 영상"
                    : "저장 목록에서 재생을 눌러 시작하세요.")}
              </p>
            </div>
            <p className="state-label" role="status">
              {status}
            </p>
            {error && current.name && (
              <div className="error-box" role="alert">
                <strong>이 곡을 재생할 수 없어요.</strong>
                <p>{error}</p>
                <div className="actions">
                  <button
                    className="secondary-button"
                    onClick={() => retry((value) => value + 1)}
                  >
                    <Icon name="reset" />
                    다시 시도
                  </button>
                  <button
                    className="secondary-button"
                    disabled={!controls.canNext}
                    onClick={controls.goNext}
                  >
                    다음 곡
                  </button>
                </div>
              </div>
            )}
            <div className="player-large-controls">
              <ProgressBar />
              <Transport {...controls} leading={<SoundController overlay />} />
            </div>
          </section>
          <section
            id={`${id}-queue`}
            role="tabpanel"
            aria-labelledby={`${id}-queue-tab`}
            hidden={tab !== "queue"}
          >
            {current.name && (
              <button
                className="queue-current"
                onClick={() => setTab("now")}
                aria-label="현재 곡 보기"
              >
                <Cover
                  id={current.videoID || current.key}
                  thumbnail={current.thumbnail}
                />
                <span>
                  <small>{status}</small>
                  <strong>{current.name}</strong>
                </span>
                <Icon name="wave" />
              </button>
            )}
            <div className="queue-heading">
              <h3>
                재생 대기열 <small>{musicList.length}곡</small>
              </h3>
              <div className="queue-actions">
                <button
                  className="icon-button"
                  disabled={!musicList.length}
                  aria-label="대기열을 재생목록에 저장"
                  onClick={(event) => save(event.currentTarget, musicList)}
                >
                  <Icon name="save" />
                </button>
                <button
                  className="icon-button"
                  disabled={!musicList.length}
                  aria-label="대기열 비우기"
                  onClick={() => setClearOpen(true)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
            {musicList.length ? (
              <MusicList items={musicList} currentStatus={status} />
            ) : (
              <div className="queue-empty">
                <Icon name="queue" />
                <p>대기열이 비어 있어요.</p>
                <small>재생목록의 재생 버튼을 눌러 시작하세요.</small>
              </div>
            )}
          </section>
        </div>
      </Dialog>
      {clearOpen && (
        <Dialog label="대기열 비우기" onClose={() => setClearOpen(false)}>
          <section className="clear-queue">
            <h2>대기열을 비울까요?</h2>
            <p>
              현재 {musicList.length}곡과 재생이 종료됩니다. 저장한 재생목록은
              유지됩니다.
            </p>
            <div>
              <button
                className="secondary-button"
                onClick={() => setClearOpen(false)}
              >
                취소
              </button>
              <button
                className="button danger-button"
                onClick={() => {
                  void manage({ type: MusicListActionType.CLEAR });
                  setClearOpen(false);
                }}
              >
                비우기
              </button>
            </div>
          </section>
        </Dialog>
      )}
    </>
  );
}
