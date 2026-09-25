"""Connection state of each client."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .entity import HorneroClientEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        HorneroConnected(coordinator, client_id)
        for client_id in coordinator.data["clients"]
    )


class HorneroConnected(HorneroClientEntity, BinarySensorEntity):
    """True while the client is paired and online.

    This is what an automation should watch to notice a dropped session,
    instead of finding out when a message never arrives.
    """

    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY

    def __init__(self, coordinator, client_id: str) -> None:
        super().__init__(coordinator, client_id, "connected")

    @property
    def is_on(self) -> bool:
        return bool(self.client.get("connected"))

    @property
    def extra_state_attributes(self) -> dict:
        client = self.client
        return {
            "phone": client.get("phone"),
            "reconnecting": client.get("reconnecting"),
            "last_connected_at": client.get("lastConnectedAt"),
        }
