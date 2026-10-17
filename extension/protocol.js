import { LOCAL_ORIGINS } from "./config.js";
export const EXTENSION_ID = "lpkemppmemlhcggfjcdimmcpfbdjgfdb";
export const MAX_ITEMS = 100;
export function validPlaylistId(id) {
  return typeof id === "string" && /^[A-Za-z0-9_-]{2,150}$/.test(id);
}
export function sanitizePreview(value, item) {
  const title = typeof value?.title === "string"
    ? value.title.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
    : "";
  const thumbnailVideoId = item.kind === "video" ? item.id
    : typeof value?.thumbnailVideoId === "string" && /^[A-Za-z0-9_-]{11}$/.test(value.thumbnailVideoId) ? value.thumbnailVideoId : "";
  return { title, thumbnailVideoId };
}
export function validItem(item) {
  return !!item && typeof item === "object" && !Array.isArray(item) &&
    Object.keys(item).length === 2 && Object.hasOwn(item, "kind") && Object.hasOwn(item, "id") &&
    typeof item.id === "string" && (item.kind === "video" ? /^[A-Za-z0-9_-]{11}$/.test(item.id) :
      item.kind === "playlist" && validPlaylistId(item.id));
}
export function validEnvelope(value) {
  return !!value && typeof value === "object" && Object.keys(value).length === 4 &&
    ["type", "version", "requestId", "items"].every(key => Object.hasOwn(value, key)) &&
    value.type === "loopy.import" && value.version === 1 &&
    typeof value.requestId === "string" && /^[a-f0-9-]{36}$/.test(value.requestId) &&
    Array.isArray(value.items) && value.items.length > 0 && value.items.length <= MAX_ITEMS && value.items.every(validItem);
}
export function allowedApp(raw) {
  try {
    const url = new URL(raw);
    return url.origin === "https://loopy.bearsharks.dev" ||
      (LOCAL_ORIGINS.includes(url.origin) && (url.pathname === "/simple-music-player" || url.pathname.startsWith("/simple-music-player/")));
  } catch { return false; }
}
