import { useNotice } from "features/overlays/Notice";
import Icon from "shared/ui/Icon";
import ErrorToast from "shared/ui/ErrorToast";
import FieldError from "shared/ui/FieldError";
import { fetchVideoTitles } from "../api/videoMetadata";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { usePlaylistManager } from "features/playlists/model/playlistAtoms";
import {
  PlaylistActionType,
  type MusicInfo,
  type PlaylistInfo,
} from "shared/model/constants";
import { Button } from "shared/ui/shadcn/button";
import { Input } from "shared/ui/shadcn/input";
import { Textarea } from "shared/ui/shadcn/textarea";
import { Label } from "shared/ui/shadcn/label";
import { usePlaylistPreview } from "./usePlaylistPreview";
import "./PlaylistImport.scss";

type DraftField = { value: string; owner: "empty" | "auto" | "user" };
type Draft = { name: DraftField; description: DraftField };
const emptyField = (): DraftField => ({ value: "", owner: "empty" });
export default function PlaylistImport({
  close,
  original,
  initialItems = [],
  onCreated,
}: {
  close: () => void;
  original?: PlaylistInfo;
  initialItems?: MusicInfo[];
  onCreated?: (id: string, context: "empty" | "import" | "selection") => void;
}) {
  const [url, setUrl] = useState(original?.sourcePlaylistUrl ?? "");
  const currentUrl = useRef(url);
  const [draft, setDraft] = useState<Draft>(() => ({
    name: emptyField(),
    description: emptyField(),
  }));
  const userIntent = useRef({ name: false, description: false });
  const committedDraft = useRef(draft);
  const preview = usePlaylistPreview(original?.sourcePlaylistUrl, !original);
  const [error, setError] = useState("");
  const [saveFailure, setSaveFailure] = useState(0);
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const pointerReady = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const descriptionInput = useRef<HTMLTextAreaElement>(null);
  const fieldID = useId();
  const errorID = `${fieldID}-error`;
  const nameErrorID = `${fieldID}-name-error`;
  const urlErrorID = `${fieldID}-url-error`;
  const manager = usePlaylistManager();
  const notice = useNotice();
  const hasUrl = Boolean(url.trim());
  const canSave =
    !busy &&
    (original
      ? preview.status === "ready"
      : Boolean(draft.name.value.trim()) &&
        (!hasUrl || preview.status === "ready"));

  useEffect(() => {
    const candidate = preview.getReady();
    // A previously queued effect must not apply metadata after URL invalidation.
    if (
      !candidate?.metadata ||
      candidate.metadata !== preview.metadata ||
      original
    )
      return;
    const metadata = candidate.metadata;
    setDraft((previous) => {
      const next = { ...previous };
      for (const field of ["name", "description"] as const) {
        const value = metadata[field];
        if (
          value &&
          !userIntent.current[field] &&
          previous[field].owner === "empty" &&
          !previous[field].value.trim()
        )
          next[field] = { value, owner: "auto" };
      }
      return next;
    });
  }, [preview.metadata, preview.status, original]);

  useLayoutEffect(() => {
    // URL → Tab → wait still shows a real title. If it arrives between focus /
    // selection and the first input, select only this newly inserted auto value
    // in the same commit so typing replaces it rather than appending to it.
    for (const field of ["name", "description"] as const) {
      const input =
        field === "name" ? nameInput.current : descriptionInput.current;
      if (
        draft[field].owner === "auto" &&
        committedDraft.current[field].value !== draft[field].value &&
        !userIntent.current[field] &&
        document.activeElement === input
      )
        input?.select();
    }
    committedDraft.current = draft;
  }, [draft]);

  useEffect(() => {
    if (draft.name.value.trim()) setNameError("");
  }, [draft.name.value]);

  const failureToReveal = nameError ? "" : error || preview.error;
  useEffect(() => {
    if (!failureToReveal) return;
    // This form can be taller than a phone viewport. Keep the toast in the
    // modal's normal flow, but reveal a new failure without stealing focus
    // or removing an existing notice/Undo. Wait for the stable portal to attach.
    const frame = requestAnimationFrame(() => {
      const toast = document
        .getElementById(errorID)
        ?.closest<HTMLElement>('[data-overlay-notice="error"]');
      if (
        toast?.closest('dialog[open][aria-modal="true"]') &&
        !toast.closest("[inert]")
      )
        toast.scrollIntoView?.({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [failureToReveal, errorID, saveFailure]);

  const claimField = (field: keyof Draft) => {
    // Synchronous guard covers beforeinput / IME / paste before onChange commits.
    userIntent.current[field] = true;
  };
  const editField = (field: keyof Draft, value: string) => {
    claimField(field);
    setDraft((previous) => ({
      ...previous,
      [field]: { value, owner: "user" },
    }));
    if (field === "name") setNameError("");
  };
  const changeUrl = (value: string) => {
    currentUrl.current = value;
    setUrl(value);
    preview.invalidate();
    pointerReady.current = false;
    setError("");
    setDraft((previous) => ({
      name:
        previous.name.owner === "auto" && !userIntent.current.name
          ? emptyField()
          : previous.name,
      description:
        previous.description.owner === "auto" && !userIntent.current.description
          ? emptyField()
          : previous.description,
    }));
  };
  const save = async () => {
    if (pending.current) return;
    if (!original && !draft.name.value.trim()) {
      setNameError("이름을 입력해 주세요.");
      nameInput.current?.focus();
      return;
    }
    const importing = original || Boolean(currentUrl.current.trim());
    const candidate = importing ? preview.getReady() : null;
    if (importing && !candidate) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const titles = candidate ? await fetchVideoTitles(candidate.ids) : {};
      const items = candidate
        ? candidate.ids.map((videoID, index) => ({
            videoID,
            name: titles[videoID]?.name ?? `동영상 ${index + 1} (${videoID})`,
            query: "",
            owner: titles[videoID]?.owner ?? "",
            thumbnail: `https://i.ytimg.com/vi/${videoID}/default.jpg`,
          }))
        : initialItems;
      const result = await manager({
        type: original ? PlaylistActionType.UPDATE : PlaylistActionType.CREATE,
        payload: {
          info: original
            ? { id: original.id }
            : {
                id: "",
                name: draft.name.value.trim(),
                description: draft.description.value.trim(),
                ...(candidate
                  ? {
                      sourcePlaylistUrl: `https://www.youtube.com/playlist?list=${candidate.id}`,
                    }
                  : {}),
              },
          items,
          ...(!original && candidate
            ? {
                initialSnapshot: { version: 1, capturedAt: Date.now(), items },
              }
            : {}),
        },
      });
      close();
      const missing =
        candidate?.ids.filter((videoID) => !titles[videoID]).length ?? 0;
      if (missing)
        notice(
          `${missing}곡의 제목을 가져오지 못했습니다. 목록에서 ‘원래 곡 제목 가져오기’로 다시 시도할 수 있습니다.`,
        );
      else if (original) notice("미리보기의 최신 곡으로 교체했습니다.");
      if (result?.createdId)
        onCreated?.(
          result.createdId,
          candidate ? "import" : initialItems.length ? "selection" : "empty",
        );
    } catch (e) {
      setSaveFailure((previous) => previous + 1);
      setError(
        e instanceof Error
          ? e.message
          : "저장하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const previewStatus = (
    <p role="status" className="import-status">
      {preview.status === "loading" && !busy && (
        <span className="import-loading" aria-hidden="true">
          <Icon name="reset" />
        </span>
      )}
      {busy
        ? original
          ? "저장 중…"
          : "만드는 중…"
        : preview.status === "ready"
          ? `${preview.ids.length}곡`
          : preview.status === "loading"
            ? "불러오는 중…"
            : ""}
    </p>
  );
  return (
    <section className="playlist-import" aria-busy={busy}>
      <h2>{original ? "YouTube 최신 목록 가져오기" : "새 재생목록"}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
      >
        {!original && (
          <fieldset disabled={busy}>
            <div className="import-field">
              <Label htmlFor={`${fieldID}-url`}>
                YouTube 재생목록 URL (선택)
              </Label>
              <Input
                id={`${fieldID}-url`}
                type="url"
                placeholder="https://www.youtube.com/playlist?list=…"
                value={url}
                aria-invalid={preview.invalid || undefined}
                aria-errormessage={preview.invalid ? urlErrorID : undefined}
                aria-describedby={preview.invalid ? urlErrorID : undefined}
                onChange={(event) => changeUrl(event.target.value)}
                onBlur={() => preview.load(currentUrl.current)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (event.nativeEvent.isComposing) return;
                  preview.load(currentUrl.current);
                  if (!currentUrl.current.trim()) nameInput.current?.focus();
                }}
              />
              <FieldError id={urlErrorID} message={preview.invalid ? preview.error : ""}/>
              {previewStatus}
            </div>
            <div className="import-field">
              <Label htmlFor={`${fieldID}-name`}>
                이름{" "}
                <span className="import-required" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                ref={nameInput}
                id={`${fieldID}-name`}
                maxLength={Math.max(120, draft.name.value.length)}
                required
                aria-required="true"
                aria-invalid={Boolean(nameError) || undefined}
                aria-errormessage={nameError ? nameErrorID : undefined}
                aria-describedby={nameError ? nameErrorID : undefined}
                value={draft.name.value}
                onBeforeInput={() => claimField("name")}
                onCompositionStart={() => claimField("name")}
                onPaste={() => claimField("name")}
                onChange={(event) => editField("name", event.target.value)}
                onBlur={() => {
                  if (!draft.name.value.trim())
                    setNameError("이름을 입력해 주세요.");
                }}
                onInvalid={(event) => {
                  event.preventDefault();
                  setNameError("이름을 입력해 주세요.");
                  nameInput.current?.focus();
                }}
              />
              <FieldError id={nameErrorID} message={nameError}/>
            </div>
            <div className="import-field">
              <Label htmlFor={`${fieldID}-description`}>설명</Label>
              <Textarea
                ref={descriptionInput}
                id={`${fieldID}-description`}
                rows={3}
                maxLength={Math.max(1000, draft.description.value.length)}
                value={draft.description.value}
                onBeforeInput={() => claimField("description")}
                onCompositionStart={() => claimField("description")}
                onPaste={() => claimField("description")}
                onChange={(event) =>
                  editField("description", event.target.value)
                }
              />
            </div>
          </fieldset>
        )}
        <div
          ref={preview.host}
          className="import-preview"
          hidden={!preview.id}
        />
        {original && previewStatus}
        <ErrorToast
          key={saveFailure}
          message={
            error || (original || !preview.invalid ? preview.error : "")
          }
          alertId={errorID}
        />
        {original && preview.status === "ready" && (
          <p className="replacement-warning">
            추가·삭제·정렬한 곡 구성을 미리보기의 {preview.ids.length}곡으로
            교체합니다. 목록 이름·설명과 현재 대기열은 유지됩니다.
          </p>
        )}
        {preview.status === "error" && preview.id && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => preview.load(currentUrl.current, true)}
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
            variant={original ? "destructive" : "default"}
            disabled={!canSave}
            onPointerDown={() => {
              pointerReady.current = canSave;
            }}
            onClick={(event) => {
              // The blur that starts a preview never doubles as an implicit save.
              if (event.detail > 0 && !pointerReady.current)
                event.preventDefault();
            }}
          >
            {busy
              ? original
                ? "저장 중…"
                : "만드는 중…"
              : original
                ? "최신 목록으로 교체"
                : "만들기"}
          </Button>
        </div>
      </form>
    </section>
  );
}
