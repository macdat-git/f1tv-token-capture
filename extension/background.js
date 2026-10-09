// Reads the F1TV live-timing token from the user's own formula1.com sign-in cookies.
// The token is returned only to the requesting popup / Home Assistant page; nothing is stored or sent elsewhere.
//
// F1 Sensor wants an Ascendon JWT: it needs an `exp` claim, and a `SessionId` claim lets it
// renew itself. Cookie layouts vary, so we look at every formula1.com cookie that holds a JWT
// (directly, or inside cookie JSON as `subscriptionToken`) and pick the best one.

const JWT_RE = /eyJ[\w-]+\.[\w-]+\.[\w-]+/;
const JWT_WHOLE_RE = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/;

function decode(s) {
  for (let i = 0; i < 3 && /%[0-9a-f]{2}/i.test(s); i++) {
    try { s = decodeURIComponent(s); } catch { break; }
  }
  return s;
}

function claimsOf(jwt) {
  try {
    const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const obj = JSON.parse(atob(p + "=".repeat((4 - (p.length % 4)) % 4)));
    return obj && typeof obj === "object" ? obj : null;
  } catch { return null; }
}

// Returns every JWT string found in one cookie value.
function jwtsFromCookieValue(value) {
  const s = decode(value || "").trim().replace(/^Bearer\s+/i, "");
  const out = [];
  if (JWT_WHOLE_RE.test(s)) out.push(s);
  try {
    const j = JSON.parse(s);
    const t = j?.data?.subscriptionToken ?? j?.subscriptionToken;
    if (typeof t === "string" && JWT_RE.test(t)) out.push(t.match(JWT_RE)[0]);
  } catch { /* not JSON */ }
  const k = s.match(/"subscriptionToken"\s*:\s*"([^"]+)"/);
  if (k && JWT_RE.test(k[1])) out.push(k[1].match(JWT_RE)[0]);
  return [...new Set(out)];
}

async function capture() {
  let cookies;
  try {
    cookies = await chrome.cookies.getAll({ domain: "formula1.com" });
  } catch (e) {
    return { error: "Couldn't read cookies: " + e.message };
  }

  const now = Date.now();
  const candidates = [];
  for (const c of cookies) {
    for (const token of jwtsFromCookieValue(c.value)) {
      const claims = claimsOf(token);
      if (!claims) continue;
      const exp = typeof claims.exp === "number" ? claims.exp * 1000 : null;
      if (exp === null || exp <= now) continue; // F1 Sensor rejects tokens without exp / already expired
      candidates.push({
        token,
        source: c.name,
        exp,
        hasSession: typeof claims.SessionId === "string" && claims.SessionId.length > 0,
        claimNames: Object.keys(claims),
      });
    }
  }

  // Best: has SessionId (auto-renewal works), then the one expiring last.
  candidates.sort((a, b) => Number(b.hasSession) - Number(a.hasSession) || b.exp - a.exp);
  const best = candidates[0];
  if (best) return best;

  // Diagnostics: names, domains and rough shape only, never values.
  const shape = (v) => {
    const d = decode(v || "");
    return d.startsWith("{") ? "json" : JWT_RE.test(d) ? "jwt" : "other";
  };
  const seen = cookies.map((c) => `${c.name}@${c.domain} (${shape(c.value)}, ${c.value.length} chars)`);
  return {
    error: cookies.length
      ? "Found formula1.com cookies but no unexpired F1TV token in them. Cookies seen: " + seen.join("; ") +
        ". Sign in again at f1tv.formula1.com (an active F1TV subscription is needed) and try again."
      : "No formula1.com cookies found, so you're not signed in to F1TV in this browser. Sign in at f1tv.formula1.com and try again.",
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "capture") return;
  capture().then(sendResponse);
  return true; // async response
});
