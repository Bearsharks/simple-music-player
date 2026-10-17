const paths: Record<string, string> = {
  "playlist-add": '<path d="M3 5h12M3 10h12M3 15h7m8-4v10m-5-5h10"/>',
  "queue-next": '<path d="M3 5h12M3 10h12M3 15h7m5-3 6 4-6 4Z"/>',
  remove: '<circle cx="12" cy="12" r="9"/><path d="M7 12h10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  link: '<path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" transform="translate(0 -1) scale(.95)"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  play: '<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  pause:
    '<path d="M7 5h4v14H7zm7 0h4v14h-4z" fill="currentColor" stroke="none"/>',
  next: '<path d="m5 6 10 6-10 6Z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
  previous:
    '<path d="m19 6-10 6 10 6Z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
  queue:
    '<path d="M3 6h12M3 11h12M3 16h7m8-4v7a2.5 2.5 0 1 1-2-2.45V8l5-1v4Z"/>',
  volume:
    '<path d="M4 9h4l5-4v14l-5-4H4ZM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4Zm13 0 5 6m0-6-5 6"/>',
  music:
    '<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
  device:
    '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6m-3-4v4"/>',
  edit: '<path d="m4 16-1 5 5-1L21 7l-4-4Zm10-10 4 4"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  up: '<path d="m6 14 6-6 6 6"/>',
  down: '<path d="m6 10 6 6 6-6"/>',
  grip: '<circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  warning: '<path d="M10.3 4a2 2 0 0 1 3.4 0L22 19H2ZM12 9v4m0 3h.01"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>',
  save: '<path d="M4 3h13l4 4v14H3V3Zm4 0v6h8V3M7 21v-8h10v8"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  wave: '<path d="M3 10v4m4-7v10m5-15v20m5-16v12m4-9v6"/>',
  settings:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--surface)"/><circle cx="16" cy="12" r="2" fill="var(--surface)"/><circle cx="10" cy="18" r="2" fill="var(--surface)"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
};
export default function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: paths[name] ?? paths.music }}
    />
  );
}
