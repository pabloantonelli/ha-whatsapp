"""Polls the add-on for the state of each client."""

from __future__ import annotations

import logging
from datetime import timedelta

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import HorneroApi, HorneroError
from .const import DOMAIN, UPDATE_INTERVAL_SECONDS

_LOGGER = logging.getLogger(__name__)


class HorneroCoordinator(DataUpdateCoordinator):
    """Keeps `clients` and `settings` fresh for every entity."""

    def __init__(self, hass: HomeAssistant, api: HorneroApi) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
        )
        self.api = api

    async def _async_update_data(self) -> dict:
        try:
            clients = await self.api.clients()
            settings = await self.api.settings()
            allowlist = await self.api.allowlist()
        except HorneroError as err:
            raise UpdateFailed(str(err)) from err

        return {
            "clients": {client["clientId"]: client for client in clients},
            "settings": settings,
            # Drives one notify entity per allowed sender.
            "allowlist": allowlist,
        }

    def client(self, client_id: str) -> dict:
        return (self.data or {}).get("clients", {}).get(client_id, {})

    def setting(self, key: str):
        return (self.data or {}).get("settings", {}).get(key)

    @property
    def allowlist(self) -> list[dict]:
        return (self.data or {}).get("allowlist", [])
