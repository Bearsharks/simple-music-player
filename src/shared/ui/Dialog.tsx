import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.scss';

const focusableSelector = 'button, input, select, textarea, a[href], iframe, [tabindex]';
const openDialogs: HTMLElement[] = [];
function focusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(element => {
    if (element.tabIndex < 0 || element.matches(':disabled, input[type="hidden"]') ||
        element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = window.getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (ancestor === root) break;
    }
    return true;
  });
}

/** A modal focus scope shared by forms and destructive-action confirmations. */
export default function Dialog({ label, onClose, children }: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [layer] = useState(() => document.createElement('div'));
  const content = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const requestClose = () => {
    // A committed write cannot be cancelled. Keep its outcome/error visible.
    if (!content.current?.querySelector('[aria-busy="true"]')) close.current();
  };
  const dismiss = useRef(requestClose);
  dismiss.current = requestClose;

  useLayoutEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    layer.dataset.dialogLayer = '';
    document.body.append(layer);
    const root = content.current!;
    openDialogs.push(root);
    const siblings = Array.from(document.body.children).filter(element => element !== layer) as HTMLElement[];
    const previousInert = siblings.map(element => element.hasAttribute('inert'));
    siblings.forEach(element => element.setAttribute('inert', ''));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFirst = () => (focusableElements(root)[0] ?? root).focus();
    focusFirst();
    const observer = new MutationObserver(() => {
      if (document.activeElement === root) focusFirst();
    });
    observer.observe(root, { childList: true, subtree: true });
    const isTop = () => openDialogs.at(-1) === root;
    const keydown = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dismiss.current();
      } else if (event.key === 'Tab') {
        const elements = focusableElements(root);
        const first = elements[0];
        const last = elements.at(-1);
        if (!first) { event.preventDefault(); root.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    };
    const focusin = (event: FocusEvent) => {
      if (isTop() && !root.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('focusin', focusin);
    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('focusin', focusin);
      openDialogs.splice(openDialogs.indexOf(root), 1);
      siblings.forEach((element, index) => { if (!previousInert[index]) element.removeAttribute('inert'); });
      document.body.style.overflow = previousOverflow;
      layer.remove();
      if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus();
    };
  }, [layer]);

  useLayoutEffect(() => {
    const root = content.current;
    if (root) (focusableElements(root)[0] ?? root).focus();
  }, [label]);

  return createPortal(
    <div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) requestClose(); }}>
      <div className={styles.content} ref={content} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>, layer,
  );
}
