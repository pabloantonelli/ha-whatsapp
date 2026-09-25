# Hornero — service and event reference

Service and event reference. For installation and upgrading, see the
[project README](https://github.com/pabloantonelli/hornero#readme).

## New in v3

Coming from v2.x? These capabilities did not exist before:

| Capability                                                | Where                                             |
| --------------------------------------------------------- | ------------------------------------------------- |
| Pair with an 8-digit code instead of a QR                 | Sidebar panel                                     |
| See each client's live connection state                   | Sidebar panel, `GET /health`                      |
| Restart or log out a client without restarting the add-on | Sidebar panel                                     |
| Know when a message is delivered or read                  | `hornero_message_ack` event                       |
| Get the id of the message you sent                        | `POST /api/v1/clients/:id/messages`               |
| Check whether a number is on WhatsApp                     | `GET /api/v1/clients/:id/check/:phone`            |
| Call the API from outside Home Assistant, authenticated   | `/api/v1` + bearer token                          |
| See failed service calls as errors in the UI              | Any `hornero.*` service                           |
| Send a camera snapshot without saving a file              | `hornero.send_media`                              |
| Record a clip, including the seconds before the trigger   | `hornero.send_media` with `duration` + `lookback` |
| Look up the JID of a group you are in                     | Sidebar panel, `GET /api/v1/clients/:id/chats`    |

The five services inherited from v2.x are unchanged, so existing automations
keep working as they are; `send_media` is the only new one.

## How to use

### **How to pair an account**

Open **WhatsApp** in the Home Assistant sidebar. Each configured client shows
its own card, where you can either scan the QR code or enter your phone number
to get an 8-digit pairing code (**WhatsApp → Linked devices → Link with phone
number**).

### **How to add another account**

Go to configuration page in clients input box digit the desired clientId. This one represents an identifier for the session.

Each client is paired separately from the sidebar panel.

### **How to get a User ID**

The user id is made from three parts:

- Country code (Example 39 (Italy))
- User's number
- And a static part: @s.whatsapp.net (for users) @g.us (for groups)

For example for Italian number _3456789010_ the user id is the following _393456789010@s.whatsapp.net_

### **Send a simple text message**

```yaml
action: hornero.send_message
data:
  clientId: default
  to: 391234567890@s.whatsapp.net # User ID
  body:
    text: Hi it's a simple text message
```

### **How to send an image**

```yaml
action: hornero.send_message
data:
  clientId: default
  to: 391234567890@s.whatsapp.net
  body:
    image:
      url: "https://dummyimage.com/600x400/000/fff.png"
    caption: Simple text
```

### **How to send a camera snapshot or clip**

Captures directly from a `camera.*` or `image.*` entity — no file to save, no
URL to expose.

```yaml
action: hornero.send_media
data:
  clientId: default
  to: 391234567890@s.whatsapp.net
  entity_id: camera.front_door
  caption: Someone is at the door
```

Add `duration` to record a clip instead, and `lookback` to include the seconds
recorded before the call:

```yaml
action: hornero.send_media
data:
  clientId: default
  to: 391234567890@s.whatsapp.net
  entity_id: camera.front_door
  duration: 10
  lookback: 5
```

Clips need a camera with the `stream` component; still-image cameras can send
snapshots only.

### **How to send audio message**

```yaml
action: hornero.send_message
data:
  clientId: default
  to: 391234567890@s.whatsapp.net
  body:
    audio:
      url: "https://github.com/giuseppecastaldo/ha-addons/blob/main/whatsapp_addon/examples/hello_world.mp3?raw=true"
    ptt: true # Send audio as a voice
```

### **How to send a location**

```yaml
action: hornero.send_message
data:
  clientId: default
  to: 391234567890@s.whatsapp.net
  body:
    location:
      degreesLatitude: 24.121231
      degreesLongitude: 55.1121221
```

### **How to subscribe to presence update**

```yaml
action: hornero.presence_subscribe
data:
  clientId: default
  userId: 391234567890@s.whatsapp.net
```

---

## Events

| Event type          | Description                              |
| ------------------- | ---------------------------------------- |
| hornero_message     | The message that was received            |
| hornero_presence    | Presence of contact in a chat updated    |
| hornero_message_ack | A message you sent was delivered or read |

Every event carries the `clientId` it came from.

### hornero_message_ack

```yaml
automation:
  - triggers:
      - trigger: event
        event_type: hornero_message_ack
    actions:
      - action: system_log.write
        data:
          message: "Message {{ trigger.event.data.messageId }} status {{ trigger.event.data.status }}"
```

---

## **Sample automations**

## Ping Pong

```yaml
- alias: Ping Pong
  description: ""
  trigger:
    - platform: event
      event_type: hornero_message
  condition:
    - condition: template
      value_template: "{{ trigger.event.data.message.conversation == '!ping' }}"
  action:
    - action: hornero.send_message
      data:
        clientId: default
        to: "{{ trigger.event.data.key.remoteJid }}"
        body:
          text: pong
  mode: single
```

## Arrive at home

```yaml
- alias: Arrive at home
  description: ""
  trigger:
    - platform: device
      domain: device_tracker
      entity_id: device_tracker.iphone_13_pro
      type: enter
      zone: zone.home
  condition: []
  action:
    - action: hornero.send_message
      data:
        clientId: default
        to: 391234567890@s.whatsapp.net
        body:
          text: Hi, I'm at home
  mode: single
```

## Driving mode

```yaml
- alias: Driving mode
  description: ""
  trigger:
    - platform: event
      event_type: hornero_message
  condition: []
  action:
    - action: hornero.send_message
      data:
        clientId: "{{ trigger.event.data.clientId }}" # Which instance of whatsapp should the message come from
        to: "{{ trigger.event.data.key.remoteJid }}"
        body:
          text: Sorry, I'm driving, I will contact you soon
        options:
          quoted: "{{ trigger.event.data }}" # Quote message
  mode: single
```

## Message reaction

```yaml
- alias: React to message
  description: ""
  trigger:
    - platform: event
      event_type: hornero_message
  condition: []
  action:
    - action: hornero.send_message
      data:
        clientId: "{{ trigger.event.data.clientId }}"
        to: "{{ trigger.event.data.key.remoteJid }}"
        body:
          react:
            text: "👍🏻" # Use an empty string to remove the reaction
            key: "{{ trigger.event.data.key }}"
  mode: single
```

## Presence notify (SUBSCRIBE FIRST!)

```yaml
- alias: Nuova automazione
  description: ""
  trigger:
    - platform: event
      event_type: hornero_presence
      event_data: {}
  condition:
    - condition: template
      value_template:
        "{{ trigger.event.data.presences['391234567890@s.whatsapp.net'].lastKnownPresence
        == 'available' }}"
  action:
    - service: persistent_notification.create
      data:
        message: Contact is online!
  mode: single
```
