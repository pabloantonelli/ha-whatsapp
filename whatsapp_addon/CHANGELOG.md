# Changelog

## 3.2.3

### 🐛 Fixed

- **The panel kept running an old version after an update.** It was served
  without `Cache-Control`, so browsers held on to a cached copy — which is why
  earlier fixes appeared not to work. It now always revalidates.
- The avatar observer was created while the script loaded, so on a browser
  without `IntersectionObserver` the whole panel would have died, copy buttons
  included. It is now created on demand and skipped if unsupported.

### 🧹 Internals

- The panel is now covered by tests: it boots in jsdom, and the suite asserts
  that each Copy button copies its own snippet and that copying falls back to
  `execCommand` when `navigator.clipboard` is unavailable, as it is over plain
  HTTP.

## 3.2.2

### ✨ New

- The snippet builder now shows the Node-RED call **both ways**: the plain
  action and data to type into a `call service` node (or the event type for an
  `events: all` node), and the importable node JSON. The fields always apply,
  whatever version of the Node-RED companion is installed.

### 🐛 Fixed

- With several snippets on screen, a block's Copy button could copy the first
  block instead of its own.

## 3.2.1

### 🐛 Fixed

- **Copy buttons did nothing.** `navigator.clipboard` only exists in secure
  contexts and ingress is served over plain HTTP, so copying now falls back to a
  hidden textarea that works without HTTPS.

### ✨ New

- The snippet builder writes **importable Node-RED nodes** instead of an
  `http request` configuration. Node-RED reaches the add-on through Home
  Assistant's websocket, so no token and no HTTP call are needed — copy the JSON
  and paste it with `Ctrl+I`.
- New builder actions for the three events the add-on fires
  (`new_whatsapp_message`, `whatsapp_message_ack`, `whatsapp_presence_update`),
  generating both an automation trigger and an `events: all` node.
- Generated YAML no longer quotes every value, but keeps phone numbers quoted so
  YAML cannot read them as integers and drop a leading zero.

## 3.2.0

### ✨ New

- **Snippet builder** in the sidebar panel. Pick a client, an action and fill in
  the fields, and it writes the call out three ways, ready to copy: **Home
  Assistant** YAML to paste into an automation, **Node-RED** as the method, URL,
  headers and payload for an `http request` node, and **curl** to try from a
  terminal. It covers text, camera snapshots and clips, images and audio by URL,
  locations, presence and profile status, with this install's real URL and token
  filled in.

- **Redesigned panel**, now split into _Status_, _Groups & contacts_ and
  _Snippet builder_ tabs, with status dots and a cleaner layout.
- **Real profile pictures** in the chat list, loaded only for the rows actually
  on screen and cached for an hour, since WhatsApp rate-limits them.

### 🧹 Internals

- New `GET /api/v1/clients/:id/avatar/:jid`, which proxies the picture because
  the ingress content policy blocks WhatsApp's CDN from the browser.
- New `GET /api/v1/connection`, served only over ingress.

## 3.1.0

### ✨ New

- **`whatsapp.send_media`** sends a snapshot straight from any `camera.*` or
  `image.*` entity — no more saving files or exposing URLs first:

  ```yaml
  action: whatsapp.send_media
  data:
    clientId: default
    to: "34600000000"
    entity_id: camera.front_door
    caption: Someone is at the door
  ```

- **Video clips.** Add `duration` to record instead of snapping, and `lookback`
  to include footage from _before_ the automation fired, which is usually the
  part worth seeing. Requires a camera that supports streaming.
- **Group and contact browser** in the sidebar panel, with search and a copy
  button. Group JIDs cannot be derived from a phone number, so this is the only
  practical way to address a group.
- New `GET /api/v1/clients/:id/chats` and `POST /api/v1/clients/:id/media`.

### 🧹 Internals

- The add-on now maps `/media`, which `camera.record` needs to write clips.
- Contacts are accumulated from WhatsApp's sync events, since Baileys 7 no
  longer ships a store. The list fills in gradually after pairing.

## 3.0.0

Released as a new add-on (`ha_whatsapp`) with its own identity, based on the
original WhatsApp add-on by Giuseppe Castaldo.

### ⚠️ Breaking changes

- **The add-on slug changed** from `whatsapp_addon` to `ha_whatsapp`. The
  Supervisor treats it as a new install, so **you must pair your phone again**
  and uninstall the v2 add-on first. See MIGRATION.md.
- **Node 20 or newer is required** (Baileys 7 is ESM-only).
- The `/api/v1` endpoints require a bearer token. The five v2 endpoints stay
  unauthenticated and unchanged.

**Automations are not affected:** the integration is still `whatsapp` and all
five services keep the same names and fields.

