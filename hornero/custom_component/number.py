"""Numeric add-on settings."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import HorneroError
from .const import DOMAIN
from .entity import HorneroServiceEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([HorneroTypingSeconds(coordinator)])


class HorneroTypingSeconds(HorneroServiceEntity, NumberEntity):
    """Upper bound of the pause before sending."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_native_min_value = 0
    _attr_native_max_value = 10
    _attr_native_step = 1
    _attr_mode = NumberMode.SLIDER
    _attr_native_unit_of_measurement = "s"

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "typing_max_seconds")

    @property
    def native_value(self) -> float | None:
        value = self.coordinator.setting("typingMaxSeconds")
        return None if value is None else float(value)

    async def async_set_native_value(self, value: float) -> None:
        try:
            await self.coordinator.api.update_settings({"typingMaxSeconds": int(value)})
        except HorneroError as err:
            raise HomeAssistantError(str(err)) from err
        await self.coordinator.async_request_refresh()
