"""Restart and log out, from the Home Assistant interface."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import HorneroError
from .const import DOMAIN
from .entity import HorneroClientEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = hass.data[DOMAIN][entry.entry_id]
    entities = []
    for client_id in coordinator.data["clients"]:
        entities.append(HorneroButton(coordinator, client_id, "restart"))
        entities.append(HorneroButton(coordinator, client_id, "logout"))
    async_add_entities(entities)


class HorneroButton(HorneroClientEntity, ButtonEntity):
    """Triggers one add-on action for this client."""

    def __init__(self, coordinator, client_id: str, action: str) -> None:
        super().__init__(coordinator, client_id, action)
        self._action = action

    async def async_press(self) -> None:
        call = getattr(self.coordinator.api, self._action)
        try:
            await call(self._client_id)
        except HorneroError as err:
            raise HomeAssistantError(str(err)) from err
        await self.coordinator.async_request_refresh()
