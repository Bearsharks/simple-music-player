import { useRef, useState } from "react";
import { exportPlaylists, importPlaylists } from "shared/api/localAPI";
import { useReloadPlaylists } from "../model/playlistAtoms";
import { parseBackup } from "../model/backup";
import Dialog from "shared/ui/Dialog";
import ErrorToast from "shared/ui/ErrorToast";
import type { Playlist } from "shared/model/constants";
export default function LibraryBackup() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [pending, setPending] = useState<Playlist[] | null>(null);
  const reload = useReloadPlaylists();
  return (
    <div className="library-backup">
      <button
        className="secondary-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const playlists = await exportPlaylists();
            const url = URL.createObjectURL(
              new Blob(
                [
                  JSON.stringify(
                    { format: "smp-playlists", version: 1, playlists },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              ),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "loopy-playlists.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        목록 내보내기
      </button>
      <button
        className="secondary-button"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        백업 가져오기
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        aria-label="재생목록 백업 파일"
        hidden
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (!file) return;
          try {
            if (file.size > 10_000_000)
              throw new Error("백업 파일은 10MB 이하여야 합니다.");
            setPending(parseBackup(await file.text()));
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      {pending && (
        <Dialog label="백업 가져오기" onClose={() => !busy && setPending(null)}>
          <section className="clear-queue" aria-busy={busy}>
            <h2>{pending.length}개 목록을 가져올까요?</h2>
            <p>기존 목록은 유지하고 새 목록으로 추가합니다.</p>
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              취소
            </button>
            <button
              className="primary-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await importPlaylists(pending);
                  reload();
                  setPending(null);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              가져오기
            </button>
          </section>
        </Dialog>
      )}
      <ErrorToast message={error} />
    </div>
  );
}
