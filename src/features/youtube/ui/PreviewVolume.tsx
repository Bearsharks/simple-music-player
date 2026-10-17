import { useRef, useState, type CSSProperties } from "react";
import Icon from "shared/ui/Icon";
import { Button } from "shared/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "shared/ui/shadcn/popover";

/** Volume belongs to the preview, independently of the main application player. */
export default function PreviewVolume({ onChange }: { onChange?: (value: number) => void }) {
  const [level, setLevel] = useState(70);
  const lastNonzero = useRef(70);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<HTMLDialogElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const changeOpen = (next: boolean) => {
    if (next) setScope(trigger.current?.closest<HTMLDialogElement>("dialog[open]") ?? null);
    setOpen(next);
  };
  const changeLevel = (value: number) => {
    const next = Math.max(0, Math.min(100, value));
    if (next > 0) lastNonzero.current = next;
    setLevel(next);
    onChange?.(next);
  };
  return <Popover modal={false} open={open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild>
      <Button ref={trigger} variant="ghost" size="icon" aria-label="미리보기 음량 조절"
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            changeOpen(true);
            range.current?.focus();
          }
        }}>
        <Icon name={level === 0 ? "mute" : "volume"} />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="yi-volume-popover" side="top" align="center" sideOffset={6}
      portalContainer={scope} collisionBoundary={scope ?? undefined} collisionPadding={8}
      aria-label="미리보기 음량 조절"
      onOpenAutoFocus={(event) => { event.preventDefault(); range.current?.focus(); }}>
      <input ref={range} type="range" min={0} max={100} step={1} value={level}
        aria-label="미리보기 음량" aria-orientation="vertical"
        style={{ "--volume": `${level}%` } as CSSProperties}
        onChange={(event) => changeLevel(Number(event.target.value))} />
      <Button variant="ghost" size="icon" aria-label={level === 0 ? "미리보기 음소거 해제" : "미리보기 음소거"}
        aria-pressed={level === 0} onClick={() => changeLevel(level === 0 ? lastNonzero.current : 0)}>
        <Icon name={level === 0 ? "mute" : "volume"} />
      </Button>
    </PopoverContent>
  </Popover>;
}
