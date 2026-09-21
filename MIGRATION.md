# Migrating from v2.x to v3.0.0

v3 is installed as a **separate add-on**. Its slug changed from
`whatsapp_addon` to `ha_whatsapp`, so the Supervisor treats it as a new
install: it gets its own empty storage, and the WhatsApp session from v2 does
not carry over.

## Summary

| | v2.x | v3.0.0 |
|---|---|---|
| Add-on slug | `whatsapp_addon` | `ha_whatsapp` |
| Integration domain | `whatsapp` | `whatsapp` — unchanged |
| Service names and fields | 5 services | the same 5, unchanged |
| Pairing | QR in a persistent notification | sidebar panel: QR **or** 8-digit code |
| Session | must be re-paired | — |
| HTTP API | 5 unauthenticated endpoints | `/api/v1` with a token; old endpoints still work |
| Node | unpinned | 20+ |

**Your automations do not need any changes.** The integration domain and all
five service names and fields are identical.

## Before you start

⚠️ **Uninstall the v2 add-on first.** If both are running and signed into the
same number, they fight over the session and neither stays connected.

## Steps

1. **Settings → Add-ons → Whatsapp → Stop**, then **Uninstall**.
2. Open the **Add-on Store**, find **WhatsApp** (v3) and install it.
   If you do not see it, refresh the repository from the ⋮ menu.
3. Enable **Show in sidebar** and **Start** the add-on.
4. **Settings → System → Restart** to restart Home Assistant Core, so the
   updated integration loads.
5. Open **WhatsApp** in the sidebar and pair your phone, either by scanning the
   QR code or by requesting an 8-digit code for your number.
6. Verify with **Developer tools → Actions**:

   ```yaml
   action: whatsapp.send_message
   data:
     clientId: default
     to: "34600000000"
     body:
       text: Migrated to v3
   ```

## If you call the HTTP API directly

The v2 endpoints still exist and behave exactly as before, so nothing breaks.
Moving to `/api/v1` gets you authentication, payload validation and, for sends,
the message id in the response.

| v2 endpoint | v1 equivalent |
|---|---|
| `POST /sendMessage` | `POST /api/v1/clients/:id/messages` |
| `POST /setStatus` | `POST /api/v1/clients/:id/status` |
| `POST /presenceSubscribe` | `POST /api/v1/clients/:id/presence/subscribe` |
| `POST /sendPresenceUpdate` | `POST /api/v1/clients/:id/presence` |
| `POST /sendInfinityPresenceUpdate` | `POST /api/v1/clients/:id/presence` with `"infinity": true` |

Differences to be aware of:

- `clientId` moves from the body into the URL.
- `/api/v1` requires `Authorization: Bearer <token>`. The token is the
  `api_token` option, or the one generated on first start; both are readable in
  `/config/custom_components/whatsapp/connection.json`.
- Responses are plain JSON (`{"messageId": "..."}`) instead of
  `{"status": "OK"}`, and errors return `{"error": "..."}` with a real HTTP
  status code.

## Rolling back to v2.1.0

v2.1.0 is still tagged and released, and the `v2-maintenance` branch tracks it:

1. Uninstall the v3 add-on.
2. Add the repository at the `v2-maintenance` branch, or install from the
   [v2.1.0 release](https://github.com/pabloantonelli/ha-whatsapp/releases/tag/v2.1.0).
3. Restart Home Assistant Core and pair again.

Rolling back also requires re-pairing: the two add-ons never share storage.

## Notable fixes in v3

- `/health` reported `connected: false` even while connected. It now reports
  the real state, and the Supervisor watchdog uses it to restart a dead add-on.
- The integration's address was written into `whatsapp.py` as a fixed container
  IP, which stopped working whenever Docker reassigned it. The add-on now
  publishes a stable hostname that the integration re-reads at call time.
- Failed service calls were silently swallowed; they now surface as errors in
  the Home Assistant UI.
- Only the first message of an incoming batch raised an event; the rest were
  dropped.
- Reconnections retried every second indefinitely; they now back off
  exponentially.
