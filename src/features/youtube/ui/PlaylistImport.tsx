import { useNotice } from "features/overlays/Notice";
import Icon from "shared/ui/Icon";
import ErrorToast from "shared/ui/ErrorToast";
import { fetchVideoTitles } from "../api/videoMetadata";
import { useId, useRef, useState } from "react";
import { usePlaylistManager } from "features/playlists/model/playlistAtoms";
import { PlaylistActionType, type PlaylistInfo } from "shared/model/constants";
import Dialog from "shared/ui/Dialog";
import { Button } from "shared/ui/shadcn/button";
import { Input } from "shared/ui/shadcn/input";
import { Label } from "shared/ui/shadcn/label";
import { usePlaylistPreview } from "./usePlaylistPreview";
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
  const preview = usePlaylistPreview(original?.sourcePlaylistUrl);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const pending = useRef(false);
  const pointerReady = useRef(false);
  const fieldID = useId();
  const errorID = `${fieldID}-error`;
  const manager = usePlaylistManager();
  const notice = useNotice();
  const save = async () => {
    const candidate = preview.getReady();
    if (pending.current || !candidate) return;
    const { id, ids } = candidate;
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
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!preview.getReady()) return;
          original ? setConfirmReset(true) : void save();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
      >
        <fieldset disabled={busy}>
          <div className="import-field">
            <Label htmlFor={`${fieldID}-url`}>공개 재생목록 URL</Label>
            <Input
              id={`${fieldID}-url`}
              type="url"
              placeholder="https://www.youtube.com/playlist?list=…"
              required
              readOnly={!!original}
              value={url}
              aria-invalid={preview.invalid || undefined}
              aria-errormessage={preview.invalid ? errorID : undefined}
              onChange={(event) => {
                setUrl(event.target.value);
                preview.invalidate();
                pointerReady.current = false;
                setError("");
              }}
              onBlur={() => preview.load(url)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (!event.nativeEvent.isComposing) preview.load(url);
              }}
            />
          </div>
          <div className="import-field">
            <Label htmlFor={`${fieldID}-name`}>목록 이름</Label>
            <Input
              id={`${fieldID}-name`}
              maxLength={Math.max(120, original?.name.length ?? 0)}
              placeholder="나만의 재생목록"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </fieldset>
        <div
          ref={preview.host}
          className="import-preview"
          hidden={!preview.id}
        />
        <p role="status" className="import-status">
          {preview.status === "loading" && !busy && (
            <span className="import-loading" aria-hidden="true">
              <Icon name="reset" />
            </span>
          )}
          {busy
            ? "제목을 불러와 저장 중…"
            : preview.status === "ready"
              ? `${preview.ids.length}곡`
              : preview.status === "loading"
                ? "재생목록을 불러오는 중…"
                : ""}
        </p>
        {!confirmReset && (
          <ErrorToast message={error || preview.error} alertId={errorID} />
        )}
        {preview.status === "error" && preview.id && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => preview.load(url, true)}
          >
            다시 시도
          </Button>
        )}
        <div className="import-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={close}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={preview.status !== "ready" || busy}
            onPointerDown={() => {
              pointerReady.current = Boolean(preview.getReady());
            }}
            onClick={(event) => {
              // A blur which starts a load must never turn the same pointer
              // gesture into an implicit save, even for an immediate onReady.
              if (event.detail > 0 && !pointerReady.current)
                event.preventDefault();
            }}
          >
            {busy ? "저장 중…" : original ? "원본으로 교체" : "재생목록 추가"}
          </Button>
        </div>
      </form>
      {confirmReset && (
        <Dialog label="원본 교체 확인" onClose={() => setConfirmReset(false)}>
          <section className="playlist-import" aria-busy={busy}>
            <h2>원본 목록으로 교체할까요?</h2>
            <p>
              “{original?.name}”의 로컬 추가·삭제·정렬 내용을 지우고 미리보기의{" "}
              {preview.ids.length}곡으로 교체합니다. 현재 대기열은 유지됩니다.
            </p>
            <ErrorToast message={error} />
            <div className="import-actions">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirmReset(false)}
              >
                취소
              </Button>
              <Button variant="destructive" disabled={busy} onClick={save}>
                {busy ? "저장 중…" : "교체"}
              </Button>
            </div>
          </section>
        </Dialog>
      )}
    </section>
  );
}
