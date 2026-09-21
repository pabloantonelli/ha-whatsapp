"""WhatsApp integration for Home Assistant, backed by the WhatsApp add-on.

Copyright © 2026 Pablo Antonelli

Derived from the WhatsApp Home Assistant add-on by Giuseppe Castaldo
(https://github.com/giuseppecastaldo/ha-addons), licensed under Apache-2.0.
"""
from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.typing import ConfigType

from .whatsapp import Whatsapp, WhatsappError

DOMAIN = "whatsapp"
_LOGGER = logging.getLogger(__name__)

# Service name -> method on the client. The names and fields are unchanged from
# v2.x so existing automations keep working.
SERVICES = (
    "send_message",
    "set_status",
    "presence_subscribe",
    "send_presence_update",
    "send_infinity_presence_update",
)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    whatsapp = Whatsapp()

    def make_handler(name: str):
        method = getattr(whatsapp, name)

        async def handler(call: ServiceCall) -> None:
            try:
                await hass.async_add_executor_job(method, dict(call.data))
            except WhatsappError as err:
                # Surface the failure in the UI instead of only logging it,
                # which is what v2.x did (it ignored the response entirely).
                raise HomeAssistantError(str(err)) from err
            except KeyError as err:
                raise HomeAssistantError(f"Missing required field: {err}") from err

        return handler

    for service in SERVICES:
        hass.services.async_register(DOMAIN, service, make_handler(service))

    return True
