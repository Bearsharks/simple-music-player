import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Dialog.module.scss";

const focusableSelector =
  "button, input, select, textarea, a[href], iframe, [tabindex]";
const openDialogs: {
  root: HTMLDialogElement;
  layer: HTMLElement;
  priority: number;
}[] = [];
const originalInert = new Map<HTMLElement, boolean>();
let originalOverflow = "";
function syncModalEnvironment() {
  const top = openDialogs.at(-1);
  if (!top) {
    originalInert.forEach((inert, element) => {
      if (!inert) element.removeAttribute("inert");
    });
    originalInert.clear();
    document.body.style.overflow = originalOverflow;
    return;
  }
  for (const element of Array.from(document.body.children) as HTMLElement[]) {
    if (!originalInert.has(element))
      originalInert.set(element, element.hasAttribute("inert"));
    if (element === top.layer) element.removeAttribute("inert");
    else element.setAttribute("inert", "");
  }
  document.body.style.overflow = "hidden";
}
function focusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => {
    if (
      element.tabIndex < 0 ||
      element.matches(':disabled, input[type="hidden"]') ||
      element.closest('[hidden], [inert], [aria-hidden="true"]')
    )
      return false;
    for (
      let ancestor: HTMLElement | null = element;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const style = window.getComputedStyle(ancestor);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.visibility === "collapse"
      )
        return false;
      if (ancestor === root) break;
    }
    return true;
  });
}

/** Persistent native dialog: changing modal mode never reparents its media/content. */
export default function Dialog({
  label,
  onClose,
  children,
  open = true,
  modal = true,
  className = "",
  priority = 10,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  open?: boolean;
  modal?: boolean;
  className?: string;
  priority?: number;
}) {
  const [layer] = useState(() => document.createElement("div"));
  const content = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const requestClose = () => {
    if (!content.current?.querySelector('[aria-busy="true"]')) close.current();
  };
  const dismiss = useRef(requestClose);
  dismiss.current = requestClose;
  useLayoutEffect(() => {
    layer.dataset.dialogLayer = "";
    document.body.append(layer);
    if (openDialogs.length) syncModalEnvironment();
    return () => layer.remove();
  }, [layer]);
  useLayoutEffect(() => {
    const root = content.current!;
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    // show()/showModal() can switch without removing the iframe host.
    const native = typeof root.showModal === "function";
    if (native) {
      if (root.open) root.close();
      modal ? root.showModal() : root.show();
    } else root.setAttribute("open", "");
    if (!modal) {
      previousFocus?.focus();
      return () => {
        if (native) root.close();
        else root.removeAttribute("open");
      };
    }
    if (!openDialogs.length) originalOverflow = document.body.style.overflow;
    const scope = { root, layer, priority };
    openDialogs.push(scope);
    openDialogs.sort((a, b) => a.priority - b.priority);
    syncModalEnvironment();
    // A responsive panel sits below an already-open task dialog in the native top layer.
    const top = openDialogs.at(-1)!;
    if (native && top.root !== root) {
      top.root.close();
      top.root.showModal();
    }
    const focusFirst = () => (focusableElements(root)[0] ?? root).focus();
    if (top.root === root) focusFirst();
    else previousFocus?.focus();
    const observer = new MutationObserver(() => {
      if (openDialogs.at(-1)?.root === root && document.activeElement === root)
        focusFirst();
    });
    observer.observe(root, { childList: true, subtree: true });
    const isTop = () => openDialogs.at(-1)?.root === root;
    const keydown = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === "Escape") {
        if ((event.target as HTMLElement)?.closest("[data-dialog-popover]"))
          return;
        event.preventDefault();
        event.stopPropagation();
        dismiss.current();
      } else if (event.key === "Tab") {
        const elements = focusableElements(root);
        const first = elements[0];
        const last = elements.at(-1);
        if (!first) {
          event.preventDefault();
          root.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !root.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !root.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const focusin = (event: FocusEvent) => {
      if (isTop() && !root.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", focusin);
      const index = openDialogs.indexOf(scope);
      if (index >= 0) openDialogs.splice(index, 1);
      syncModalEnvironment();
      if (native) root.close();
      else root.removeAttribute("open");
      if (previousFocus?.isConnected && !previousFocus.closest("[inert]"))
        previousFocus.focus();
    };
  }, [layer, open, modal, priority]);
  useLayoutEffect(() => {
    const root = content.current;
    if (root && open && modal && openDialogs.at(-1)?.root === root)
      (focusableElements(root)[0] ?? root).focus();
  }, [label, open, modal]);
  return createPortal(
    <div
      className={modal && open ? styles.backdrop : undefined}
      hidden={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget && modal) requestClose();
      }}
    >
      <dialog
        className={`${styles.content} ${className}`}
        ref={content}
        role={modal ? "dialog" : "complementary"}
        aria-modal={modal ? true : undefined}
        aria-label={label}
        tabIndex={-1}
        onCancel={(event) => {
          event.preventDefault();
          requestClose();
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget || !modal) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            requestClose();
        }}
      >
        {children}
      </dialog>
    </div>,
    layer,
  );
}
