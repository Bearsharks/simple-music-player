const LATEST_RELEASE = "https://api.github.com/repos/Bearsharks/simple-music-player/releases/latest";

export function releaseUpdate(release, currentVersion) {
  const latest = typeof release?.tag_name === "string" ? release.tag_name.replace(/^v/, "") : "";
  const validVersion = value => typeof value === "string" && /^\d{1,5}(\.\d{1,5}){1,3}$/.test(value) && value.split(".").every(part => Number(part) <= 65535);
  if (release?.draft || release?.prerelease || !validVersion(latest) || !validVersion(currentVersion)) return null;
  const asset = Array.isArray(release.assets) && release.assets.find(asset => asset?.name === "loopy-extension.zip");
  if (!asset) return null;
  const a = latest.split(".").map(Number), b = currentVersion.split(".").map(Number);
  for (let index = 0; index < 4; index++) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference < 0) return null;
    if (difference > 0) return {
      version: latest,
      url: `https://github.com/Bearsharks/simple-music-player/releases/download/${encodeURIComponent(release.tag_name)}/loopy-extension.zip`,
    };
  }
  return null;
}

let inFlight;
export async function checkUpdate(currentVersion) {
  const { updateCheck } = await chrome.storage.session.get("updateCheck");
  if (updateCheck?.currentVersion === currentVersion && updateCheck.expiresAt > Date.now()) return updateCheck.result;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    let result;
    try {
      const response = await fetch(LATEST_RELEASE, { credentials: "omit", redirect: "error", signal: AbortSignal.timeout(8000) });
      if (response.status === 404) result = { ok: true, update: null };
      else {
        if (!response.ok) throw Error("release lookup failed");
        const text = await response.text();
        if (text.length > 1000000) throw Error("release response too large");
        result = { ok: true, update: releaseUpdate(JSON.parse(text), currentVersion) };
      }
    } catch { result = { ok: false }; }
    await chrome.storage.session.set({ updateCheck: { currentVersion, result, expiresAt: Date.now() + (result.ok ? 3600000 : 60000) } });
    return result;
  })().finally(() => { inFlight = null; });
  return inFlight;
}
