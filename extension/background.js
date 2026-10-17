import { validItem, validEnvelope, allowedApp, MAX_ITEMS, sanitizePreview } from "./protocol.js";
import { APP_URL, APP_PATTERNS } from "./config.js";
import { checkUpdate } from "./updates.js";

const DELIVERY_TTL = 30000;
let chain = Promise.resolve();
const serial = fn => { const next = chain.then(fn); chain = next.catch(() => {}); return next; };
const youtubeSender = sender => {
  try { return sender.id === chrome.runtime.id && new URL(sender.url).origin === "https://www.youtube.com"; } catch { return false; }
};
const popupSender = sender => sender.id === chrome.runtime.id && sender.url === chrome.runtime.getURL("popup.html");

async function readBasket() {
  const { basket: stored } = await chrome.storage.local.get("basket");
  const values = Array.isArray(stored) ? stored : [];
  const keys = new Set();
  const basket = [];
  for (const value of values.slice(0, MAX_ITEMS)) {
    if (!value || !validItem({ kind: value.kind, id: value.id })) continue;
    let key = value.key;
    if (typeof key !== "string" || !/^[a-f0-9-]{36}$/.test(key) || keys.has(key)) key = crypto.randomUUID();
    keys.add(key);
    basket.push({ key, kind: value.kind, id: value.id, ...sanitizePreview(value, value) });
  }
  if (JSON.stringify(basket) !== JSON.stringify(values)) await chrome.storage.local.set({ basket });
  return basket;
}

async function readDelivery() {
  const state = await chrome.storage.session.get(["delivery", "outcome", "lastSent"]);
  if (state.delivery && state.delivery.expiresAt <= Date.now()) {
    state.delivery = null;
    state.outcome = "전달을 확인하지 못했습니다. Loopy를 새로고침한 뒤 다시 저장하세요.";
    await chrome.storage.session.set({ delivery: null, outcome: state.outcome });
  }
  return state;
}

