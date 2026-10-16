import { Button } from "shared/ui/shadcn/button";
import { useEffect, useState } from "react";
import OverlayPortal from "./OverlayPortal";
import "./ErrorToast.scss";
/** Contextual errors live in a toast without replacing the user's form state. */
export default function ErrorToast({
  message,
  alertId,
}: {
  message: string;
  alertId?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => setDismissed(false), [message]);
  if (!message || dismissed) return null;
  return (
    <OverlayPortal>
      <div className="error-toast" data-overlay-notice="error">
        <p role="alert" id={alertId}>
          {message}
        </p>
        <Button
          variant="ghost"
          type="button"
          className="icon-button"
          aria-label="오류 알림 닫기"
          onClick={() => setDismissed(true)}
        >
          ×
        </Button>
      </div>
    </OverlayPortal>
  );
}
