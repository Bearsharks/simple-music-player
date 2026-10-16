import { Button } from "shared/ui/shadcn/button";
import OverlayPortal from "shared/ui/OverlayPortal";
import { useEffect, useRef, useState } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import styles from "./Notice.module.scss";
interface NoticeAction {
  label: string;
  run: () => Promise<void>;
}
const noticeState = atom<{ id: number; text: string; action?: NoticeAction }>({
  id: 0,
  text: "",
});
export function useNotice() {
  const set = useSetAtom(noticeState);
  return (text: string, action?: NoticeAction) =>
    set((previous) => ({ id: previous.id + 1, text, action }));
}
export default function Notice() {
  const notice = useAtomValue(noticeState);
  return (
    <OverlayPortal>
      <NoticeContent key={notice.id} notice={notice} />
    </OverlayPortal>
  );
}
function NoticeContent({
  notice,
}: {
  notice: { text: string; action?: NoticeAction };
}) {
  const [visible, setVisible] = useState(Boolean(notice.text));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    // Undo stays available until dismissed or replaced by another notice.
    if (notice.action) return;
    const timeout = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timeout);
  }, [notice.action]);
  const run = async () => {
    if (!notice.action || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await notice.action.run();
      setVisible(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "복원하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  if (!visible) return null;
  return (
    <div className={styles.wrapper} aria-busy={busy}>
      <p role="status">{notice.text}</p>
      {notice.action && (
        <Button variant="ghost" type="button" disabled={busy} onClick={run}>
          {busy ? "복원 중…" : notice.action.label}
        </Button>
      )}
      <Button variant="ghost"
        type="button"
        disabled={busy}
        aria-label="알림 닫기"
        onClick={() => setVisible(false)}
      >
        닫기
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
