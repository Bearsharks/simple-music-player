(() => {
  function itemFrom(raw, preferPlaylist = false) {
    try {
      const url = new URL(raw, location.origin);
      if (url.origin !== "https://www.youtube.com") return null;
      const playlist = url.searchParams.get("list"), video = url.searchParams.get("v") || (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : "");
      if ((preferPlaylist || !video) && playlist && /^[\w-]{2,150}$/.test(playlist)) return { kind: "playlist", id: playlist };
      if (video && /^[\w-]{11}$/.test(video)) return { kind: "video", id: video };
    } catch {} return null;
  }
  const bar = document.createElement("div"); bar.id = "loopy-bridge-tools"; bar.hidden = true;
  const status = document.createElement("span"); status.setAttribute("role", "status");
  async function send(message) { try { const r = await chrome.runtime.sendMessage(message); if (!r?.ok) throw Error(r?.error || "연결 실패"); return r; } catch(e) { status.textContent = e.message; return null; } }
  function previewFrom(item, row = document) {
    let scope = row, title = "";
    if (row === document) {
      if (item.kind === "playlist" && location.pathname !== "/playlist") {
        scope = document.querySelector("ytd-playlist-panel-renderer") || document.createElement("div");
        title = scope.querySelector("#title a, #title, #playlist-title")?.textContent || "";
      } else {
        title = document.querySelector("ytd-watch-metadata h1, ytd-video-primary-info-renderer h1, yt-page-header-renderer h1, .dynamic-text-view-model-wiz__h1, ytd-playlist-header-renderer #title")?.textContent || document.title.replace(/\s*-\s*YouTube\s*$/, "");
        if (item.kind === "playlist") scope = document.querySelector("ytd-playlist-header-renderer, yt-page-header-renderer") || document;
      }
    } else {
      const heading = row.querySelector("#video-title, #video-title-link, .yt-lockup-metadata-view-model__title, h3, #playlist-title");
      title = heading?.getAttribute("title") || heading?.textContent || "";
    }
    let thumbnailVideoId = item.kind === "video" ? item.id : "";
    if (!thumbnailVideoId) {
      for (const image of scope.querySelectorAll("img")) {
        try {
          const url = new URL(image.currentSrc || image.src);
          const match = url.pathname.match(/^\/(?:vi|vi_webp)\/([A-Za-z0-9_-]{11})\//);
          if (url.protocol === "https:" && url.hostname === "i.ytimg.com" && match) { thumbnailVideoId = match[1]; break; }
        } catch {}
      }
    }
    return { title: title.trim().slice(0, 300), thumbnailVideoId };
  }
  const add = async (item, row) => { if (!item) return; const r = await send({ type: "basket.add", item, preview: previewFrom(item, row) }); if(r) status.textContent = `${r.count}개 담음`; };
  const videoButton = document.createElement("button"), playlistButton = document.createElement("button"), connect = document.createElement("button");
  videoButton.textContent = "영상 담기"; playlistButton.textContent = "목록 담기"; connect.textContent = "연동하기";
  const overlayHost = document.createElement("div");
  overlayHost.id = "loopy-import-overlay";
  const shadow = overlayHost.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    dialog { position:fixed; inset:24px 24px auto auto; margin:0; padding:0;
      width:min(400px,calc(100vw - 24px)); height:min(640px,calc(100dvh - 48px));
      max-width:none; max-height:none; border:1px solid #353545; border-radius:16px;
      background:#0b0b14; color:#fff; overflow:hidden; box-shadow:0 12px 48px #0006; }
    dialog[open] { display:flex; flex-direction:column; }
    dialog::backdrop { background:#0006; }
    header { display:flex; justify-content:flex-end; padding:8px 12px 0; flex-shrink:0; }
    button { width:44px; height:44px; background:none; border:0; border-radius:10px;
      color:white; font:24px system-ui; cursor:pointer; }
    button:hover { background:#242435; }
    button:focus-visible { outline:2px solid #4cc9ff; outline-offset:-2px; }
    iframe { display:block; width:100%; flex:1; min-height:0; border:0; }
    @media(max-width:480px) { dialog {inset:12px 12px auto auto;height:min(640px,calc(100dvh - 24px));} }
  `;
  const panel = document.createElement("dialog");
  panel.setAttribute("aria-label", "loopy 담은 목록");
  const panelHeader = document.createElement("header"), closeButton = document.createElement("button");
  closeButton.type = "button"; closeButton.textContent = "×"; closeButton.setAttribute("aria-label", "담은 목록 닫기");
  const frame = document.createElement("iframe");
  frame.title = "loopy 담은 목록";
  const popupURL = chrome.runtime.getURL("popup.html");
  const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;
  const closePanel = () => {
    if (!panel.open) return;
    frame.removeAttribute("src");
    panel.close();
    connect.focus();
  };
  closeButton.onclick = closePanel;
  panel.addEventListener("cancel", event => { event.preventDefault(); closePanel(); });
  let backdropDown = false;
  const outside = event => { const rect = panel.getBoundingClientRect(); return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; };
  panel.addEventListener("pointerdown", event => { backdropDown = event.target === panel && outside(event); });
  panel.addEventListener("click", event => { if (backdropDown && event.target === panel && outside(event)) closePanel(); backdropDown = false; });
  // The embedded extension document may request closing, never an import operation.
  window.addEventListener("message", event => {
    if (event.origin === extensionOrigin && event.source === frame.contentWindow &&
      event.data?.type === "loopy.panel.close" && Object.keys(event.data).length === 1) closePanel();
  });
  panelHeader.append(closeButton); panel.append(panelHeader, frame); shadow.append(style, panel); document.body.append(overlayHost);
  const openPanel = () => {
    if (panel.open) return;
    frame.src = popupURL;
    panel.showModal();
    closeButton.focus();
  };
  videoButton.onclick = () => add(itemFrom(location.href)); playlistButton.onclick = () => add(itemFrom(location.href, true)); connect.onclick = openPanel;
  const hideUI = document.createElement("button"); hideUI.type = "button"; hideUI.textContent = "×";
  hideUI.className = "loopy-hide-ui"; hideUI.setAttribute("aria-label", "YouTube 담기 UI 숨기기");
  hideUI.onclick = () => { void setVisibility(false); };
  bar.append(videoButton, playlistButton, connect, status, hideUI); document.body.append(bar);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.youtubeUiVisible) {
      visibilityRevision++; applyVisibility(changes.youtubeUiVisible.newValue !== false);
    }
    if (area === "local" && changes.basket) {
      const count = Array.isArray(changes.basket.newValue) ? changes.basket.newValue.length : 0;
      status.textContent = count ? `${count}개 담음` : "담은 항목 없음";
    }
  });
  const floating = document.createElement("div");
  floating.id = "loopy-thumbnail-actions"; floating.hidden = true;
  document.body.append(floating);
  let uiVisible = false, visibilityRevision = 0;
  function applyVisibility(visible) {
    uiVisible = visible;
    if (!visible) { closePanel(); hideUI.blur(); }
    bar.hidden = !visible; floating.hidden = !visible;
    if (visible) schedulePosition();
  }
  async function setVisibility(visible) {
    visibilityRevision++; applyVisibility(visible);
    try { await chrome.storage.local.set({ youtubeUiVisible: visible }); }
    catch { applyVisibility(true); status.textContent = "표시 설정을 저장하지 못했습니다."; }
  }
  function activateFromSearch() {
    const url = new URL(location.href);
    if (url.pathname !== "/results" || url.searchParams.get("loopy") !== "1") return false;
    url.searchParams.delete("loopy");
    history.replaceState(history.state, "", url.href);
    void setVisibility(true);
    return true;
  }
  const targets = new Map();
  const resizeObserver = new ResizeObserver(() => schedulePosition());
  let layoutFrame = 0;
  function positionButtons() {
    layoutFrame = 0;
    for (const [thumbnail, entry] of targets) {
      if (!thumbnail.isConnected || !entry.row.isConnected) {
        resizeObserver.unobserve(thumbnail); entry.button.remove(); targets.delete(thumbnail); continue;
      }
      const rect = thumbnail.getBoundingClientRect();
      const visible = uiVisible && rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top <= innerHeight - 26 && rect.right > 0 && rect.left < innerWidth;
      entry.button.hidden = !visible;
      if (visible) {
        entry.button.style.left = `${Math.max(4, rect.left - 30)}px`;
        entry.button.style.top = `${rect.top}px`;
      }
    }
  }
  const schedulePosition = () => { if (!layoutFrame) layoutFrame = requestAnimationFrame(positionButtons); };
  document.addEventListener("scroll", schedulePosition, { passive: true, capture: true });
  window.addEventListener("resize", schedulePosition, { passive: true });
  let previewSignature = "";
  function scan() {
    activateFromSearch();
    const entries = [];
    for (const item of [itemFrom(location.href), itemFrom(location.href, true)]) {
      if (item) entries.push({ item, preview: previewFrom(item) });
    }
    videoButton.hidden = itemFrom(location.href)?.kind !== "video";
    playlistButton.hidden = itemFrom(location.href, true)?.kind !== "playlist";
    document.querySelectorAll("ytd-video-renderer,ytd-playlist-renderer,yt-lockup-view-model,ytd-rich-item-renderer,ytd-playlist-video-renderer,ytd-compact-video-renderer,ytd-grid-video-renderer").forEach(row => {
      const link = row.querySelector('a[href*="/watch?"],a[href*="/playlist?"],a[href*="/shorts/"]');
      if (!link || !itemFrom(link.href)) return;
      const thumbnail = row.querySelector("ytd-thumbnail,yt-thumbnail-view-model,.yt-lockup-view-model__content-image") || link;
      const item = itemFrom(link.href, !!row.querySelector('a[href*="/playlist?"]'));
      if (!item) return;
      if (entries.length < 100) entries.push({ item, preview: previewFrom(item, row) });
      const existing = targets.get(thumbnail);
      if (existing) { existing.button.dataset.loopyId = item.id; return; }
      const button = document.createElement("button"); button.type = "button"; button.className = "loopy-collect"; button.textContent = "+";
      button.title = "담기"; button.setAttribute("aria-label", "담기");
      button.dataset.loopyId = item.id;
      button.hidden = true;
      button.onclick = e => { e.preventDefault(); e.stopPropagation(); const current = row.querySelector('a[href*="/watch?"],a[href*="/playlist?"],a[href*="/shorts/"]'); if(current) add(itemFrom(current.href, !!row.querySelector('a[href*="/playlist?"]')), row); };
      floating.append(button);
      targets.set(thumbnail, { row, button });
      resizeObserver.observe(thumbnail);
    });
    schedulePosition();
    const signature = JSON.stringify(entries);
    if (signature !== previewSignature) {
      previewSignature = signature;
      if (entries.length) chrome.runtime.sendMessage({ type: "basket.preview", entries }).catch(() => {});
    }
  }
  let timer; new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(scan, 250); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["href"]});
  document.addEventListener("yt-navigate-finish", scan); scan();
  const revision = visibilityRevision;
  if (!revision) chrome.storage.local.get("youtubeUiVisible").then(value => {
    if (visibilityRevision === revision) applyVisibility(value.youtubeUiVisible !== false);
  }).catch(() => { if (visibilityRevision === revision) applyVisibility(true); });
})();
