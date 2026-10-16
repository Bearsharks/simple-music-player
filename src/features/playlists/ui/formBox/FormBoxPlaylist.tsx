import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { PlaylistInfo } from "shared/model/constants";
import { Button } from "shared/ui/shadcn/button";
import { Input } from "shared/ui/shadcn/input";
import { Textarea } from "shared/ui/shadcn/textarea";
import { Label } from "shared/ui/shadcn/label";
import ErrorToast from "shared/ui/ErrorToast";
import Icon from "shared/ui/Icon";
import PlaylistItem from "features/playlists/ui/PlaylistItem";
import styles from "./FormBoxPlaylist.module.scss";

const NEW_PLAYLIST = "newPlaylist";
type Draft = {
  name: string;
  description: string;
  originalName: string;
  originalDescription: string;
};
const newDraft = (): Draft => ({
  name: "새 재생목록",
  description: "",
  originalName: "새 재생목록",
  originalDescription: "",
});
export type PlaylistDestination = {
  id: string | null;
  name: string;
  description: string;
  changes: { name?: string; description?: string };
};
export interface FormBoxPlaylistProps {
  name: string;
  closePopup: () => void;
  playlistInfos: PlaylistInfo[];
  trackCount: number;
  submit: (destination: PlaylistDestination) => Promise<void>;
}
export default function FormBoxPlaylist({
  name,
  closePopup,
  submit,
  playlistInfos,
  trackCount,
}: FormBoxPlaylistProps) {
  const [selected, setSelected] = useState(
    playlistInfos.length ? "" : NEW_PLAYLIST,
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>({
    [NEW_PLAYLIST]: newDraft(),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectionStatus, setSelectionStatus] = useState("");
  const [focusRequest, setFocusRequest] = useState(
    playlistInfos.length ? 0 : 1,
  );
  const pending = useRef(false);
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const prefix = useId();
  const draft = drafts[selected];
  const isNew = selected === NEW_PLAYLIST;
  const missing = Boolean(
    selected && !isNew && !playlistInfos.some((info) => info.id === selected),
  );
  const nameLimit = Math.max(120, draft?.originalName.length ?? 0);
  const descriptionLimit = Math.max(
    1000,
    draft?.originalDescription.length ?? 0,
  );
  const valid = Boolean(
    draft?.name.trim() &&
      draft.name.length <= nameLimit &&
      draft.description.length <= descriptionLimit &&
      !missing,
  );

  useLayoutEffect(() => {
    if (focusRequest && input.current) {
      input.current.focus();
      input.current.select();
    }
  }, [focusRequest]);
  const choose = (id: string) => {
    if (pending.current) return;
    const info = playlistInfos.find((item) => item.id === id);
    setDrafts((previous) =>
      previous[id]
        ? previous
        : {
            ...previous,
            [id]: info
              ? {
                  name: info.name,
                  description: info.description,
                  originalName: info.name,
                  originalDescription: info.description,
                }
              : newDraft(),
          },
    );
    setSelected(id);
    setError("");
    setSelectionStatus(
      `${id === NEW_PLAYLIST ? "새 재생목록" : info?.name} 선택`,
    );
    if (id === NEW_PLAYLIST) setFocusRequest((value) => value + 1);
  };
  const edit = (field: "name" | "description", value: string) => {
    setDrafts((previous) => ({
      ...previous,
      [selected]: { ...previous[selected], [field]: value },
    }));
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current || composing.current) return;
    if (!valid || !draft) {
      input.current?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const trimmed = draft.name.trim();
      await submit({
        id: isNew ? null : selected,
        name: trimmed,
        description: draft.description,
        changes: {
          ...(trimmed !== draft.originalName ? { name: trimmed } : {}),
          ...(draft.description !== draft.originalDescription
            ? { description: draft.description }
            : {}),
        },
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "저장하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <form
      className={styles.wrapper}
      onSubmit={save}
      aria-busy={busy}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.nativeEvent.isComposing)
          event.preventDefault();
      }}
    >
      <h2>{name}</h2>
      <p className={styles.count}>{trackCount}곡을 담을 목록</p>
      <fieldset disabled={busy}>
        <div className={styles.grid} role="group" aria-label="대상 재생목록">
          <button
            type="button"
            className={styles.card}
            aria-pressed={isNew}
            aria-label="새 재생목록 만들기"
            onClick={() => choose(NEW_PLAYLIST)}
          >
            <span className={styles.newCover}>
              <Icon name="plus" />
            </span>
            <span>새 재생목록 만들기</span>
            {isNew && (
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
            )}
          </button>
          {playlistInfos.map((info) => (
            <button
              type="button"
              key={info.id}
              className={styles.card}
              aria-pressed={info.id === selected}
              aria-label={`${info.name} 선택`}
              onClick={() => choose(info.id)}
            >
              <PlaylistItem info={info} onClick={() => {}} />
              {info.id === selected && (
                <span className={styles.check} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="sr-only" role="status">
          {selectionStatus}
        </span>
        {draft ? (
          <div className={styles.editor}>
            <h3>{isNew ? "새 재생목록" : "선택한 목록 수정"}</h3>
            <div className={styles.field}>
              <Label htmlFor={`${prefix}-name`}>이름</Label>
              <Input
                ref={input}
                id={`${prefix}-name`}
                value={draft.name}
                maxLength={nameLimit}
                required
                aria-invalid={!draft.name.trim() || undefined}
                aria-describedby={
                  !draft.name.trim() ? `${prefix}-validation` : undefined
                }
                onCompositionStart={() => {
                  composing.current = true;
                }}
                onCompositionEnd={() => {
                  composing.current = false;
                }}
                onChange={(event) => edit("name", event.target.value)}
              />
              {!draft.name.trim() && (
                <span id={`${prefix}-validation`} className={styles.validation}>
                  이름을 입력해 주세요.
                </span>
              )}
            </div>
            <div className={styles.field}>
              <Label htmlFor={`${prefix}-description`}>설명 (선택)</Label>
              <Textarea
                id={`${prefix}-description`}
                rows={3}
                value={draft.description}
                maxLength={descriptionLimit}
                onChange={(event) => edit("description", event.target.value)}
              />
            </div>
          </div>
        ) : null}
        {missing && (
          <p className={styles.validation}>
            목록을 찾을 수 없습니다. 다른 목록을 선택해 주세요.
          </p>
        )}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={closePopup}>
            취소
          </Button>
          <Button type="submit" disabled={!valid || busy}>
            {busy ? "저장 중…" : isNew ? "만들고 추가" : "수정하고 추가"}
          </Button>
        </div>
      </fieldset>
      <ErrorToast message={error} />
    </form>
  );
}