### ✨ New

- **Sidebar panel (ingress)** showing each client's state, with pairing by QR
  code or by 8-digit code — no more scanning a picture inside a notification.
- **Authenticated `/api/v1`** with schema-validated payloads, clear error
  messages and real HTTP status codes.
- **Sends return the message id**, so delivery can be tracked.
- New `whatsapp_message_ack` event for delivery and read receipts.
- Endpoints to check a number, restart a client, log out, and fetch the QR.
- Docker `HEALTHCHECK` on `/health`, so a dead add-on is restarted.
- New options: `api_token`, `log_level`, `mark_online`, `refresh_hours`.

### 🐛 Fixed

- `/health` always reported `connected: false`, even while connected.
- The integration's address was a container IP rewritten into `whatsapp.py` at
  every start, and broke whenever Docker reassigned it. The add-on now
  publishes a stable hostname that the integration re-reads at call time.
- Failed service calls were silently ignored; they now surface in the UI.
- Only the first message of an incoming batch raised an event.
- Reconnections retried every second forever; they now back off exponentially,
  and reconnect immediately on `restartRequired` (515).
- A failed WhatsApp version lookup no longer breaks a whole reconnection.
- Errors from Baileys kept only a status code; the original message is kept.
- `connect()` ran unawaited from the constructor, producing unhandled
  rejections.

### 🧹 Internals

- Baileys pinned to `7.0.0-rc14` with a committed `package-lock.json`, so the
  build is identical on any machine. Renovate proposes updates.
- Sources reorganised under `src/`; dropped the vendored copy of Baileys 6.7.12
  and the `log4js`, `body-parser`, `events` and `qr-image` dependencies.
- Express 5, single `pino` logger, send queue per client, and a cache for
  number lookups.
- Test suite (`npm test`) covering the v2 compatibility layer, and CI that
  actually runs.

## 2.1.0

**Stable Release**

- 🚀 **Stable release** - Incorporates all connectivity fixes
- 🔒 **Robust IP replacement** - Ensures reliable communication
- 📝 **Improved logging** - Better visibility for diagnostics
- 🐛 **Bug fixes** - Resolved DNS and network resolution issues
- 📦 **Dependencies** - Updated to Baileys v7.0.0-rc.9

This is the recommended stable version for all users. It fixes the `Failed to resolve` and `NameResolutionError` issues by intelligently using the add-on's internal IP address.

## 2.0.9

**Fix & Logging Improvement**

- 🐛 **Robust IP replacement** - Replaces `HOST` variable regardless of previous value
- 📝 **Real-time logging** - Fixed empty log lines, now showing actual file content
- ✅ **Double verification** - Checks file content in both source and destination
- 🚀 **IP 172.30.33.7** - Ensuring this IP is correctly written to the custom component

This version ensures the custom component is updated correctly with the current add-on IP.

## 2.0.8

**Bug Fix Release**

- 🐛 **Fixed script crash** - Removed problematic ip addr show command
- ✅ **Script completes** - Add-on now starts successfully
- 🔍 **Using IP 172.30.33.7** - Confirmed working IP address

This fixes the script crash that prevented the add-on from starting in v2.0.7.

## 2.0.7

**Diagnostic Release**

- 🔍 **Using bashio::addon.ip_address** - Get add-on's actual IP address
- 📝 **Extensive logging** - Added detailed logs for debugging
- 🐛 **Network diagnostics** - Shows IP, hostname, network interfaces
- ✅ **Verification** - Checks custom component before and after installation

This version adds extensive logging to diagnose the connection issue. Logs will show:

- Add-on IP address
- Network configuration
- Custom component HOST value before and after update
- Installed component verification

## 2.0.6

**Critical Fix Release**

- 🐛 **Fixed DNS hostname** - Using `whatsapp-addon` (with hyphen) instead of `whatsapp_addon`
- 🔧 **Valid DNS name** - Underscores are not valid in DNS hostnames, must use hyphens
- 📚 **Based on HA docs** - Following Home Assistant's internal network naming convention

This fixes the error: `Failed to resolve 'whatsapp_addon'`

According to Home Assistant documentation, add-on slugs with underscores must be converted to hyphens for valid DNS hostnames.

## 2.0.5

**Bug Fix Release**

- 🐛 **Fixed bashio command** - Using hardcoded slug instead of bashio::addon.slug
- 🔧 **Hardcoded whatsapp_addon** - Direct value from config.yaml
- ✅ **Should work now** - No more command not found errors

This fixes the error: `bashio::addon.slug: command not found`

## 2.0.4

**Bug Fix Release**

