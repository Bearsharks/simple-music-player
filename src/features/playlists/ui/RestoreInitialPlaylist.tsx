import { useEffect, useRef, useState } from "react";
import api from "shared/api/apiSelector";
import {
  PlaylistActionType,
  type InitialPlaylistSnapshot,
} from "shared/model/constants";
import { usePlaylistManager } from "../model/playlistAtoms";
import { useNotice } from "features/overlays/Notice";
import { Button } from "shared/ui/shadcn/button";
import ErrorToast from "shared/ui/ErrorToast";

/** Fetch the immutable tracks only when this explicit restore task is opened. */
export default function RestoreInitialPlaylist({
  playlistID,
  close,
}: {
  playlistID: string;
  close: () => void;
}) {
  const [snapshot, setSnapshot] = useState<InitialPlaylistSnapshot>();
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const manager = usePlaylistManager();
  const notice = useNotice();
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSnapshot(undefined);
    api
      .getInitialSnapshot(playlistID)
      .then((value) => {
        if (cancelled) return;
        if (!value) throw new Error("최초 가져오기 기록을 찾을 수 없습니다.");
        setSnapshot(value);
      })
      .catch((error) => {
        if (!cancelled) setError((error as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playlistID, attempt]);
  return (
    <section className="clear-queue" aria-busy={busy}>
      <h2>
        {snapshot
          ? `처음 가져온 ${snapshot.items.length}곡으로 복원할까요?`
          : "처음 가져온 목록으로 복원"}
      </h2>
      {loading && <p role="status">불러오는 중…</p>}
      {snapshot && (
        <p>
          추가·삭제·정렬한 곡 구성이 바뀝니다. 목록 이름·설명과 현재 대기열은
          유지됩니다.
        </p>
      )}
      <ErrorToast message={error} />
      <div>
        <Button variant="secondary" disabled={busy} onClick={close}>
          취소
        </Button>
        {!loading && !snapshot ? (
          <Button
            variant="secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            다시 시도
          </Button>
        ) : (
          <Button
            variant="destructive"
            disabled={loading || busy || !snapshot}
            onClick={async () => {
              if (pending.current || !snapshot) return;
              pending.current = true;
              setBusy(true);
              setError("");
              try {
                await manager({
                  type: PlaylistActionType.UPDATE,
                  payload: { info: { id: playlistID }, items: snapshot.items },
                });
                close();
                notice("처음 가져온 곡 구성으로 복원했습니다.");
              } catch (error) {
                setError((error as Error).message);
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
          >
            {busy ? "복원 중…" : "복원"}
          </Button>
        )}
      </div>
    </section>
  );
}
