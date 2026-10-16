import { useRef, useState } from "react";
import { exportPlaylists, importPlaylists } from "shared/api/localAPI";
import { useReloadPlaylists } from "../model/playlistAtoms";
import { parseBackup } from "../model/backup";
import Dialog from "shared/ui/Dialog";
import ErrorToast from "shared/ui/ErrorToast";
import Icon from "shared/ui/Icon";
import { Button } from "shared/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "shared/ui/shadcn/dropdown-menu";
import type { Playlist } from "shared/model/constants";
export default function LibraryBackup() {
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const writing = useRef(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Playlist[] | null>(null);
  const reload = useReloadPlaylists();
  const download = async () => {
    if (writing.current) return;
    writing.current = true;
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
      try {
        a.click();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next) => {
          if (!writing.current) setOpen(next);
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            ref={trigger}
            variant="secondary"
            size="icon"
            aria-label="라이브러리 더보기"
            disabled={busy && !pending}
          >
            <Icon name="more" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          collisionPadding={8}
          aria-label="라이브러리 작업"
          aria-busy={busy}
          onEscapeKeyDown={(event) => {
            if (writing.current) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (
              writing.current ||
              (event.target as Element)?.closest?.(
                '[data-overlay-notice="error"]',
              )
            )
              event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            if (document.activeElement?.closest("dialog[open]"))
              event.preventDefault();
          }}
        >
          <DropdownMenuItem
            disabled={busy}
            onSelect={(event) => {
              event.preventDefault();
              void download();
            }}
          >
            목록 내보내기
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy}
            onSelect={() => {
              input.current?.click();
            }}
          >
            백업 가져오기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Stable owner: the native chooser may return after the menu unmounts. */}
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        aria-label="재생목록 백업 파일"
        hidden
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file || writing.current) return;
          try {
            if (file.size > 10_000_000)
              throw new Error("백업 파일은 10MB 이하여야 합니다.");
            const lists = parseBackup(await file.text());
            trigger.current?.focus();
            setPending(lists);
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
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              취소
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (writing.current) return;
                writing.current = true;
                setBusy(true);
                setError("");
                try {
                  await importPlaylists(pending);
                  reload();
                  setPending(null);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  writing.current = false;
                  setBusy(false);
                }
              }}
            >
              {busy ? "가져오는 중…" : "가져오기"}
            </Button>
          </section>
        </Dialog>
      )}
      <ErrorToast message={error} />
    </>
  );
}
