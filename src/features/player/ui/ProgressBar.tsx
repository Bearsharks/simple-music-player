import { useEffect } from "react";
import { PlayerState, type Progress } from "shared/model/constants";
const format = (seconds: number) => {
  const n = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};
export default function ProgressBar({
  progress,
  setProgress,
}: {
  progress: Progress;
  setProgress: (p: Progress) => void;
}) {
  useEffect(() => {
    const timer = setInterval(() => {
      const p = (window as any).player;
      if (
        [PlayerState.PLAYING, PlayerState.PAUSED].includes(p?.getPlayerState())
      )
        setProgress({
          currentTime: p.getCurrentTime(),
          duration: p.getDuration(),
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [setProgress]);
  const duration = Number.isFinite(progress.duration)
    ? Math.max(0, progress.duration)
    : 0;
  const current = Math.min(duration, Math.max(0, progress.currentTime || 0));
  return (
    <div className="seek-control">
      <time>{format(current)}</time>
      <input
        aria-label="재생 위치"
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={current}
        disabled={!duration || (window as any).player === undefined}
        onChange={(e) => {
          const t = Number(e.target.value);
          (window as any).player?.seekTo(t);
          setProgress({ ...progress, currentTime: t });
        }}
        style={
          {
            "--seek": `${duration ? (current / duration) * 100 : 0}%`,
          } as React.CSSProperties
        }
      />
      <time>{format(duration)}</time>
    </div>
  );
}
