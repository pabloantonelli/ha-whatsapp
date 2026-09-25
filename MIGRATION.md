# Migrating to Hornero v4

Version 4 is the same project under a new name. The add-on is no longer called
"WhatsApp": it is **Hornero**, with its own slug, integration domain and
service names.

**There is no compatibility layer.** The old `whatsapp.*` services and
`new_whatsapp_message` events are gone, so automations need editing. The rename
is mechanical and the tables below cover it.

## Summary

|                    | v3 (`ha_whatsapp`)    | v4 (`hornero`)                                        |
| ------------------ | --------------------- | ----------------------------------------------------- |
| Add-on slug        | `ha_whatsapp`         | `hornero`                                             |
| Integration domain | `whatsapp`            | `hornero`                                             |
| Setup              | installed silently    | added from Devices & services                         |
| Entities           | none                  | a device per client, with sensors and buttons         |
| Image              | built on your machine | prebuilt, downloaded                                  |
| Languages          | English               | English, Spanish, Portuguese, German, French, Italian |
| Session            | must be paired again  | —                                                     |

## Before you start

⚠️ **Uninstall the v3 add-on first.** Two add-ons signed into the same number
fight over the session and neither stays connected.

⚠️ **You will pair your phone again.** The Supervisor treats a new slug as a
new install, so `/data` starts empty.

## Steps

1. Note your current settings (clients, allowed senders) — they do not carry
   over.
2. **Settings → Add-ons → WhatsApp → Stop**, then **Uninstall**.
3. In the **Add-on Store**, refresh the repository from the ⋮ menu, then
   install **Hornero**.
4. Enable **Show in sidebar** and **Start** it.
5. **Settings → System → Restart** to restart Home Assistant Core.
6. Accept the discovered **Hornero** integration, or add it from **Settings →
   Devices & services**.
7. Pair your phone from the sidebar panel.
8. Update your automations using the tables below.

## Renaming your automations

### Services

| v3                                       | v4                                      |
| ---------------------------------------- | --------------------------------------- |
| `whatsapp.send_message`                  | `hornero.send_message`                  |
| `whatsapp.send_media`                    | `hornero.send_media`                    |
| `whatsapp.mark_read`                     | `hornero.mark_read`                     |
| `whatsapp.set_status`                    | `hornero.set_status`                    |
| `whatsapp.presence_subscribe`            | `hornero.presence_subscribe`            |
| `whatsapp.send_presence_update`          | `hornero.send_presence_update`          |
| `whatsapp.send_infinity_presence_update` | `hornero.send_infinity_presence_update` |

The fields are unchanged, so only the prefix moves.

### Events

| v3                         | v4                    |
| -------------------------- | --------------------- |
| `new_whatsapp_message`     | `hornero_message`     |
| `whatsapp_message_ack`     | `hornero_message_ack` |
| `whatsapp_presence_update` | `hornero_presence`    |

### HTTP endpoints

The `/api/v1` routes are unchanged. The pre-3.0 endpoints (`/sendMessage` and
friends), which v3 still accepted, have been removed.

## What you gain

- **Entities.** A `binary_sensor` for the connection, the pairing QR as an
  `image` you can put on a dashboard, buttons to restart or unpair, and the
  add-on settings as switches.
- **Blueprints.** Three ready-made automations, importable with one click from
  the README — including one that warns you when the session drops.
- **A prebuilt image.** Installing no longer compiles anything on your machine,
  which on a Raspberry Pi is minutes saved and a common failure avoided.
- **Six languages** across the add-on options, the services and the panel.

## Rolling back

v3 remains tagged and released. Install it from the
[v3.5.0 release](https://github.com/pabloantonelli/hornero/releases/tag/v3.5.0),
restart Home Assistant Core and pair again. Rolling back also means
re-pairing: the two add-ons never share storage.
