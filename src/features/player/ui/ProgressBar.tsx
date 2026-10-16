import { type Progress } from "shared/model/constants";
const format = (seconds: number) => {
  const n = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};
export default function ProgressBar({
  progress,
  setProgress,
  readOnly = false,
}: {
  progress: Progress;
  readOnly?: boolean;
  setProgress: (p: Progress) => void;
}) {
  const duration = Number.isFinite(progress.duration)
    ? Math.max(0, progress.duration)
    : 0;
  const current = Math.min(duration, Math.max(0, progress.currentTime || 0));
  if (readOnly)
    return (
      <div className="mini-progress" aria-hidden="true">
        <span
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }}
        />
      </div>
    );
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
      <time>{duration ? format(duration) : "—"}</time>
    </div>
  );
}
