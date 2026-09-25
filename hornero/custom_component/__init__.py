"""Hornero — WhatsApp messaging for Home Assistant, backed by the Hornero add-on."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import HorneroApi, HorneroError
from .const import CONF_BASE_URL, CONF_TOKEN, DOMAIN
from .coordinator import HorneroCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.IMAGE,
    Platform.NOTIFY,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
]


def _drop_none(payload: dict) -> dict:
    """The add-on validates strictly, so unset optional keys are removed."""
    return {key: value for key, value in payload.items() if value is not None}


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Hornero from a config entry."""
    api = HorneroApi(
        async_get_clientsession(hass),
        entry.data[CONF_BASE_URL],
        entry.data.get(CONF_TOKEN, ""),
    )

    coordinator = HorneroCoordinator(hass, api)
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    _register_services(hass, coordinator)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        hass.data[DOMAIN].pop(entry.entry_id)
        if not hass.data[DOMAIN]:
            for service in hass.services.async_services_for_domain(DOMAIN):
                hass.services.async_remove(DOMAIN, service)
    return unloaded


def _register_services(hass: HomeAssistant, coordinator: HorneroCoordinator) -> None:
    """Register the Hornero services. Failures surface in the UI."""

    api = coordinator.api

    def client_id(call: ServiceCall) -> str:
        return call.data.get("clientId") or "default"

    async def run(coro):
        try:
            return await coro
        except HorneroError as err:
            raise HomeAssistantError(str(err)) from err

    async def send_message(call: ServiceCall) -> dict:
        result = await run(
            api.send_message(
                client_id(call),
                _drop_none(
                    {
                        "to": call.data["to"],
                        "body": call.data["body"],
                        "options": call.data.get("options"),
                        "typing": call.data.get("typing"),
                    }
                ),
            )
        )
        return result or {}

    async def send_media(call: ServiceCall) -> dict:
        result = await run(
            api.send_media(
                client_id(call),
                _drop_none(
                    {
                        "to": call.data["to"],
                        "entityId": call.data["entity_id"],
                        "caption": call.data.get("caption"),
                        "duration": call.data.get("duration"),
                        "lookback": call.data.get("lookback"),
                        "typing": call.data.get("typing"),
                    }
                ),
            )
        )
        return result or {}

    async def mark_read(call: ServiceCall) -> None:
        payload = (
            {"keys": call.data["keys"]}
            if call.data.get("keys")
            else _drop_none(
                {"messageId": call.data.get("messageId"), "to": call.data.get("to")}
            )
        )
        await run(api.mark_read(client_id(call), payload))

    async def set_status(call: ServiceCall) -> None:
        await run(api.set_status(client_id(call), call.data["status"]))

    async def presence_subscribe(call: ServiceCall) -> None:
        await run(api.presence_subscribe(client_id(call), call.data["userId"]))

    async def send_presence_update(call: ServiceCall) -> None:
        await run(
            api.presence(
                client_id(call),
                _drop_none({"type": call.data["type"], "to": call.data.get("to")}),
            )
        )

    async def send_infinity_presence_update(call: ServiceCall) -> None:
        await run(
            api.presence(
                client_id(call),
                _drop_none(
                    {
                        "type": call.data["type"],
                        "to": call.data.get("to"),
                        "infinity": True,
                    }
                ),
            )
        )

    # Sending returns the message id, so a script can keep acting on it.
    hass.services.async_register(
        DOMAIN, "send_message", send_message, supports_response=SupportsResponse.OPTIONAL
    )
    hass.services.async_register(
        DOMAIN, "send_media", send_media, supports_response=SupportsResponse.OPTIONAL
    )
    hass.services.async_register(DOMAIN, "mark_read", mark_read)
    hass.services.async_register(DOMAIN, "set_status", set_status)
    hass.services.async_register(DOMAIN, "presence_subscribe", presence_subscribe)
    hass.services.async_register(DOMAIN, "send_presence_update", send_presence_update)
    hass.services.async_register(
        DOMAIN, "send_infinity_presence_update", send_infinity_presence_update
    )
