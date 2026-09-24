# WhatsApp Add-on for Home Assistant

[Español](README.es.md)

Send and receive WhatsApp messages from Home Assistant. Pair your phone from a
panel in the sidebar, then call `whatsapp.send_message` from any automation.

## What it does

- Sends text, images, audio, video, documents, locations and reactions to
  contacts and groups.
- Fires a Home Assistant event for every incoming message, presence change and
  delivery receipt, so automations can react to them.
- Runs several WhatsApp accounts side by side, each paired separately.
- Pairs from a panel in the sidebar, with a QR code or an 8-digit code.

## What's new in v3

If you are coming from v2.x, these are the things you could not do before.

### Pairing and visibility

- **Pair with an 8-digit code.** Type your number in the sidebar panel and enter
  the code in **WhatsApp → Linked devices → Link with phone number** — useful
  when scanning a QR from a screen is awkward.
- **See what is going on.** The panel lists every client with its live state,
  the paired number and the time it connected. Previously the only signal was
  a QR image inside a notification.
- **Restart or log a client out** from the panel, without restarting the add-on.

### Automations you can now build

- **React to delivery and read receipts.** The new `whatsapp_message_ack` event
  fires with the message id and its status:

  ```yaml
  automation:
    - alias: Warn me if the alert was never delivered
      triggers:
        - trigger: event
          event_type: whatsapp_message_ack
      conditions:
        - condition: template
          value_template: "{{ trigger.event.data.status == 'ERROR' }}"
      actions:
        - action: persistent_notification.create
          data:
            message: "WhatsApp message {{ trigger.event.data.messageId }} failed"
  ```

- **Alert when WhatsApp disconnects.** `/health` now reports the real connection
  state, so you can watch it with a REST sensor and get told when the session
  drops instead of finding out because a message never arrived:

  ```yaml
  binary_sensor:
    - platform: rest
      name: WhatsApp connected
      resource: http://<addon-hostname>:3000/health
      value_template: "{{ value_json.clients.default.connected }}"
      device_class: connectivity
  ```

- **Check a number before messaging it**, so an automation can fall back to
  another channel when the contact is not on WhatsApp:

  ```bash
  curl -H "Authorization: Bearer <token>" \
    http://<addon>:3000/api/v1/clients/default/check/34600000000
  # {"jid":"34600000000@s.whatsapp.net","exists":true}
  ```

- **Track a specific message.** Sending through `/api/v1` returns the message
  id, which pairs with the ack event to follow one message end to end.

### Reliability and safety

- **Failures are visible.** A failed service call now raises an error in the
  Home Assistant UI. In v2.x the response was discarded, so a message that was
  never sent looked identical to one that was.
- **No more silently dropped messages.** Only the first message of an incoming
  batch used to raise an event; now every one does.
- **The API requires a token.** Anyone on your network could previously send
  messages from your account by POSTing to port 3000.
- **Reconnections back off** instead of retrying every second forever, and the
  add-on restarts itself if it becomes unhealthy.

### New options

`log_level` to raise detail while debugging, `mark_online` to control whether
the account shows as online, `refresh_hours` for a periodic reconnect, and
`api_token` to set the API token yourself.

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

## The WhatsApp panel

The sidebar panel has three tabs:

- **Status** — every client with its live connection state, the paired number,
  and pairing by QR code or 8-digit code. Restart or log a client out from here.
- **Groups & contacts** — your chats with profile pictures and a search box.
  Copy a group's ID straight into the `to` field of a service call; group JIDs
  cannot be derived from a phone number, so this is the practical way to get
  them.
- **Snippet builder** — pick an action, fill in the fields, and copy the call
  out in the form you need.
- **Incoming** — which senders may trigger your automations.
- **Help** — the services, events and addressing rules, close at hand.

### Snippet builder

It writes the same call three ways, with this install's real URL and token
already filled in:

- **Home Assistant** — YAML to paste into an automation or script in YAML mode.
- **Node-RED** — the method, URL, headers and payload for an `http request`
  node.
- **curl** — to try it from a terminal before wiring it up.

It covers text messages, camera snapshots and clips, images and audio from a
URL, locations, presence updates and the profile status, plus listeners for the
three events the add-on fires.

## Sending camera snapshots and clips

`whatsapp.send_media` captures straight from a `camera.*` or `image.*` entity,
so there is no need to save a file or expose a URL first.

```yaml
action: whatsapp.send_media
data:
  clientId: default
  to: "34600000000"
  entity_id: camera.front_door
  caption: Someone is at the door
```

