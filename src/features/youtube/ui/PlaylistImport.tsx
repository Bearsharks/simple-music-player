import { useNotice } from "features/overlays/Notice";
import ErrorToast from "shared/ui/ErrorToast";
import { fetchVideoTitles } from "../api/videoMetadata";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadIframeApi } from "features/player/api/iframe";
import { parsePlaylistUrl } from "features/library/model/library";
import { usePlaylistManager } from "features/playlists/model/playlistAtoms";
import { PlaylistActionType, type PlaylistInfo } from "shared/model/constants";
import Dialog from "shared/ui/Dialog";
import Icon from "shared/ui/Icon";
import "./PlaylistImport.scss";
export default function PlaylistImport({
  close,
  original,
  onCreated,
}: {
  close: () => void;
  original?: PlaylistInfo;
  onCreated?: (id: string) => void;
}) {
  const [url, setUrl] = useState(original?.sourcePlaylistUrl ?? "");
  const [name, setName] = useState(original?.name ?? "");
  const [id, setId] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const pending = useRef(false);
  const host = useRef<HTMLDivElement>(null);
  const manager = usePlaylistManager();
  const notice = useNotice();
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let player: any;
    let poll: ReturnType<typeof setInterval> | undefined;
    const read = () => {
      const values = player?.getPlaylist?.();
      if (!cancelled && Array.isArray(values) && values.length) {
        if (
          !values.every(
            (value: unknown) =>
              typeof value === "string" && /^[\w-]{11}$/.test(value),
          )
        ) {
          setPreviewError("곡 ID 형식을 확인하지 못했습니다.");
          return;
        }
        setIds((previous) =>
          previous.join(",") === values.join(",") ? previous : values,
        );
        setPreviewError("");
        clearTimeout(timeout);
      }
    };
    const timeout = setTimeout(() => {
      if (!cancelled)
        setPreviewError(
          "목록이 표시되지 않으면 미리보기에서 재생을 눌러 주세요. 비공개·임베드 제한 목록은 가져올 수 없습니다.",
        );
    }, 15000);
    loadIframeApi()
      .then((YT) => {
        if (cancelled || !host.current) return;
        const mount = document.createElement("div");
        host.current.replaceChildren(mount);
        player = new YT.Player(mount, {
          width: "100%",
          height: 220,
          playerVars: {
            listType: "playlist",
            list: id,
            playsinline: 1,
            autoplay: 0,
            origin: location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              read();
              poll = setInterval(read, 1000);
            },
            onStateChange: read,
            onError: () => {
              if (!cancelled)
                setPreviewError(
                  "YouTube에서 목록을 재생할 수 없습니다. 공개 여부와 임베드 제한을 확인해 주세요.",
                );
            },
          },
        });
      })
      .catch((e) => {
        if (!cancelled) setPreviewError(e.message);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      clearInterval(poll);
      player?.destroy();
    };
  }, [id, attempt]);
  const preview = (event: FormEvent) => {
    event.preventDefault();
    try {
      const parsed = parsePlaylistUrl(url);
      setIds([]);
      setError("");
      setPreviewError("");
      setId(parsed.id);
      setAttempt((value) => value + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = async () => {
    if (pending.current || !ids.length) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const titles = await fetchVideoTitles(ids);
      const result = await manager({
        type: original ? PlaylistActionType.UPDATE : PlaylistActionType.CREATE,
        payload: {
          info: {
            ...original,
            id: original?.id ?? "",
            sourcePlaylistUrl: `https://www.youtube.com/playlist?list=${id}`,
            name: name.trim() || "YouTube 재생목록",
            description: `원본: https://www.youtube.com/playlist?list=${id}`,
          },
          items: ids.map((videoID, index) => ({
            videoID,
            name: titles[videoID]?.name ?? `동영상 ${index + 1} (${videoID})`,
            query: "",
            owner: titles[videoID]?.owner ?? "",
            thumbnail: `https://i.ytimg.com/vi/${videoID}/default.jpg`,
          })),
        },
      });
      setConfirmReset(false);
      close();
      const missing = ids.filter((videoID) => !titles[videoID]).length;
      if (missing)
        notice(
          `${missing}곡의 제목을 가져오지 못했습니다. 목록에서 ‘원래 곡 제목 가져오기’로 다시 시도할 수 있습니다.`,
        );
      if (result?.createdId) onCreated?.(result.createdId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <section
      className="playlist-import"
      aria-label="재생목록 URL 가져오기"
      aria-busy={busy}
    >
      <h2>{original ? "원본으로 초기화" : "YouTube 재생목록 가져오기"}</h2>
      <ol className="import-steps" aria-label="가져오기 단계">
        <li className={!ids.length ? "active" : ""}>1. URL 확인</li>
        <li className={ids.length ? "active" : ""}>2. 미리보기 · 저장</li>
      </ol>
      <form onSubmit={preview}>
        <fieldset disabled={busy}>
          <label>
            공개 재생목록 URL
            <input
              type="url"
              placeholder="https://www.youtube.com/playlist?list=…"
              required
              readOnly={!!original}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setId("");
                setIds([]);
                setError("");
                setPreviewError("");
              }}
            />
          </label>
          <label>
            목록 이름
            <input
              maxLength={120}
              placeholder="나만의 재생목록"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <button className="secondary-button">
            <Icon name="play" />
            {id ? "다시 미리보기" : "미리보기"}
          </button>
        </fieldset>
      </form>
      <div ref={host} className="import-preview" hidden={!id} />
      <p role="status" className="import-status">
        {ids.length
          ? busy
            ? "제목을 불러와 저장 중…"
            : `${ids.length}곡`
          : id
            ? "목록을 불러오는 중입니다. 미리보기에서 재생을 눌러 확인할 수 있습니다."
            : "목록을 미리보기에서 불러온 뒤 저장하세요."}
      </p>
      <p className="import-disclosure">
        비공개·삭제된 영상은 제목을 가져오지 못할 수 있습니다.
      </p>
      {!confirmReset && <ErrorToast message={error || previewError} />}
      <div className="import-actions">
        <button className="secondary-button" disabled={busy} onClick={close}>
          취소
        </button>
        <button
          className="primary-button"
          disabled={!ids.length || busy}
          onClick={() => (original ? setConfirmReset(true) : void save())}
        >
          {busy ? "저장 중…" : original ? "원본으로 교체" : "로컬에 저장"}
        </button>
      </div>
      {confirmReset && (
        <Dialog label="원본 교체 확인" onClose={() => setConfirmReset(false)}>
          <section className="playlist-import" aria-busy={busy}>
            <h2>원본 목록으로 교체할까요?</h2>
            <p>
              “{original?.name}”의 로컬 추가·삭제·정렬 내용을 지우고 미리보기의{" "}
              {ids.length}곡으로 교체합니다. 현재 대기열은 유지됩니다.
            </p>
            <ErrorToast message={error} />
            <div className="import-actions">
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => setConfirmReset(false)}
              >
                취소
              </button>
              <button
                className="button danger-button"
                disabled={busy}
                onClick={save}
              >
                {busy ? "저장 중…" : "교체"}
              </button>
            </div>
          </section>
        </Dialog>
      )}
    </section>
  );
}
