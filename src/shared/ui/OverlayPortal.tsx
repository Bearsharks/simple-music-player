import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
/** Keep actionable notices in the current modal's accessible top-layer scope. */
export default function OverlayPortal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<Element>(document.body);
  useLayoutEffect(() => {
    const update = () => {
      const dialogs = document.querySelectorAll(
        'dialog[open][aria-modal="true"]',
      );
      setHost(dialogs[dialogs.length - 1] ?? document.body);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open", "aria-modal"],
    });
    return () => observer.disconnect();
  }, []);
  return createPortal(children, host);
}