To send a video instead, add `duration`. With `lookback` the clip also includes
footage recorded _before_ the automation fired — usually the part worth seeing,
since by the time a doorbell triggers, the interesting moment has passed:

```yaml
automation:
  - alias: Doorbell clip
    triggers:
      - trigger: state
        entity_id: binary_sensor.doorbell
        to: "on"
    actions:
      - action: whatsapp.send_media
        data:
          clientId: default
          to: "34600000000"
          entity_id: camera.front_door
          duration: 10
          lookback: 5
          caption: Doorbell
```

Recording requires a camera with the `stream` component (RTSP and similar);
cameras that only expose a still image can send snapshots but not clips, and
`lookback` only works when the stream is preloaded.

## Typing indicator

Before sending, the add-on shows the "typing…" indicator — "recording…" for
voice notes — and waits a moment that varies with the length of the message, up
to 3 seconds by default.

The visible indicator mostly makes the conversation look natural to whoever
receives it. The part that matters more is the pause: it stops consecutive
messages from landing as an instant, evenly spaced burst, which is the kind of
pattern that gets accounts flagged as automated. It is not a guarantee against
being blocked — volume and unsolicited messages weigh far more.

Photos and videos get the indicator but no added pause, since the upload
already takes a variable while.

Tune it in the add-on options:

```yaml
typing_indicator: true # false disables it entirely
typing_max_seconds: 3 # upper bound for the pause; 0 sends immediately
```

**For urgent alerts, switch it off per call** so a doorbell or a water leak is
not held back for a couple of seconds:

```yaml
action: whatsapp.send_message
data:
  clientId: default
  to: "34600000000"
  body:
    text: Water leak detected
  typing: false
```

## Configuration

```yaml
clients:
  - default # one entry per WhatsApp account
api_token: "" # generated automatically when empty
log_level: info # trace | debug | info | warn | error | fatal
mark_online: false # appear online while connected
refresh_hours: 0 # force a reconnect every N hours (0 = off)
typing_indicator: true # show "typing…" and pause before sending
typing_max_seconds: 3 # upper bound for that pause (0 = send immediately)
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

## Who can trigger your automations

Incoming messages are sent to Home Assistant as `new_whatsapp_message` events,
and automations act on them. **While no sender is listed, anyone who writes to
your number can trigger them** — which matters if an automation of yours does
something based on the message text.

Open the **Incoming** tab of the panel and add the senders you accept. Each
chat in the **Groups & contacts** tab also has an **Allow** button. List a group
to accept everything posted in it, or a person to accept them anywhere, groups
included.

Identifiers are the tricky part. When you send, you use a phone number. When a
message arrives, WhatsApp increasingly identifies the sender by a **LID** — an
id like `173478124720340@lid` that deliberately does not reveal their number.

You do not have to work that out: **the Incoming tab lists whoever wrote
recently, with an Allow button**. Allowing a phone number also covers that
person's LID, and the other way round, because both forms of the same identity
are matched.

You can also seed the list from the add-on options, which is handy for a fresh
install:

```yaml
allowed_senders:
  - "34600000000"
  - 120363000000000000@g.us
```

The option only seeds the list on first start; after that the panel is the
source of truth, so editing it does not need an add-on restart.

## Node-RED

You do not need the HTTP API or a token: the add-on registers normal Home
Assistant services and events, so Node-RED talks to it over its websocket
connection like any other integration.

**To send**, use a **call service** node with `whatsapp` as the domain and
`send_message` or `send_media` as the service. If `send_media` does not appear
in the list, restart Home Assistant Core and reload the Node-RED tab — the
service list is cached.

**To receive**, use an **events: all** node and set the event type to
`new_whatsapp_message`, `whatsapp_message_ack` or `whatsapp_presence_update`.
The event data arrives in `msg.payload`.

The **Snippet builder** tab in the WhatsApp panel writes both nodes out as JSON:
copy it, press `Ctrl+I` in Node-RED and paste to import the configured node.

Use the HTTP API only when calling the add-on from outside Home Assistant.

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
| `GET`  | `/api/v1/clients/:id/chats`              | List groups and contacts with their IDs                   |
| `GET`  | `/api/v1/allowlist`                      | Senders allowed to trigger events                         |
| `PUT`  | `/api/v1/allowlist`                      | Replace that list                                         |
| `GET`  | `/api/v1/clients/:id/avatar/:jid`        | Profile picture of a chat                                 |
| `POST` | `/api/v1/clients/:id/media`              | Send a camera snapshot or clip                            |
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
