"""Status of each client."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
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
        HorneroStatus(coordinator, client_id)
        for client_id in coordinator.data["clients"]
    )


class HorneroStatus(HorneroClientEntity, SensorEntity):
    """Connected, reconnecting or not paired."""

    _attr_device_class = "enum"
    _attr_options = ["connected", "reconnecting", "disconnected"]

    def __init__(self, coordinator, client_id: str) -> None:
        super().__init__(coordinator, client_id, "status")

    @property
    def native_value(self) -> str:
        client = self.client
        if client.get("connected"):
            return "connected"
        if client.get("reconnecting"):
            return "reconnecting"
        return "disconnected"

    @property
    def extra_state_attributes(self) -> dict:
        client = self.client
        return {
            "phone": client.get("phone"),
            "name": client.get("name"),
            "last_disconnect_reason": client.get("lastDisconnectReason"),
        }
