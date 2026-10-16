import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./OverlayPortal.module.scss";

/** Keep notices in the active modal scope without remounting their state. */
export default function OverlayPortal({ children }: { children: ReactNode }) {
  const [layer] = useState(() => document.createElement("div"));
  useLayoutEffect(() => {
    layer.className = styles.layer;
    const update = () => {
      const dialogs = [
        ...document.querySelectorAll<HTMLDialogElement>(
          'dialog[open][aria-modal="true"]',
        ),
      ];
      const modal = dialogs
        .reverse()
        .find((dialog) => !dialog.closest("[inert]"));
      const host = modal ?? document.body;
      const focused = layer.contains(document.activeElement)
        ? (document.activeElement as HTMLElement)
        : null;
      layer.dataset.overlayScope = modal ? "modal" : "page";
      // The modal manager may have marked this layer inert while it was a
      // body child. Inside the active dialog it must be actionable again.
      layer.removeAttribute("inert");
      if (layer.parentElement !== host) {
        host.append(layer);
        if (focused?.isConnected && !focused.closest("[inert]"))
          focused.focus();
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open", "aria-modal", "inert"],
    });
    return () => {
      observer.disconnect();
      layer.remove();
    };
  }, [layer]);
  // A stable portal container preserves dismissed, pending and failed Undo
  // state when moving between the page, player sheet and nested task dialogs.
  return createPortal(children, layer);
}
