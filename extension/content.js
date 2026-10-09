// Bridge between the F1TV Token Capture page (same tab) and the extension background.
// Only runs on pages whose path starts with /local/f1tv-token (see manifest).
(() => {
  const announce = () => window.postMessage({ type: "F1TV_EXT_READY" }, location.origin);
  announce();

  window.addEventListener("message", (ev) => {
    if (ev.source !== window || ev.origin !== location.origin || !ev.data) return;
    if (ev.data.type === "F1TV_PING") return announce();
    if (ev.data.type !== "F1TV_CAPTURE_REQUEST") return;

    chrome.runtime.sendMessage({ type: "capture" }, (res) => {
      const reply = chrome.runtime.lastError
        ? { error: "Extension error: " + chrome.runtime.lastError.message }
        : res || { error: "No response from extension." };
      window.postMessage({ type: "F1TV_CAPTURE_RESULT", ...reply }, location.origin);
    });
  });
})();
