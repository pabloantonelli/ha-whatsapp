"""Shared entity base classes."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import HorneroCoordinator


class HorneroClientEntity(CoordinatorEntity[HorneroCoordinator]):
    """An entity belonging to one paired client, shown as its own device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: HorneroCoordinator, client_id: str, key: str) -> None:
        super().__init__(coordinator)
        self._client_id = client_id
        self._attr_unique_id = f"{DOMAIN}_{client_id}_{key}"
        self._attr_translation_key = key
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, client_id)},
            name=f"Hornero {client_id}",
            manufacturer="Hornero",
            model="WhatsApp client",
        )

    @property
    def client(self) -> dict:
        return self.coordinator.client(self._client_id)


class HorneroServiceEntity(CoordinatorEntity[HorneroCoordinator]):
    """An entity for an add-on-wide setting, not tied to one client."""

    _attr_has_entity_name = True
    _attr_entity_category = None

    def __init__(self, coordinator: HorneroCoordinator, key: str) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{key}"
        self._attr_translation_key = key
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, "addon")},
            name="Hornero",
            manufacturer="Hornero",
            model="Add-on",
        )
