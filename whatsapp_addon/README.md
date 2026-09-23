# Home Assistant Add-on: WhatsApp

Send and receive WhatsApp messages from Home Assistant, powered by
[Baileys](https://github.com/WhiskeySockets/Baileys).

Pair your phone from the sidebar panel — with a QR code or an 8-digit code —
then call `whatsapp.send_message` from any automation.

**New in v3:** pairing by 8-digit code, a sidebar panel with the live state of
each client, delivery and read receipts as Home Assistant events, message ids
on send, number checking, and an authenticated HTTP API. Your existing
`whatsapp.*` automations keep working unchanged.

- [Installation and usage](https://github.com/pabloantonelli/ha-whatsapp#readme)
- [What's new in v3](https://github.com/pabloantonelli/ha-whatsapp#whats-new-in-v3)
- [Service and event reference](DOCS.md)
- [Upgrading from v2.x](https://github.com/pabloantonelli/ha-whatsapp/blob/main/MIGRATION.md)

> This add-on uses an unofficial WhatsApp API. Accounts can be blocked for
> automated or unusual activity. Do not use it for bulk or unsolicited
> messaging.
