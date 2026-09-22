# WhatsApp Add-on for Home Assistant

[Español](README.es.md)

Send and receive WhatsApp messages from Home Assistant. Pair your phone from a
panel in the sidebar, then call `whatsapp.send_message` from any automation.

> **Based on the work of [Giuseppe Castaldo](https://github.com/giuseppecastaldo/ha-addons).**
> This project started as a fork of his WhatsApp add-on and would not exist
> without it. It is now maintained independently, under the same Apache-2.0
> license. See [NOTICE](NOTICE) for the full attribution.

---

## What it does

- Sends text, images, audio, video, documents, locations and reactions to
  contacts and groups.
- Fires a Home Assistant event for every incoming message, presence change and
  delivery receipt, so automations can react to them.
- Runs several WhatsApp accounts side by side, each paired separately.
- Pairs from a panel in the sidebar, with a QR code or an 8-digit code.

## Requirements

- Home Assistant OS or Supervised (this is an add-on; Container and Core
  installations cannot run it).
- Architectures: `aarch64`, `amd64`, `armhf`, `armv7`, `i386`.
- A phone with WhatsApp installed, to pair the account.

> **This add-on uses an unofficial WhatsApp API.** WhatsApp does not support
> this kind of client and accounts can be blocked for automated or unusual
> activity. Do not use it for bulk or unsolicited messaging. Read
> [LEGAL.md](LEGAL.md) before installing.

## Installation

1. **Add the repository.** In Home Assistant go to **Settings → Add-ons →
   Add-on Store**, open the ⋮ menu, choose **Repositories** and add:

   ```text
   https://github.com/pabloantonelli/ha-whatsapp
   ```

2. **Install.** Find **WhatsApp** in the store and click **Install**.

3. **Start it.** Turn on **Show in sidebar**, then click **Start**.

4. **Restart Home Assistant Core** (**Settings → System → Restart**). This is
   needed once, the first time, so the `whatsapp` integration the add-on
   installs gets loaded.

5. **Pair your phone.** Open **WhatsApp** in the sidebar and either:
   - scan the QR code with **WhatsApp → Linked devices → Link a device**, or
   - type your number and press **Get code**, then enter the 8 digits in
     **WhatsApp → Linked devices → Link with phone number**.

   The panel shows _Connected_ once pairing succeeds.

6. **Send a test message.** In **Developer tools → Actions**, run:

   ```yaml
   action: whatsapp.send_message
   data:
     clientId: default
     to: "34600000000"
     body:
       text: Hello from Home Assistant
   ```

Full service and event reference: [whatsapp_addon/DOCS.md](whatsapp_addon/DOCS.md).

## Configuration

```yaml
clients:
  - default # one entry per WhatsApp account
api_token: "" # generated automatically when empty
log_level: info # trace | debug | info | warn | error | fatal
mark_online: false # appear online while connected
refresh_hours: 0 # force a reconnect every N hours (0 = off)
```

Every extra name in `clients` is a separate account to pair, addressed by that
name in the `clientId` field of each service call.

## Upgrading from v2.x

**v3.0.0 is installed as a separate add-on.** Its slug changed from
`whatsapp_addon` to `ha_whatsapp`, so the Supervisor treats it as a new
install with empty storage.

**What this means for you**

- ⚠️ **You have to pair your phone again.** The v2 session is not carried over.
- ⚠️ **Uninstall the old add-on first.** Two add-ons signed into the same
  number will fight over the session and neither will stay connected.
- ✅ **Your automations keep working, unchanged.** The integration is still
  `whatsapp`, and all five services keep the same names and fields.

**Steps**

1. Stop and uninstall the old **Whatsapp** add-on.
2. Install **WhatsApp** v3 as described above.
3. Restart Home Assistant Core.
4. Pair your phone from the sidebar panel.

Step-by-step details, the endpoint mapping and how to roll back:
[MIGRATION.md](MIGRATION.md).

## HTTP API

The add-on serves an HTTP API on port 3000, used by the integration and
available to any other client on your network.

All `/api/v1` routes require a bearer token — the `api_token` option, or the
one generated on first start (readable in `/config/custom_components/whatsapp/connection.json`):

```bash
curl -X POST http://<addon>:3000/api/v1/clients/default/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"34600000000","body":{"text":"Hello"}}'
```

| Method | Route                                    | Purpose                                                   |
| ------ | ---------------------------------------- | --------------------------------------------------------- |
| `GET`  | `/health`                                | Version and per-client connection state (no token needed) |
| `GET`  | `/api/v1/clients`                        | List clients and their state                              |
| `GET`  | `/api/v1/clients/:id`                    | One client's state                                        |
| `POST` | `/api/v1/clients/:id/messages`           | Send a message; returns its `messageId`                   |
| `GET`  | `/api/v1/clients/:id/qr`                 | Current QR code (`?format=png` for an image)              |
| `POST` | `/api/v1/clients/:id/pairing-code`       | Request an 8-digit pairing code                           |
| `GET`  | `/api/v1/clients/:id/check/:phone`       | Check whether a number is on WhatsApp                     |
| `POST` | `/api/v1/clients/:id/status`             | Set the profile status text                               |
| `POST` | `/api/v1/clients/:id/presence`           | Send a presence update                                    |
| `POST` | `/api/v1/clients/:id/presence/subscribe` | Subscribe to a contact's presence                         |
| `POST` | `/api/v1/clients/:id/restart`            | Reconnect the client                                      |
| `POST` | `/api/v1/clients/:id/logout`             | Drop the session and pair again                           |

The v2 endpoints (`/sendMessage`, `/setStatus`, `/presenceSubscribe`,
`/sendPresenceUpdate`, `/sendInfinityPresenceUpdate`) still work, with the same
request and response shape as before, so existing scripts keep running.

## Events

| Event                      | Fired when                            |
| -------------------------- | ------------------------------------- |
| `new_whatsapp_message`     | A message arrives                     |
| `whatsapp_presence_update` | A subscribed contact changes presence |
| `whatsapp_message_ack`     | A sent message is delivered or read   |

## Troubleshooting

**The QR code never appears.** Open the sidebar panel — it renders the QR
directly. If it stays on _Waiting for a QR code_, check the add-on log for
connection errors and make sure the host can reach `web.whatsapp.com`.

**`Client not found`.** The `clientId` in your service call must match a name
in the `clients` option. The default is `default`.

**The integration cannot reach the add-on.** The add-on writes its address to
`/config/custom_components/whatsapp/connection.json` on every start, and the
integration re-reads it automatically. Make sure the add-on is running, then
retry. (v2.x wrote a fixed IP into the Python source, which broke whenever
Docker reassigned it; that is no longer the case.)

**Services are missing after installing.** Restart Home Assistant Core once so
the `whatsapp` integration is loaded.

## Development

```bash
cd whatsapp_addon
npm ci
npm test
```

The build is pinned by `package-lock.json` and runs on Node 20+, so it produces
the same result on any machine. Dependency updates arrive as Renovate pull
requests.

## Credits

- **[Giuseppe Castaldo](https://github.com/giuseppecastaldo/ha-addons)** — author
  of the original WhatsApp add-on this project is based on.
- **[WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)** — the
  WhatsApp Web library doing the heavy lifting.
- The Home Assistant community.

## License

Apache License 2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).

Not affiliated with, endorsed by, or connected to WhatsApp LLC or Meta
Platforms, Inc.
