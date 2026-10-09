# F1TV Token Capture

A small browser extension that copies your own F1TV sign-in token so you can paste it into the [F1 Sensor](https://github.com/Nicxe/f1_sensor) Home Assistant integration. An optional dashboard page can also send the token to Home Assistant for you.

> **Unofficial.** Not affiliated with, endorsed by, or supported by Formula 1, F1 TV, or the F1 Sensor project. F1, FORMULA 1 and F1 TV are trademarks of their owners. You need your own F1 TV subscription, and you are responsible for complying with F1 TV's terms of use.

## Why this exists
F1 Sensor can use an F1 TV token to unlock extra live data (track map, pit stops, team radio, championship prediction). Getting that token out of the browser by hand is awkward, and the official helper extension is no longer available to install. This extension does that one step.

## How it works
Browsers don't let a web page read another site's cookies, so an extension is needed. When you click the extension's button it:

1. reads the cookies for `formula1.com` in your own browser,
2. looks for a JWT in them (currently the `entitlement_token` cookie; it also understands a `subscriptionToken` inside a `login-session` cookie), preferring one that has a `SessionId` claim so F1 Sensor can renew it automatically,
3. copies `Bearer <token>` to your clipboard.

That's all. The token goes to your clipboard and nowhere else. See [PRIVACY.md](PRIVACY.md).

## Install (Chrome / Edge)
1. Download this repository (Code → Download ZIP) and unzip it somewhere permanent. The browser runs the extension from that folder, so don't move or delete it afterwards.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and choose the `extension` folder.
4. Click the puzzle-piece icon in the toolbar and pin **F1TV Token Capture**.

## Use
1. Sign in at <https://f1tv.formula1.com> in that browser.
2. Click the extension icon → **Copy my F1TV token**. The popup shows when it expires and whether auto-renewal should work.
3. In Home Assistant: Settings → Devices & services → **F1 Sensor** → **Reconfigure** → paste into **Manual backup: F1TV authorization value** → Submit.
4. Check `sensor.f1_f1tv_token_status` shows the token as valid.

F1 Sensor renews the token itself for roughly a month. When Home Assistant raises a repair about F1 TV access, repeat the steps above.

## If capture fails
The popup lists the formula1.com cookies it saw (names, domains and rough shape only, never values). If you open an issue, include that list. Formula 1 may change how its sign-in cookies work, so this can break.

Manual fallback: in developer tools → Application → Cookies → `formula1.com`, find the JWT cookie, and paste `Bearer ` followed by its value into the Reconfigure field.

## Optional: dashboard page
`f1tv-token.html` is a page you can serve from Home Assistant (`/config/www/f1tv-token.html` → `/local/f1tv-token.html`, e.g. in a Webpage card). It can capture the token through the extension, copy it, or send it directly to F1 Sensor's pairing callback using a pairing link from Reconfigure → *Connect F1TV access with Token Helper*.

**Status:** capture, copy, and direct send were all tested successfully against F1 Sensor 5.7.1 on a real Home Assistant. The direct send has more steps than the copy-and-paste route above (it needs a fresh pairing link every time, valid for 5 minutes), so the copy route is the quicker everyday option.

## Security
- The token is a credential: anyone who has it can use your F1 TV session until it expires. Don't paste it into issues, chats or screenshots.
- The extension requests the `cookies` permission for `https://*.formula1.com/*` only, plus `clipboardWrite`. It makes no network requests.
- It only runs its page bridge on addresses containing `/local/f1tv-token`.
- The optional dashboard page runs inside your Home Assistant. To show the status pills it reads Home Assistant's own login token from the browser's local storage and calls `/api/states/…` for the two F1TV token sensors (read-only). It never sends anything outside your Home Assistant.
- Review the source: it's a few short files in `extension/` plus `f1tv-token.html`.

## Compatibility
Written against F1 Sensor's public source (`auth.py`, `auth_http.py`, `config_flow.py`) as of October 2026: it expects a `Bearer <JWT>` value with an `exp` claim. Other versions may differ.

## Support
If this saved you some time, you can [buy me a coffee](https://buymeacoffee.com/macdat). Entirely optional; the project stays free either way.

## License
[MIT](LICENSE)
