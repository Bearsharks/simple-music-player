import { useEffect, useState } from "react";
export default function SoundController() {
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      const p = (window as any).player;
      if (p?.getVolume) {
        setVolume(p.getVolume());
        setMuted(p.isMuted());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="volume-control">
      <button
        className="icon-button"
        aria-label={muted ? "음소거 해제" : "음소거"}
        onClick={() => {
          const p = (window as any).player;
          if (!p) return;
          if (p.isMuted()) p.unMute();
          else p.mute();
          setMuted(p.isMuted());
        }}
      >
        <span className="material-icons">
          {muted ? "volume_off" : "volume_up"}
        </span>
      </button>
      <input
        aria-label="음량"
        type="range"
        min={0}
        max={100}
        value={muted ? 0 : volume}
        onChange={(e) => {
          const v = Number(e.target.value);
          const p = (window as any).player;
          p?.setVolume(v);
          p?.unMute();
          setVolume(v);
          setMuted(false);
        }}
      />
    </div>
  );
}
