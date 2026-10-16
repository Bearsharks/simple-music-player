import musiclistOpenState from "features/queue/model/musiclistOpenState";
import PlaylistImport from "features/youtube/ui/PlaylistImport";
import { urlToId, SearchType } from "features/youtube/api/youtubeSearch";
import { usePlaylistManager } from "features/playlists/model/playlistAtoms";
import { PlaylistActionType } from "shared/model/constants";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import Thumbnail from "shared/ui/Thumbnail";
import {
  useCurMusicManager,
  useMusicListManager,
} from "features/queue/model/queue";
import {
  playlistIDsState,
  playlistInfoStateFamily,
  playlistItemStateFamily,
} from "features/playlists/model/playlistAtoms";
import styles from "features/playlists/pages/PlaylistPage.module.scss";
import {
  useOpenPlaylistItemOptionsPopup,
  useOpenPlaylistOptionsPopup,
} from "features/overlays/PopupStates";
import {
  MusicInfoActionType,
  MusicInfoItem,
  MusicListActionType,
} from "shared/model/constants";
import { Suspense } from "react";
import Spinner from "shared/ui/Spinner";
import MoreVert from "shared/ui/MoreVert";
import Dialog from "shared/ui/Dialog";
import MusicItem from "features/queue/ui/musicList/MusicItem";
function PlaylistPage() {
  const { id = '' } = useParams();
  const ids = useAtomValue(playlistIDsState);
  const navigate = useNavigate();
  const visited = useRef('');
  const exists = ids.includes(id);
  useEffect(() => {
    if (exists) visited.current = id;
    else if (visited.current === id) navigate('/', { replace: true });
  }, [exists, id, navigate]);
  if (!exists) return <section role="status">
    <h1>재생목록을 찾을 수 없습니다</h1>
    <p>삭제되었거나 이 브라우저에 저장되지 않은 목록입니다.</p>
    <button onClick={() => navigate('/')}>라이브러리로 돌아가기</button>
  </section>;
  return <PlaylistDetail key={id} playlistID={id} />;
}

function PlaylistDetail({ playlistID }: { playlistID: string }) {
  const [resetOpen, setResetOpen] = useState(false);
  const [playError, setPlayError] = useState("");
  const playList = useMusicListManager();
  const setQueueOpen = useSetAtom(musiclistOpenState);
  const openPlaylistOptionsPopup = useOpenPlaylistOptionsPopup();
  const playlistInfo = useAtomValue(playlistInfoStateFamily(playlistID));

  return (
    <div className={styles["container"]}>
      <div className={styles["thumbnail"]}>
        <Thumbnail
          thumbnails={playlistInfo.thumbnails}
          name={playlistInfo.name}
        ></Thumbnail>
      </div>

      <div className={styles["metadata"]}>
        <span className="section-kicker">YOUR PERSONAL PLAYLIST</span>
        <div className={styles["metadata__name"]}>
          <h1>{playlistInfo.name}</h1>
          <MoreVert
            size={32}
            onClick={(e) =>
              openPlaylistOptionsPopup(e.currentTarget, playlistID)
            }
          />
        </div>
        <div className={styles["metadata__item-count"]}>
          노래 {playlistInfo.itemCount}곡
        </div>
        <div
          className={styles["metadata__description"]}
          title={playlistInfo.description}
        >
          {playlistInfo.description}
        </div>

        <div className={styles["actions"]}>
          <button
            className="primary-button"
            disabled={!playlistInfo.itemCount}
            onClick={async () => {
              try {
                await playList({ type: MusicListActionType.LOAD_PLAYLIST, payload: playlistID });
                setPlayError("");
                setQueueOpen(true);
              } catch (error) {
                setPlayError(error instanceof Error ? error.message : "재생목록을 불러오지 못했습니다.");
              }
            }}
          >
            <span className="material-icons">play_arrow</span>전체 재생
          </button>
          <span className={styles["sourceBadge"]}>
            {playlistInfo.sourcePlaylistUrl
              ? "YouTube import"
              : "Local playlist"}
          </span>
        </div>
      </div>
      <div className={styles["playlist"]}>
        {playError && <p role="alert">{playError}</p>}
        <AddVideo playlistID={playlistID} />
        {playlistInfo.sourcePlaylistUrl && (
          <button onClick={() => setResetOpen(true)}>원본으로 초기화</button>
        )}
        {resetOpen && (
          <Dialog label="원본 초기화" onClose={() => setResetOpen(false)}>
            <PlaylistImport original={playlistInfo} close={() => setResetOpen(false)} />
          </Dialog>
        )}
        <br></br>
        <Suspense fallback={<Spinner></Spinner>}>
          <PlaylistItems playlistID={playlistID} />
        </Suspense>
      </div>
      <br></br>
      <br></br>
      <br></br>
    </div>
  );
}

