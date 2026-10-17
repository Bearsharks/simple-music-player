import { Button } from "shared/ui/shadcn/button";
import ErrorToast from "shared/ui/ErrorToast";
import RestoreInitialPlaylist from "features/playlists/ui/RestoreInitialPlaylist";
import PlaylistImport from "features/youtube/ui/PlaylistImport";
import { useAtom, useAtomValue } from "jotai";
import { ModalInfoState, ModalKind, ModalOpenState } from "./PopupStates";
import styles from "./Modal.module.scss";
import { useRef, useState } from "react";
import { PlaylistActionType, PlaylistInfo } from "shared/model/constants";
import Dialog from "shared/ui/Dialog";
import { usePlaylistManager } from "features/playlists/model/playlistAtoms";
import FormBox, { FormItem } from "features/playlists/ui/formBox/FormBox";

export type PlaylistCreationContext = "empty" | "import" | "selection";
type OnCreated = (id: string, context: PlaylistCreationContext) => void;

const labels = {
  [ModalKind.CreatePlaylist]: "새 재생목록",
  [ModalKind.UpdatePlaylist]: "재생목록 수정",
  [ModalKind.DeletePlaylist]: "재생목록 삭제",
  [ModalKind.RestoreInitialPlaylist]: "처음 가져온 목록으로 복원",
  [ModalKind.RefreshYTPlaylist]: "YouTube 최신 목록 가져오기",
};
export default function Modal({ onCreated }: { onCreated?: OnCreated }) {
  const [isOpen, setOpen] = useAtom(ModalOpenState);
  const state = useAtomValue(ModalInfoState);
  if (!isOpen) return null;
  const close = () => setOpen(false);
  return (
    <Dialog label={labels[state.kind]} onClose={close}>
      {state.kind === ModalKind.CreatePlaylist ? (
        <PlaylistImport
          close={close}
          initialItems={state.data}
          onCreated={onCreated}
        />
      ) : state.kind === ModalKind.RefreshYTPlaylist ? (
        <PlaylistImport
          key={state.data.id}
          original={state.data}
          close={close}
        />
      ) : state.kind === ModalKind.RestoreInitialPlaylist ? (
        <RestoreInitialPlaylist
          key={state.data.id}
          playlistID={state.data.id}
          close={close}
        />
      ) : state.kind === ModalKind.DeletePlaylist ? (
        <DeleteConfirmation
          key={state.data.id}
          info={state.data}
          close={close}
        />
      ) : (
        <PlaylistForm
          key={state.data.id}
          closePopup={close}
          playlistInfo={state.data}
        />
      )}
    </Dialog>
  );
}

function PlaylistForm({
  closePopup,
  playlistInfo,
}: {
  closePopup: () => void;
  playlistInfo: PlaylistInfo;
}) {
  const formItems: FormItem[] = [
    { id: "name", name: "제목", value: playlistInfo.name, require: true },
    { id: "description", name: "설명", value: playlistInfo.description },
  ];
  const manager = usePlaylistManager();
  const submit = async (data: Record<string, string>) => {
    await manager({
      type: PlaylistActionType.UPDATE,
      payload: { info: { ...playlistInfo, ...data } },
    });
    closePopup();
  };
  return (
    <FormBox
      name="재생목록 수정"
      formItems={formItems}
      closePopup={closePopup}
      submit={submit}
      submitLabel="변경 저장"
    />
  );
}

function DeleteConfirmation({
  info,
  close,
}: {
  info: PlaylistInfo;
  close: () => void;
}) {
  const manager = usePlaylistManager();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remove = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await manager({ type: PlaylistActionType.DELETE, payload: info.id });
      close();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "삭제하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <section className={styles.confirmation} aria-busy={busy}>
      <h2>재생목록 삭제</h2>
      <p>
        “{info.name}” 재생목록과 저장한 {info.itemCount}곡을 삭제할까요?
      </p>
      <p>
        이 브라우저의 저장 목록에서 삭제되며 되돌릴 수 없습니다. 현재 재생
        대기열과 YouTube 원본은 유지됩니다.
      </p>
      <ErrorToast message={error} />
      <div className={styles.confirmationActions}>
        <Button
          variant="secondary"
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={close}
        >
          취소
        </Button>
        <Button
          variant="destructive"
          type="button"
          className="button danger-button"
          disabled={busy}
          onClick={remove}
        >
          {busy ? "삭제 중…" : "삭제"}
        </Button>
      </div>
    </section>
  );
}
