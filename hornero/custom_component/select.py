"""Log level as a dropdown."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import HorneroError
from .const import DOMAIN
from .entity import HorneroServiceEntity

LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"]


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([HorneroLogLevel(coordinator)])


class HorneroLogLevel(HorneroServiceEntity, SelectEntity):
    """How much detail the add-on writes to its log."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_options = LEVELS

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "log_level")

    @property
    def current_option(self) -> str | None:
        return self.coordinator.setting("logLevel")

    async def async_select_option(self, option: str) -> None:
        try:
            await self.coordinator.api.update_settings({"logLevel": option})
        except HorneroError as err:
            raise HomeAssistantError(str(err)) from err
        await self.coordinator.async_request_refresh()
