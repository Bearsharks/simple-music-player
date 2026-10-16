import { useAtomValue } from "jotai";
import { ytPlayerInitedState } from "../../model/ytplayerStates";
import Icon from "shared/ui/Icon";
import { useEffect, useRef, useState } from "react";
import { Button } from "shared/ui/shadcn/button";
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
  mute: () => void;
  unMute: () => void;
};
const currentPlayer = () =>
  (window as Window & { player?: VolumePlayer }).player;
export default function SoundController({
  overlay = false,
}: {
  overlay?: boolean;
}) {
  const ready = useAtomValue(ytPlayerInitedState);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<HTMLDialogElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const sync = () => {
    const player = currentPlayer();
    if (!ready || !player?.getVolume || !player?.isMuted) return;
    setVolume(player.getVolume());
    setMuted(player.isMuted());
  };
  useEffect(() => {
    if (!ready) {
      setOpen(false);
      return;
    }
    sync();
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [ready]);
  const toggleMute = () => {
    const player = currentPlayer();
    if (!ready || !player?.isMuted) return;
    if (player.isMuted()) player.unMute();
    else player.mute();
    sync();
  };
  const slider = (
    <input
      ref={range}
      disabled={!ready}
      aria-label="음량"
      type="range"
      min={0}
      max={100}
      value={muted ? 0 : volume}
      onChange={(event) => {
        const player = currentPlayer();
        if (!ready || !player?.setVolume) return;
        player.setVolume(Number(event.target.value));
        player.unMute();
        sync();
      }}
    />
  );
  if (!overlay)
    return (
      <div className="volume-control">
        <button
          className="icon-button"
          disabled={!ready}
          aria-label={muted ? "음소거 해제" : "음소거"}
          onClick={toggleMute}
        >
          <Icon name={muted ? "mute" : "volume"} />
        </button>
        {slider}
      </div>
    );
  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setScope(
            trigger.current?.closest<HTMLDialogElement>("dialog[open]") ?? null,
          );
          sync();
        }
        setOpen(next && ready);
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={trigger}
          className="icon-button"
          disabled={!ready}
          aria-label="음량 조절"
        >
          <Icon name={muted ? "mute" : "volume"} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="volume-popover"
        side="top"
        align="start"
        portalContainer={scope}
        collisionBoundary={scope ?? undefined}
        collisionPadding={8}
        aria-label="음량 조절"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          range.current?.focus();
        }}
      >
        <div className="volume-heading">
          <strong>음량</strong>
          <span>{muted ? 0 : volume}%</span>
        </div>
        {slider}
        <Button variant="secondary" disabled={!ready} onClick={toggleMute}>
          {muted ? "음소거 해제" : "음소거"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
