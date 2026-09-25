"""Add-on settings exposed as switches."""

from __future__ import annotations

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import HorneroError
from .const import DOMAIN
from .entity import HorneroServiceEntity

# Home Assistant key -> add-on setting name.
SWITCHES = {
    "typing_indicator": "typingIndicator",
    "mark_read": "markRead",
    "mark_online": "markOnline",
}


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        HorneroSettingSwitch(coordinator, key, setting)
        for key, setting in SWITCHES.items()
    )


class HorneroSettingSwitch(HorneroServiceEntity, SwitchEntity):
    """A boolean setting, stored by the add-on."""

    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator, key: str, setting: str) -> None:
        super().__init__(coordinator, key)
        self._setting = setting

    @property
    def is_on(self) -> bool:
        return bool(self.coordinator.setting(self._setting))

    async def _set(self, value: bool) -> None:
        try:
            await self.coordinator.api.update_settings({self._setting: value})
        except HorneroError as err:
            raise HomeAssistantError(str(err)) from err
        await self.coordinator.async_request_refresh()

    async def async_turn_on(self, **kwargs) -> None:
        await self._set(True)

    async def async_turn_off(self, **kwargs) -> None:
        await self._set(False)
