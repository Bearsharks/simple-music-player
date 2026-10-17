const list = document.querySelector("#basket");
const status = document.querySelector("#status");
const save = document.querySelector("#save");
document.querySelector("#version").textContent = `v${chrome.runtime.getManifest().version}`;
chrome.runtime.sendMessage({ type: "extension.update" }).then(result => {
  if (!result?.ok || !result.update) return;
  const update = document.querySelector("#update");
  update.href = result.update.url;
  update.title = `v${result.update.version} 다운로드`;
  update.hidden = false;
}).catch(() => {});
if (window.parent !== window) document.documentElement.classList.add("embedded");
let submitting = false, generation = 0;
let basketSignature = "";
let actionError = "";
async function call(message) {
  const result = await chrome.runtime.sendMessage(message);
  if (!result?.ok) throw Error(result?.error || "연결하지 못했습니다.");
  return result;
}
async function render() {
  const current = ++generation;
  try {
    const result = await call({ type: "basket.get" });
    if (current !== generation) return;
    document.querySelector("#count").textContent = result.basket.length;
    save.disabled = submitting || !result.basket.length;
    const signature = JSON.stringify(result.basket);
    if (signature !== basketSignature) {
      basketSignature = signature;
      list.replaceChildren();
    result.basket.forEach((item, index) => {
      const row = document.createElement("li"), text = document.createElement("span");
      const kind = document.createElement("small"), title = document.createElement("strong"), remove = document.createElement("button");
      const cover = document.createElement("span"); cover.className = "basket-cover"; cover.textContent = "♪"; cover.setAttribute("aria-hidden", "true");
      if (/^[A-Za-z0-9_-]{11}$/.test(item.thumbnailVideoId || "")) {
        const image = document.createElement("img"); image.alt = ""; image.loading = "lazy"; image.referrerPolicy = "no-referrer";
        image.src = `https://i.ytimg.com/vi/${item.thumbnailVideoId}/mqdefault.jpg`;
        image.onerror = () => image.remove(); cover.append(image);
      }
      text.className = "basket-copy";
      title.textContent = item.title || (item.kind === "video" ? "영상" : "재생목록");
      title.title = `${item.title || ""}\n${item.id}`.trim();
      kind.textContent = item.title ? (item.kind === "video" ? "영상" : "재생목록") : item.id;
      text.append(title, kind);
      remove.textContent = "삭제";
      remove.setAttribute("aria-label", `${index + 1}번째 항목 삭제`);
      remove.onclick = async () => {
        try { await call({ type: "basket.remove", key: item.key }); await render(); }
        catch (error) { status.textContent = error.message; }
      };
      row.append(cover, text, remove); list.append(row);
      });
    }
    status.textContent = actionError || (result.waiting ? "Loopy에 전달 대기 중" : result.outcome || (result.basket.length ? "" : "담은 항목 없음"));
  } catch (error) { if (current === generation) status.textContent = error.message; }
}
save.onclick = async () => {
  if (submitting) return;
  submitting = true; actionError = ""; save.disabled = true;
  try { await call({ type: "basket.send" }); submitting = false; await render(); }
  catch (error) { submitting = false; save.disabled = false; actionError = error.message; status.textContent = actionError; }
};
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === "local" && changes.basket) || (area === "session" && (changes.delivery || changes.outcome))) void render();
});
const refresh = setInterval(() => { if (!submitting) void render(); }, 5000);
window.addEventListener("unload", () => clearInterval(refresh));
void render();
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && window.parent !== window) {
    event.preventDefault();
    window.parent.postMessage({ type: "loopy.panel.close" }, "https://www.youtube.com");
  }
});
