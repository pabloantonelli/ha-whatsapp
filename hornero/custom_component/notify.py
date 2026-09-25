"""Notify entity, so Hornero works with any blueprint expecting a notifier.

A notify entity has no `target` field — each entity is one destination — so the
recipient comes from the integration options. Use the `hornero.send_message`
service when the recipient varies.
"""

from __future__ import annotations

from homeassistant.components.notify import NotifyEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import HorneroError
from .const import CONF_DEFAULT_RECIPIENT, DOMAIN
from .entity import HorneroClientEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        HorneroNotify(coordinator, entry, client_id)
        for client_id in coordinator.data["clients"]
    )


class HorneroNotify(HorneroClientEntity, NotifyEntity):
    """Sends a text message to the configured default recipient."""

    def __init__(self, coordinator, entry: ConfigEntry, client_id: str) -> None:
        super().__init__(coordinator, client_id, "notify")
        self._entry = entry

    @property
    def available(self) -> bool:
        return bool(self._entry.options.get(CONF_DEFAULT_RECIPIENT)) and bool(
            self.client.get("connected")
        )

    async def async_send_message(self, message: str, title: str | None = None) -> None:
        recipient = self._entry.options.get(CONF_DEFAULT_RECIPIENT)
        if not recipient:
            raise HomeAssistantError(
                "No default recipient set. Configure one in the Hornero "
                "integration options, or use the hornero.send_message service."
            )

        text = f"*{title}*\n{message}" if title else message

        try:
            await self.coordinator.api.send_message(
                self._client_id, {"to": recipient, "body": {"text": text}}
            )
        except HorneroError as err:
            raise HomeAssistantError(str(err)) from err
