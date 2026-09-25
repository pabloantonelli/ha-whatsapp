"""Constants for the Hornero integration."""

DOMAIN = "hornero"

CONF_BASE_URL = "base_url"
CONF_TOKEN = "token"
CONF_DEFAULT_RECIPIENT = "default_recipient"

# Written by the add-on on every start.
CONNECTION_FILE = "/config/custom_components/hornero/connection.json"

EVENT_MESSAGE = "hornero_message"
EVENT_ACK = "hornero_message_ack"
EVENT_PRESENCE = "hornero_presence"

SERVICES = (
    "send_message",
    "send_media",
    "mark_read",
    "set_status",
    "presence_subscribe",
    "send_presence_update",
    "send_infinity_presence_update",
)

# The same settings are editable from the add-on panel, so this is also how
# quickly an entity catches up with a change made there.
UPDATE_INTERVAL_SECONDS = 15
