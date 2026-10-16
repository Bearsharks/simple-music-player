import { Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { revealQueueOnFirstPlay } from "features/queue/model/musiclistOpenState";
import {
  useCurMusicManager,
  useMusicListManager,
} from "features/queue/model/queue";
import {
  playlistIDsState,
  playlistInfoStateFamily,
  playlistItemStateFamily,
  usePlaylistManager,
} from "../model/playlistAtoms";
import {
  useOpenPlaylistItemOptionsPopup,
  useOpenPlaylistOptionsPopup,
} from "features/overlays/PopupStates";
import PlaylistImport from "features/youtube/ui/PlaylistImport";
import { urlToId, SearchType } from "features/youtube/api/youtubeSearch";
import {
  MusicInfoActionType,
  MusicListActionType,
  PlaylistActionType,
} from "shared/model/constants";
import Cover from "shared/ui/Cover";
import Icon from "shared/ui/Icon";
import MoreVert from "shared/ui/MoreVert";
import Dialog from "shared/ui/Dialog";
import Spinner from "shared/ui/Spinner";
import MusicItem from "features/queue/ui/musicList/MusicItem";
import styles from "./PlaylistPage.module.scss";
export default function PlaylistPage() {
  const { id = "" } = useParams();
  const ids = useAtomValue(playlistIDsState);
  const navigate = useNavigate();
  const visited = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  const exists = ids.includes(id);
  useEffect(() => {
    if (exists) visited.current = id;
    else if (visited.current === id) navigate("/", { replace: true });
    else heading.current?.focus();
  }, [exists, id, navigate]);
  if (!exists)
    return (
      <section className={styles.empty} role="status">
        <h1 ref={heading} tabIndex={-1}>
          재생목록을 찾을 수 없습니다
        </h1>
        <p>삭제되었거나 이 브라우저에 저장되지 않은 목록입니다.</p>
        <button className="secondary-button" onClick={() => navigate("/")}>
          라이브러리로 돌아가기
        </button>
      </section>
    );
  return <PlaylistDetail key={id} playlistID={id} />;
}
function PlaylistDetail({ playlistID }: { playlistID: string }) {
  const info = useAtomValue(playlistInfoStateFamily(playlistID));
  const location = useLocation();
  const [addOpen, setAddOpen] = useState(
    !info.itemCount || Boolean(location.state?.focusAdd),
  );
  const [editing, setEditing] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const playList = useMusicListManager();
  const reveal = useSetAtom(revealQueueOnFirstPlay);
  const options = useOpenPlaylistOptionsPopup();
  useEffect(() => {
    if (!location.state?.focusAdd) heading.current?.focus();
  }, [location.state]);
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <Cover
          id={playlistID}
          thumbnail={info.thumbnails[0]}
          className={styles.thumbnail}
        />
        <div className={styles.metadata}>
          <span className={styles.kicker}>
            <Icon name="music" /> 저장한 재생목록
          </span>
          <h1 ref={heading} tabIndex={-1}>
            {info.name}
          </h1>
          {info.description && (
            <p className={styles.description}>{info.description}</p>
          )}
          <p className={styles.stats}>
            {info.itemCount}곡 <span>·</span>{" "}
            {info.sourcePlaylistUrl
              ? "YouTube에서 가져옴"
              : "이 브라우저에 저장"}
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <div>
          <button
            className="button play-button"
            disabled={!info.itemCount}
            onClick={async () => {
              try {
                await playList({
                  type: MusicListActionType.LOAD_PLAYLIST,
                  payload: playlistID,
                });
                setError("");
                reveal();
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "재생목록을 불러오지 못했습니다.",
                );
              }
            }}
          >
            <Icon name="play" />
            전체 재생
          </button>
          <button
            className="secondary-button"
            aria-expanded={addOpen}
            aria-controls="add-video"
            aria-label={addOpen ? "곡 추가 닫기" : "곡 추가 열기"}
            onClick={() => setAddOpen(!addOpen)}
          >
            <Icon name="plus" />
            <span>곡 추가</span>
          </button>
          <button
            className={`secondary-button ${styles.editButton}`}
            aria-label="순서 편집"
            aria-pressed={editing}
            disabled={!info.itemCount}
            onClick={() => setEditing(!editing)}
          >
            <Icon name="edit" />
            <span>{editing ? "편집 완료" : "순서 편집"}</span>
          </button>
        </div>
        <MoreVert
          onClick={(event) => options(event.currentTarget, playlistID)}
        />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {addOpen && (
        <AddVideo
          playlistID={playlistID}
          focus={Boolean(location.state?.focusAdd)}
        />
      )}
      <Suspense fallback={<Spinner />}>
        <PlaylistItems playlistID={playlistID} editing={editing} />
      </Suspense>
      <div className={styles.sourceNote}>
        <Icon name="device" />
        <span>저장 목록을 편집해도 현재 재생 대기열은 바뀌지 않습니다.</span>
      </div>
      {info.sourcePlaylistUrl && (
        <div className={styles.sourceNote}>
          <Icon name="link" />
          <span>가져온 원본은 자동으로 동기화하지 않습니다.</span>
          <button
            className="secondary-button"
            onClick={() => setResetOpen(true)}
          >
            원본으로 초기화
          </button>
        </div>
      )}
      {resetOpen && (
        <Dialog label="원본 초기화" onClose={() => setResetOpen(false)}>
          <PlaylistImport original={info} close={() => setResetOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
function PlaylistItems({
  playlistID,
  editing,
}: {
  playlistID: string;
  editing: boolean;
}) {
  const items = useAtomValue(playlistItemStateFamily(playlistID));
  const curMusicManager = useCurMusicManager();
  const reveal = useSetAtom(revealQueueOnFirstPlay);
  const manager = usePlaylistManager();
  const options = useOpenPlaylistItemOptionsPopup();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
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
      setStatus(`${item.name}, ${to + 1}번째로 이동했습니다.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <section aria-label="저장한 곡">
      <div className={styles.tableHeading}>
        <span>#</span>
        <span>곡 / 아티스트</span>
        <span>{editing ? "순서 편집" : `${items.length}곡`}</span>
      </div>
      {!items.length && (
        <div className={styles.empty}>
          <Icon name="music" />
          <h2>첫 번째 곡을 추가해 보세요.</h2>
          <p>영상 URL을 붙여넣으면 이 목록에 저장됩니다.</p>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <span className="sr-only" role="status">
        {status}
      </span>
      {items.map((item, idx) => (
        <div
          key={item.key}
          className={`${styles.item} ${editing ? styles.editing : ""}`}
        >
          <span className={styles.number}>{idx + 1}</span>
          <MusicItem
            idx={idx}
            item={item}
            playMusic={(index) => {
              void curMusicManager({
                type: MusicInfoActionType.SET,
                payload: { idx: index, list: items },
              });
              reveal();
            }}
            openOptionsPopup={(target, tracks) =>
              options(target, playlistID, tracks)
            }
          />
          {editing && (
            <div className={styles.order}>
              <button
                className="icon-button"
                aria-label={`${item.name} 위로`}
                disabled={busy || idx === 0}
                onClick={() => move(idx, idx - 1)}
              >
                <Icon name="up" />
              </button>
              <button
                className="icon-button"
                aria-label={`${item.name} 아래로`}
                disabled={busy || idx === items.length - 1}
                onClick={() => move(idx, idx + 1)}
              >
                <Icon name="down" />
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
function AddVideo({
  playlistID,
  focus,
}: {
  playlistID: string;
  focus: boolean;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const manager = usePlaylistManager();
  const items = useAtomValue(playlistItemStateFamily(playlistID));
  useEffect(() => {
    if (focus) input.current?.focus();
  }, [focus]);
  return (
    <form
      id="add-video"
      className={styles.addVideo}
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending.current) return;
        try {
          const parsed = urlToId(url);
          if (parsed.kind !== SearchType.Music)
            throw new Error("재생목록이 아닌 개별 영상 URL을 넣어 주세요.");
          if (
            items.some((item) => item.videoID === parsed.id) &&
            duplicate !== parsed.id
          ) {
            setDuplicate(parsed.id);
            setError(
              "이미 이 목록에 있는 영상입니다. 같은 곡을 한 번 더 추가할까요?",
            );
            return;
          }
          pending.current = true;
          setBusy(true);
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
          setDuplicate("");
          setStatus("곡을 저장 목록에 추가했습니다.");
          input.current?.focus();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          pending.current = false;
          setBusy(false);
        }
      }}
    >
      <header>
        <strong>곡 추가</strong>
        <p>
          개별 YouTube 영상 URL을 붙여넣으세요. 곡 이름은 직접 입력할 수
          있습니다.
        </p>
      </header>
      <div className={styles.addFields}>
        <label>
          추가할 영상 URL
          <input
            ref={input}
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={busy}
            required
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setDuplicate("");
              setError("");
            }}
          />
        </label>
        <label>
          곡 이름 (선택)
          <input
            maxLength={120}
            placeholder="나만의 곡 이름"
            disabled={busy}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? "추가 중…" : duplicate ? "중복해서 추가" : "곡 추가"}
        </button>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <span className="sr-only" role="status">
        {status}
      </span>
    </form>
  );
}