- 🐛 **Fixed hostname using add-on slug** - Using bashio::addon.slug instead of $HOSTNAME
- 🔧 **Improved reliability** - Add-on slug is consistent across installations
- 📝 **Better logging** - Shows configured slug for debugging

This should finally fix the hostname resolution issue by using the add-on slug (whatsapp_addon) instead of the container hostname.

## 2.0.3

**Bug Fix Release**

- 🐛 **Fixed custom component hostname** - Restored {{HOSTNAME}} placeholder
- 📝 **Improved logging** - Added hostname logging in run.sh
- 🔧 **Fixed connection issue** - Custom component can now connect to add-on

This fixes the error: `Failed to resolve '0a91b8e8-whatsapp-addon'`

## 2.0.2

**Bug Fix Release**

- 🐛 **Fixed EventEmitter import** - Changed to default import for CommonJS compatibility
- 🔧 **Fixed ESM/CommonJS interop** - eventemitter2 is a CommonJS module

This fixes the error: `SyntaxError: Named export 'EventEmitter' not found`

## 2.0.1

**Bug Fix Release**

- 🐛 **Fixed Docker build** - Added custom_component to Dockerfile
- 🐛 **Fixed run.sh paths** - Corrected paths for custom component installation
- 🐛 **Fixed .dockerignore** - Removed exclusion of custom_component folder
- 📝 **Improved logging** - Added better startup messages

This fixes the issue where the add-on would fail to start with "No such file or directory" error.

## 2.0.0

**BREAKING CHANGES - Major Update to Baileys 7.0.0-rc.9**

- 🚀 **Updated to Baileys 7.0.0-rc.9** - Latest WhatsApp Web API with improved stability
- 📦 **Migrated to ESM (ES Modules)** - Modern JavaScript module system
- 🔐 **LID Support** - Full support for Linked Device Identifiers
- 🤝 **Meta Coexistence** - Compatible with Meta Business API
- ⚡ **Performance Improvements** - 80% bundle size reduction, faster message processing
- 🛡️ **Enhanced Security** - Removed automatic ACKs to reduce ban risk
- 🔧 **Better Error Handling** - Improved error messages and async/await throughout
- 📊 **Health Check Endpoint** - New `/health` endpoint for monitoring
- 🐛 **Bug Fixes** - Multiple stability and reliability improvements
- 📝 **Updated Dependencies** - All dependencies updated to latest versions

**Migration Notes:**

- This version requires re-authentication (scan QR code again)
- Session data from previous versions is not compatible
- All API endpoints remain the same for backward compatibility

## 1.5.0

- Updated whatsapp library
- Updated docker base image

## 1.4.1

- Bug QR-Code fixed

## 1.4.0

- Updated whatsapp library
- Changed session saving method
- Special functions such as sending buttons, sending lists, etc., are no longer available.

## 1.3.5

- Revert [(Pull request)](https://github.com/giuseppecastaldo/ha-addons/pull/33)

## 1.3.4

- Bug fixed [(Pull request)](https://github.com/giuseppecastaldo/ha-addons/pull/33)
- Bug fixed [(Pull request)](https://github.com/giuseppecastaldo/ha-addons/pull/55)

## 1.3.3

- Added donation button.

## 1.3.2

- Bug fixed.

## 1.3.0

- Bug fixed.

## 1.2.4

- Bug fixed.
- Added patch for receive button on iOS (Attention! iOS receive buttons only if app is open (it seems to be a iOS app bug))

## 1.2.2

- Added the ability to always be online or offline. This could lead to not receiving notifications on other devices. (**Restard required**)
- Bug fixed.

## 1.2.1

- Fixed bug that did not allow the reception of push notifications on other devices.
- Added event presence update.
- Added two more services like subscribe presence and send presence update.

## 1.2.0

- **Changed radically command and events. Please refer to doc and developer tools for change your automations.**
- **Performance boost! (Required re-authentication)**
- Bug fixed on send location.
- Bug fixed on send mulitple buttons.

## 1.1.2

- Bug fixed.
- Performance improvements.

## 1.1.1

- Migration from Home Assistant base image to Debian image

## 1.1.0

- Added the ability to manage multiple whatsapp sessions (re-authentication required)
- Buttons bug fixed (better visibility on android devices)
- Message options bug fixed
- Bug fixed.

**NOTE:** If you have problems with the custom components being updated, please follow this steps:

- Remove Whatsapp configuration in _configuration.yaml_
- Restart Home Assistant
- Add Whatsapp configuration in _configuration.yaml_
- Restart Home Assistant

## 1.0.2

- Addedd message revoke event.
- Added buttons message type (view documentation) (may not work properly on some devices)
- Added set status service (for sets the current user's status message)
- Bug fixed.

## 1.0.1

- Initial release