async function chooseAppTab() {
  const tabs = (await chrome.tabs.query({ url: APP_PATTERNS }))
    .filter(tab => Number.isInteger(tab.id) && allowedApp(tab.url || ""))
    .sort((a, b) => {
      const preferred = tab => new URL(tab.url).origin === new URL(APP_URL).origin;
      return Number(preferred(b)) - Number(preferred(a)) || (b.lastAccessed || 0) - (a.lastAccessed || 0) || a.id - b.id;
    });
  if (tabs[0]) return tabs[0];
  if (!allowedApp(APP_URL)) throw Error("Loopy 주소를 확인할 수 없습니다.");
  return chrome.tabs.create({ url: APP_URL, active: true });
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (!youtubeSender(sender) && !popupSender(sender)) return;
  if (message?.type === "extension.update") {
    if (!popupSender(sender)) return;
    checkUpdate(chrome.runtime.getManifest().version).then(reply, () => reply({ ok: false }));
    return true;
  }
  serial(async () => {
    if (message?.type === "app.open") {
      if (!popupSender(sender) || Object.keys(message).length !== 1) throw Error("허용되지 않은 요청입니다.");
      try {
        const target = await chooseAppTab();
        if (!Number.isInteger(target.id)) throw Error("missing tab");
        await chrome.tabs.update(target.id, { active: true });
        await chrome.windows.update(target.windowId, { focused: true });
      } catch { throw Error("Loopy 탭을 열지 못했습니다. 다시 시도하세요."); }
      return { ok: true };
    }
    const basket = await readBasket();
    switch (message?.type) {
      case "basket.add":
        if (!validItem(message.item)) throw Error("항목을 확인할 수 없습니다.");
        if (basket.length >= MAX_ITEMS) throw Error(`최대 ${MAX_ITEMS}개까지 담을 수 있습니다.`);
        basket.push({ key: crypto.randomUUID(), kind: message.item.kind, id: message.item.id, ...sanitizePreview(message.preview, message.item) });
        await chrome.storage.local.set({ basket });
        await chrome.storage.session.set({ outcome: "" });
        return { ok: true, count: basket.length };
      case "basket.preview": {
        if (!youtubeSender(sender) || !Array.isArray(message.entries) || message.entries.length > MAX_ITEMS || !message.entries.every(entry => validItem(entry?.item))) throw Error("허용되지 않은 요청입니다.");
        const next = basket.map(item => {
          const entry = message.entries.find(entry => entry.item.kind === item.kind && entry.item.id === item.id);
          if (!entry) return item;
          const preview = sanitizePreview(entry.preview, item);
          return { ...item, title: preview.title || item.title, thumbnailVideoId: preview.thumbnailVideoId || item.thumbnailVideoId };
        });
        if (JSON.stringify(next) !== JSON.stringify(basket)) await chrome.storage.local.set({ basket: next });
        return { ok: true };
      }
      case "basket.get": {
        if (!popupSender(sender)) throw Error("허용되지 않은 요청입니다.");
        const state = await readDelivery();
        return { ok: true, basket, waiting: !!state.delivery, outcome: state.outcome || "" };
      }
      case "basket.remove": {
        if (!popupSender(sender) || typeof message.key !== "string") throw Error("항목을 확인할 수 없습니다.");
        const index = basket.findIndex(item => item.key === message.key);
        if (index < 0) throw Error("항목을 확인할 수 없습니다.");
        basket.splice(index, 1);
        await chrome.storage.local.set({ basket });
        return { ok: true };
      }
      case "basket.send": {
        if (!popupSender(sender) || !basket.length) throw Error("담은 항목이 없습니다.");
        const state = await readDelivery();
        if (Date.now() - (state.lastSent || 0) < 2000) throw Error("잠시 후 다시 보내세요.");
        const target = await chooseAppTab();
        if (!Number.isInteger(target.id)) throw Error("Loopy 탭을 열지 못했습니다.");
        const request = {
          type: "loopy.import", version: 1, requestId: crypto.randomUUID(),
          items: basket.map(({ kind, id }) => ({ kind, id })),
        };
        await chrome.storage.session.set({
          delivery: { request, entryKeys: basket.map(item => item.key), targetTabId: target.id, expiresAt: Date.now() + DELIVERY_TTL },
          lastSent: Date.now(), outcome: "",
        });
        try {
          await chrome.tabs.update(target.id, { active: true });
          await chrome.windows.update(target.windowId, { focused: true });
        } catch {
          await chrome.storage.session.set({ delivery: null, outcome: "Loopy 탭을 열지 못했습니다. 다시 저장하세요." });
          throw Error("Loopy 탭을 열지 못했습니다. 다시 저장하세요.");
        }
        // A new document can receive the request through its initial pull instead.
        // Missing content scripts never acknowledge or clear the stored basket.
        await chrome.tabs.sendMessage(target.id, { type: "loopy.delivery.available" }, { frameId: 0 }).catch(() => {});
        return { ok: true };
      }
      default: throw Error("허용되지 않은 요청입니다.");
    }
  }).then(reply, error => reply({ ok: false, error: error.message }));
  return true;
});

// Only the tab chosen for this delivery may receive or acknowledge it.
chrome.runtime.onMessageExternal.addListener((message, sender, reply) => {
  if (!allowedApp(sender.url || "") || sender.frameId !== 0 || !Number.isInteger(sender.tab?.id)) return;
  serial(async () => {
    const { delivery } = await readDelivery();
    const targeted = delivery && delivery.targetTabId === sender.tab.id && validEnvelope(delivery.request);
    if (message?.type === "loopy.pull" && Object.keys(message).length === 1)
      return { ok: true, request: targeted ? delivery.request : null };
    if (message?.type === "loopy.ack" && Object.keys(message).length === 2 && targeted && message.requestId === delivery.request.requestId) {
      const sentKeys = new Set(delivery.entryKeys);
      const basket = await readBasket();
      await chrome.storage.local.set({ basket: basket.filter(item => !sentKeys.has(item.key)) });
      await chrome.storage.session.set({ delivery: null, outcome: "Loopy에서 수신했습니다." });
      return { ok: true };
    }
    return { ok: false };
  }).then(reply, () => reply({ ok: false }));
  return true;
});
