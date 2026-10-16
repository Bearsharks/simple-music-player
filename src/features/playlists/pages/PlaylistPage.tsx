import { Button } from "shared/ui/shadcn/button";
import AddVideo from "../ui/AddVideo";
import RestoreTitles from "../ui/RestoreTitles";
import ErrorToast from "shared/ui/ErrorToast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
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
        <Button
          variant="secondary"
          className="secondary-button"
          onClick={() => navigate("/")}
        >
          라이브러리로 돌아가기
        </Button>
      </section>
    );
  return <PlaylistDetail key={id} playlistID={id} />;
}
function PlaylistDetail({ playlistID }: { playlistID: string }) {
  const info = useAtomValue(playlistInfoStateFamily(playlistID));
  const location = useLocation();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(Boolean(location.state?.focusAdd));
  const addTrigger = useRef<HTMLButtonElement>(null);
  const closeAdd = () => {
    setAddOpen(false);
    requestAnimationFrame(() => addTrigger.current?.focus());
  };
  useEffect(() => {
    if (location.state?.focusAdd)
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, focusAdd: false },
      });
  }, [location.state, location.pathname, navigate]);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const playList = useMusicListManager();
  const reveal = useSetAtom(revealQueueOnFirstPlay);
  const options = useOpenPlaylistOptionsPopup();
  useEffect(() => {
    if (!location.state?.focusAdd && !addOpen) heading.current?.focus();
  }, [location.state]);
  return (
    <div className={styles.container} data-track-scope>
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
          <Button
            variant="default"
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
          </Button>
          <Button
            variant="secondary"
            className="secondary-button"
            aria-expanded={addOpen}
            ref={addTrigger}
            aria-haspopup="dialog"
            data-empty-track-focus
            aria-label="곡 추가"
            onClick={() => setAddOpen(true)}
          >
            <Icon name="plus" />
            <span>곡 추가</span>
          </Button>
        </div>
        <MoreVert
          onClick={(event) => options(event.currentTarget, playlistID)}
        />
      </div>
      <ErrorToast message={error} />
      {addOpen && (
        <Dialog label="곡 추가" onClose={closeAdd}>
          <Suspense fallback={<Spinner />}>
            <AddVideo playlistID={playlistID} close={closeAdd} />
          </Suspense>
        </Dialog>
      )}
      <Suspense fallback={<Spinner />}>
        <RestoreTitles playlistID={playlistID} />
        <PlaylistItems playlistID={playlistID} />
      </Suspense>
    </div>
  );
}
function PlaylistItems({ playlistID }: { playlistID: string }) {
  const items = useAtomValue(playlistItemStateFamily(playlistID));
  const curMusicManager = useCurMusicManager();
  const reveal = useSetAtom(revealQueueOnFirstPlay);
  const manager = usePlaylistManager();
  const options = useOpenPlaylistItemOptionsPopup();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const focusedHandle = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (busy || !focusedHandle.current) return;
    const handle = focusedHandle.current;
    focusedHandle.current = null;
    if (handle.isConnected && document.activeElement === document.body)
      handle.focus();
  }, [busy]);
  const move = async (from: number, to: number) => {
    if (pending.current || from === to) return;
    pending.current = true;
    focusedHandle.current =
      document.activeElement instanceof HTMLElement &&
      document.activeElement.hasAttribute("data-rfd-drag-handle-draggable-id")
        ? document.activeElement
        : null;
    setBusy(true);
    const item = items[from];
    try {
      await manager({
        type: PlaylistActionType.MOVE_ITEM,
        payload: {
          info: { id: playlistID },
          key: item.key,
          beforeKey: items[to + (from < to ? 1 : 0)]?.key,
        },
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
    <section aria-label="저장한 곡" data-track-list>
      <div className={styles.tableHeading}>
        <span>#</span>
        <span>곡 / 아티스트</span>
        <span>{items.length}곡</span>
      </div>
      {!items.length && (
        <div className={styles.empty}>
          <Icon name="music" />
          <h2>첫 번째 곡을 추가해 보세요.</h2>
        </div>
      )}
      <ErrorToast message={error} />
      <span className="sr-only" role="status">
        {status}
      </span>
      <DragDropContext
        onDragEnd={({ source, destination }) => {
          if (destination) void move(source.index, destination.index);
        }}
      >
        <Droppable droppableId={`saved-${playlistID}`}>
          {(drop) => (
            <div ref={drop.innerRef} {...drop.droppableProps}>
              {items.map((item, idx) => (
                <Draggable
                  disableInteractiveElementBlocking
                  key={item.key}
                  draggableId={item.key}
                  index={idx}
                  isDragDisabled={busy}
                >
                  {(drag) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      data-saved-row
                      className={styles.item}
                    >
                      <button
                        className="icon-button"
                        {...drag.dragHandleProps}
                        aria-label={`${item.name} 순서 드래그`}
                        disabled={busy}
                      >
                        <Icon name="grip" />
                      </button>
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
                    </div>
                  )}
                </Draggable>
              ))}
              {drop.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
}