export default PlaylistPage;

function PlaylistItems({ playlistID }: { playlistID: string }) {
  const curMusicManager = useCurMusicManager();
  const setQueueOpen = useSetAtom(musiclistOpenState);
  const manager = usePlaylistManager();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const move = async (from: number, to: number) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const ordered = [...items];
    const [item] = ordered.splice(from, 1);
    ordered.splice(to, 0, item);
    try {
      await manager({
        type: PlaylistActionType.UPDATE,
        payload: { info: { id: playlistID }, items: ordered },
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const openMusicOptionsPopup = useOpenPlaylistItemOptionsPopup();
  const items = useAtomValue(playlistItemStateFamily(playlistID));
  const playMusic = (idx: number | undefined) => {
    setQueueOpen(true);
    curMusicManager({
      type: MusicInfoActionType.SET,
      payload: {
        idx: idx,
        list: items,
      },
    });
  };
  const openPopup = (target: HTMLElement, musicInfos: MusicInfoItem[]) => {
    openMusicOptionsPopup(target, playlistID, musicInfos);
  };
  return (
    <>
      <div className={styles["tableHeading"]}>
        <span>#</span>
        <span>TRACK / ARTIST</span>
        <span>ORDER</span>
      </div>
      {!items.length && (
        <div className={styles["empty"]}>
          첫 번째 곡을 추가해 보세요.
          <small>영상 URL을 붙여넣으면 이 목록에 저장됩니다.</small>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {items.map((item, idx) => (
        <div key={item.key} className={styles["playlist__item"]}>
          <div>{idx + 1}.</div>
          <MusicItem
            idx={idx}
            item={item}
            playMusic={playMusic}
            openOptionsPopup={openPopup}
          ></MusicItem>
          <button
            aria-label={`${item.name} 위로`}
            disabled={busy || idx === 0}
            onClick={() => move(idx, idx - 1)}
          >
            ↑
          </button>
          <button
            aria-label={`${item.name} 아래로`}
            disabled={busy || idx === items.length - 1}
            onClick={() => move(idx, idx + 1)}
          >
            ↓
          </button>

        </div>
      ))}
    </>
  );
}

function AddVideo({ playlistID }: { playlistID: string }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const manager = usePlaylistManager();
  return (
    <form
      className={styles["addVideo"]}
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        try {
          const parsed = urlToId(url);
          if (parsed.kind !== SearchType.Music)
            throw new Error("재생목록이 아닌 개별 영상 URL을 넣어 주세요.");
          await manager({
            type: PlaylistActionType.APPEND,
            payload: {
              info: { id: playlistID },
              items: [
                {
                  videoID: parsed.id,
                  name: name.trim() || `동영상 (${parsed.id})`,
                  query: "",
                  owner: "",
                  thumbnail: `https://i.ytimg.com/vi/${parsed.id}/default.jpg`,
                },
              ],
            },
          });
          setUrl("");
          setName("");
          setError("");
        } catch (e) {
          setError((e as Error).message);
        } finally {
          pending.current = false;
          setBusy(false);
        }
      }}
    >
      <label>
        추가할 영상 URL
        <input
          type="url"
          disabled={busy}
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label>
        곡 이름 (선택)
        <input
          maxLength={120}
          disabled={busy}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button className="primary-button" disabled={busy}>
        {busy ? "추가 중…" : "곡 추가"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
