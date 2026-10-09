const btn = document.getElementById("go");
const msg = document.getElementById("msg");

function show(text, cls) { msg.textContent = text; msg.className = cls || ""; }

function expiryText(jwt) {
  try {
    const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const exp = JSON.parse(atob(p + "=".repeat((4 - (p.length % 4)) % 4))).exp;
    return typeof exp === "number" ? ` Expires ${new Date(exp * 1000).toLocaleString()}.` : "";
  } catch { return ""; }
}

document.getElementById("open").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://f1tv.formula1.com/" });
});

btn.addEventListener("click", () => {
  btn.disabled = true;
  show("Reading your F1TV sign-in…");
  chrome.runtime.sendMessage({ type: "capture" }, async (res) => {
    btn.disabled = false;
    if (chrome.runtime.lastError || !res) return show("Extension error. Try again.", "err");
    if (!res.token) {
      document.getElementById("open").hidden = false;
      return show(res.error || "Capture failed.", "err");
    }
    // Always show the token so it can be copied by hand if the clipboard write is blocked.
    // F1 Sensor's "authorization value" field wants the full header value: "Bearer <token>".
    const header = "Bearer " + res.token;
    const box = document.getElementById("tok");
    box.value = header; box.hidden = false; box.focus(); box.select();
    const detail =
      expiryText(res.token) +
      ` Source: ${res.source}.` +
      (res.hasSession
        ? " Auto-renewal should work."
        : " Note: no SessionId in it, so F1 Sensor may not be able to renew it by itself.");
    try {
      await navigator.clipboard.writeText(header);
      show("Token captured and copied." + detail, res.hasSession ? "ok" : "err");
    } catch {
      show("Token captured, but the clipboard was blocked. Press Ctrl+C now to copy the selected text below." + detail, "err");
    }
  });
});
