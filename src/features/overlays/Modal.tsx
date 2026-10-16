import ErrorToast from "shared/ui/ErrorToast";
import PlaylistImport from "features/youtube/ui/PlaylistImport";
import { useAtom, useAtomValue } from "jotai";
import {
  ModalInfoState,
  ModalKind,
  ModalOpenState,
  useModalManager,
} from "./PopupStates";
import styles from "./Modal.module.scss";
import { useRef, useState } from "react";
import {
  MusicInfo,
  PlaylistActionType,
  PlaylistInfo,
} from "shared/model/constants";
import Dialog from "shared/ui/Dialog";
import { usePlaylistManager } from "features/playlists/model/playlistAtoms";
import FormBox, { FormItem } from "features/playlists/ui/formBox/FormBox";

export type PlaylistCreationContext = "empty" | "import" | "selection";
type OnCreated = (id: string, context: PlaylistCreationContext) => void;

const labels = {
  [ModalKind.CreatePlaylist]: "새 재생목록",
  [ModalKind.UpdatePlaylist]: "재생목록 수정",
  [ModalKind.ImportYTPlaylistLink]: "재생목록 URL 가져오기",
  [ModalKind.DeletePlaylist]: "재생목록 삭제",
};
export default function Modal({ onCreated }: { onCreated?: OnCreated }) {
  const [isOpen, setOpen] = useAtom(ModalOpenState);
  const state = useAtomValue(ModalInfoState);
  if (!isOpen) return null;
  const close = () => setOpen(false);
  return (
    <Dialog label={labels[state.kind]} onClose={close}>
      {state.kind === ModalKind.ImportYTPlaylistLink ? (
        <PlaylistImport
          close={close}
          onCreated={(id) => onCreated?.(id, "import")}
        />
      ) : state.kind === ModalKind.DeletePlaylist ? (
        <DeleteConfirmation
          key={state.data.id}
          info={state.data}
          close={close}
        />
      ) : (
        <PlaylistForm
          key={`${state.kind}-${state.data?.id ?? ""}`}
          kind={state.kind}
          closePopup={close}
          onCreated={onCreated}
          playlistInfo={
            state.kind === ModalKind.UpdatePlaylist ? state.data : undefined
          }
          musicInfos={
            state.kind === ModalKind.CreatePlaylist ? state.data : undefined
          }
        />
      )}
    </Dialog>
  );
}

function PlaylistForm({
  closePopup,
  kind,
  playlistInfo,
  musicInfos,
  onCreated,
}: {
  onCreated?: OnCreated;
  closePopup: () => void;
  kind: ModalKind;
  playlistInfo?: PlaylistInfo;
  musicInfos?: MusicInfo[];
}) {
  const formItems: FormItem[] = [
    {
      id: "name",
      name: "제목",
      value: playlistInfo?.name ?? "",
      require: true,
    },
    { id: "description", name: "설명", value: playlistInfo?.description ?? "" },
  ];
  const manager = usePlaylistManager();
  const modal = useModalManager();
  const create = kind === ModalKind.CreatePlaylist;
  const submit = async (data: Record<string, string>) => {
    const result = await manager({
      type: create ? PlaylistActionType.CREATE : PlaylistActionType.UPDATE,
      payload: {
        info: { ...playlistInfo, ...data },
        ...(musicInfos ? { items: musicInfos } : {}),
      },
    });
    closePopup();
    if (result?.createdId)
      onCreated?.(result.createdId, musicInfos?.length ? "selection" : "empty");
  };
  return (
    <FormBox
      name={create ? "새 재생목록" : "재생목록 수정"}
      formItems={formItems}
      closePopup={closePopup}
      submit={submit}
      submitLabel={create ? "만들기" : "변경 저장"}
    >
      {create && (
        <button
          type="button"
          className={styles.importYTBtn}
          onClick={() => modal(ModalKind.ImportYTPlaylistLink)}
        >
          <span className="material-icons" aria-hidden="true">
            add
          </span>
          유튜브에서 가져오기
        </button>
      )}
    </FormBox>
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
        <button
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={close}
        >
          취소
        </button>
        <button
          type="button"
          className="button danger-button"
          disabled={busy}
          onClick={remove}
        >
          {busy ? "삭제 중…" : "삭제"}
        </button>
      </div>
    </section>
  );
}
