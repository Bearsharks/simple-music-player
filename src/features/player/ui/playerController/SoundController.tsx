import { useAtomValue } from "jotai";
import { ytPlayerInitedState } from "../../model/ytplayerStates";
import Icon from "shared/ui/Icon";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "shared/ui/shadcn/popover";
import "./SoundController.scss";

type VolumePlayer = {
  getVolume: () => number;
  isMuted: () => boolean;
  setVolume: (value: number) => void;
  unMute: () => void;
};
const currentPlayer = () =>
  (window as Window & { player?: VolumePlayer }).player;
export default function SoundController() {
  const ready = useAtomValue(ytPlayerInitedState);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<HTMLDialogElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const hovered = useRef({ trigger: false, content: false });
  const dragging = useRef(false);
  const restoringFocus = useRef(false);
  const focusRange = useRef(false);
  const escapeClose = useRef(false);
  const pressedOpen = useRef<boolean | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const clearClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  };
  const sync = () => {
    const player = currentPlayer();
    if (!ready || !player?.getVolume || !player?.isMuted) return;
    setVolume(player.getVolume());
    setMuted(player.isMuted());
  };
  const changeOpen = (next: boolean) => {
    clearClose();
    const allowed = next && ready;
    if (allowed && !openRef.current) {
      setScope(
        trigger.current?.closest<HTMLDialogElement>("dialog[open]") ?? null,
      );
      sync();
    }
    if (!allowed) {
      hovered.current.content = false;
      dragging.current = false;
      focusRange.current = false;
    }
    openRef.current = allowed;
    setOpen(allowed);
  };
  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => {
      const active = document.activeElement;
      if (
        !hovered.current.trigger &&
        !hovered.current.content &&
        !dragging.current &&
        active !== trigger.current &&
        !content.current?.contains(active)
      )
        changeOpen(false);
    }, 150);
  };
  useEffect(() => {
    if (!ready) {
      changeOpen(false);
      return;
    }
    sync();
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [ready]);
  useEffect(() => {
    const release = () => {
      if (dragging.current) {
        dragging.current = false;
        scheduleClose();
      }
    };
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    return () => {
      clearClose();
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
    };
  }, []);
  return (
    <Popover modal={false} open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          ref={trigger}
          className="icon-button volume-trigger"
          disabled={!ready}
          aria-label="음량 조절"
          data-dialog-popover={open || undefined}
          onPointerEnter={(event) => {
            if (
              event.pointerType !== "mouse" ||
              !window.matchMedia?.("(hover: hover)").matches
            )
              return;
            hovered.current.trigger = true;
            changeOpen(true);
          }}
          onPointerLeave={() => {
            hovered.current.trigger = false;
            scheduleClose();
          }}
          onPointerDown={() => {
            pressedOpen.current = openRef.current;
          }}
          onFocus={() => {
            if (!restoringFocus.current) changeOpen(true);
          }}
          onBlur={scheduleClose}
          onClick={(event) => {
            event.preventDefault();
            // Pointer focus opens before click. Toggle from pointerdown state so
            // the first touch still opens; keyboard activation uses current state.
            const wasOpen =
              event.detail === 0
                ? openRef.current
                : (pressedOpen.current ?? openRef.current);
            pressedOpen.current = null;
            changeOpen(!wasOpen);
          }}
          onKeyDown={(event) => {
            if (
              ["ArrowUp", "ArrowDown"].includes(event.key) ||
              (event.key === "Tab" && !event.shiftKey && openRef.current)
            ) {
              event.preventDefault();
              focusRange.current = !range.current;
              changeOpen(true);
              range.current?.focus();
            }
          }}
        >
          <Icon name={muted || volume === 0 ? "mute" : "volume"} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={content}
        className="volume-popover"
        side="top"
        align="center"
        sideOffset={6}
        portalContainer={scope}
        collisionBoundary={scope ?? undefined}
        collisionPadding={8}
        aria-label="음량 조절"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (focusRange.current) range.current?.focus();
          focusRange.current = false;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (escapeClose.current) {
            escapeClose.current = false;
            restoringFocus.current = true;
            trigger.current?.focus();
            restoringFocus.current = false;
          }
        }}
        onEscapeKeyDown={() => {
          escapeClose.current = true;
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            hovered.current.content = true;
            clearClose();
          }
        }}
        onPointerLeave={() => {
          hovered.current.content = false;
          scheduleClose();
        }}
        onFocusCapture={clearClose}
        onBlurCapture={scheduleClose}
      >
        <input
          ref={range}
          disabled={!ready}
          aria-label="음량"
          aria-orientation="vertical"
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          style={{ "--volume": `${muted ? 0 : volume}%` } as CSSProperties}
          onPointerDown={() => {
            dragging.current = true;
            clearClose();
          }}
          onChange={(event) => {
            const player = currentPlayer();
            if (!ready || !player?.setVolume) return;
            player.setVolume(Number(event.target.value));
            player.unMute();
            sync();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
