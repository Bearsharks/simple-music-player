import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import type { MusicInfoItem } from "shared/model/constants";
import { MusicListActionType } from "shared/model/constants";
import YoutubePlayer from "features/player/ui/ConnectedYoutubePlayer";
import { useOpenSelectTgtPlaylistPopup } from "features/overlays/PopupStates";
import MusicList from "features/queue/ui/ConnectedMusicList";
import { useMusicListManager } from "features/queue/model/queue";
import musiclistOpenState from "features/queue/model/musiclistOpenState";
export interface PlayerDetailProps {
  playerVisiblity: boolean;
  musicList: MusicInfoItem[];
}
export default function PlayerDetail({
  playerVisiblity,
  musicList,
}: PlayerDetailProps) {
  const [wide, setWide] = useState(() => window.innerWidth >= 1200);
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1200);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const save = useOpenSelectTgtPlaylistPopup();
  const manage = useMusicListManager();
  const setOpen = useSetAtom(musiclistOpenState);
  return (
    <aside
      className={`now-panel ${playerVisiblity ? "is-open" : ""}`}
      aria-label="지금 재생 및 대기열"
      inert={!wide && !playerVisiblity}
      aria-hidden={!wide && !playerVisiblity}
    >
      <div className="now-heading">
        <div>
          지금 재생<small>YOUR LISTENING ROOM</small>
        </div>
        <button
          className="icon-button now-close"
          aria-label="대기열 닫기"
          onClick={() => setOpen(false)}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      <div className="video-surface">
        {musicList.length ? (
          <YoutubePlayer />
        ) : (
          <div className="now-empty">
            <span className="material-icons" aria-hidden="true">
              album
            </span>
            <p>
              아직 조용하네요.
              <br />
              좋아하는 음악으로 채워보세요.
            </p>
          </div>
        )}
      </div>
      <div className="queue-heading">
        <span>
          다음 트랙 <small>{musicList.length}</small>
        </span>
        <div className="queue-actions">
          <button
            className="icon-button"
            disabled={!musicList.length}
            aria-label="대기열을 재생목록에 저장"
            onClick={(e) => save(e.currentTarget, musicList)}
          >
            <span className="material-icons">playlist_add</span>
          </button>
          <button
            className="icon-button"
            disabled={!musicList.length}
            aria-label="대기열 비우기"
            onClick={() => {
              if (
                window.confirm(
                  "현재 재생 대기열을 비울까요? 저장한 재생목록은 유지됩니다.",
                )
              )
                void manage({
                  type: MusicListActionType.DELETE,
                  payload: musicList,
                });
            }}
          >
            <span className="material-icons">playlist_remove</span>
          </button>
        </div>
      </div>
      <div className="queue-list">
        {musicList.length ? (
          <MusicList items={musicList} />
        ) : (
          <p className="queue-empty">
            재생목록의 재생 버튼을 눌러 시작하세요.
            <br />
            순서는 언제든 드래그해서 바꿀 수 있어요.
          </p>
        )}
      </div>
      <div className="now-footer">
        <span className="material-icons" aria-hidden="true">
          lock_outline
        </span>
        목록은 이 브라우저에만 저장됩니다.
        <br />
        YouTube 원본은 변경되지 않습니다.
      </div>
    </aside>
  );
}
