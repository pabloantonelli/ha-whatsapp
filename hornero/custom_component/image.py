"""The pairing QR code, so it can live on a dashboard."""

from __future__ import annotations

from homeassistant.components.image import ImageEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .entity import HorneroClientEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        HorneroQrCode(hass, coordinator, client_id)
        for client_id in coordinator.data["clients"]
    )


class HorneroQrCode(HorneroClientEntity, ImageEntity):
    """Shows the QR while the client is unpaired, and clears once connected."""

    def __init__(self, hass: HomeAssistant, coordinator, client_id: str) -> None:
        HorneroClientEntity.__init__(self, coordinator, client_id, "qr")
        ImageEntity.__init__(self, hass)
        self._cached: bytes | None = None
        self._cached_for: bool | None = None

    @property
    def available(self) -> bool:
        return bool(self.client.get("hasQr"))

    def _handle_coordinator_update(self) -> None:
        has_qr = bool(self.client.get("hasQr"))
        # A new code invalidates the cached image; WhatsApp rotates it often.
        if has_qr != self._cached_for:
            self._cached = None
            self._cached_for = has_qr
            self._attr_image_last_updated = dt_util.utcnow()
        super()._handle_coordinator_update()

    async def async_image(self) -> bytes | None:
        if self._cached is None:
            self._cached = await self.coordinator.api.qr_png(self._client_id)
        return self._cached
