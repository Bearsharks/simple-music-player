import { useEffect, useRef, useState } from "react";

// Select by the short edge: covers crop YouTube's rectangular images to squares.
export function coverImageSources(source: string, side: number, density = 1): string[] {
  try {
    const url = new URL(source);
    const match = url.pathname.match(/^\/vi(?:_webp)?\/([\w-]{11})\/(?:default|mqdefault|hqdefault|sddefault|maxresdefault)\.(?:jpg|webp)$/);
    if (url.protocol !== "https:" || !["i.ytimg.com", "img.youtube.com"].includes(url.hostname) || !match) return [source];
    const pixels = Math.max(1, side) * Math.min(2, Math.max(1, density));
    const names = pixels <= 180 ? ["mqdefault", "default"] : pixels <= 360 ? ["hqdefault", "mqdefault", "default"] : ["sddefault", "hqdefault", "mqdefault", "default"];
    return names.map(name => `https://i.ytimg.com/vi/${match[1]}/${name}.jpg`);
  } catch {
    return [source];
  }
}

export default function CoverImage({ source }: { source: string }) {
  const image = useRef<HTMLImageElement>(null);
  const [side, setSide] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  useEffect(() => {
    const parent = image.current?.parentElement;
    if (!parent) return;
    const measure = () => setSide(Math.ceil(parent.getBoundingClientRect().width) || 64);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(parent);
    return () => observer?.disconnect();
  }, []);
  const candidates = coverImageSources(source, side, window.devicePixelRatio || 1);
  const selected = candidates.find(candidate => !failed.includes(candidate));
  const reject = () => {
    if (selected) setFailed(previous => previous.includes(selected) ? previous : [...previous, selected]);
  };
  if (!selected) return null;
  return (
    <img
      ref={image}
      src={side ? selected : undefined}
      alt=""
      loading="lazy"
      decoding="async"
      onError={reject}
      onLoad={event => {
        // Missing higher-resolution YouTube thumbnails may return a tiny placeholder.
        if (/\/(?:sddefault|hqdefault|mqdefault)\.jpg$/.test(selected)
          && selected.startsWith("https://i.ytimg.com/vi/")
          && event.currentTarget.naturalWidth > 0
          && event.currentTarget.naturalWidth <= 120) reject();
      }}
    />
  );
}
