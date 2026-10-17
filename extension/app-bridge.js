// Notifications carry no items or acknowledgements. Loopy pulls from the verified extension.
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || !message || typeof message !== "object" ||
      message.type !== "loopy.delivery.available" || Object.keys(message).length !== 1) return;
  window.postMessage({ type: "loopy.delivery.available" }, location.origin);
  reply({ ok: true });
});
