"""Notify entities, so Hornero works with any blueprint expecting a notifier.

A notify entity has no `target` field — each one is a single destination — so
there is an entity per allowed sender, named after the contact or group. They
appear and disappear as the allowlist changes.

The `hornero.send_message` action remains the way to reach a recipient that
varies, or one that is not on the allowlist.
"""

from __future__ import annotations

import logging

from homeassistant.components.notify import NotifyEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .api import HorneroError
from .const import CONF_DEFAULT_RECIPIENT, DOMAIN
from .coordinator import HorneroCoordinator
from .entity import HorneroClientEntity

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator: HorneroCoordinator = hass.data[DOMAIN][entry.entry_id]

    # One entity per client for the configured default recipient.
    entities: list[NotifyEntity] = [
        HorneroDefaultNotify(coordinator, entry, client_id)
        for client_id in coordinator.data["clients"]
    ]

    known: set[str] = set()

    @callback
    def sync_allowlist_entities() -> None:
        """Adds an entity for each newly allowed sender."""
        client_id = next(iter(coordinator.data["clients"]), None)
        if client_id is None:
            return

        new = []
        for item in coordinator.allowlist:
            jid = item.get("id")
            if not jid or jid in known:
                continue
            known.add(jid)
            new.append(HorneroContactNotify(coordinator, client_id, item))

        if new:
            async_add_entities(new)

    sync_allowlist_entities()
    entry.async_on_unload(coordinator.async_add_listener(sync_allowlist_entities))

    async_add_entities(entities)


class HorneroDefaultNotify(HorneroClientEntity, NotifyEntity):
    """Sends to the recipient set in the integration options."""

    def __init__(
        self, coordinator: HorneroCoordinator, entry: ConfigEntry, client_id: str
    ) -> None:
        super().__init__(coordinator, client_id, "notify")
        self._entry = entry

    @property
    def available(self) -> bool:
        # Availability tracks the WhatsApp session only. A missing recipient is
        # a configuration gap, and saying "unavailable" for it tells the user
        # nothing about what to fix; the error on send does.
        return bool(self.client.get("connected"))

    async def async_send_message(self, message: str, title: str | None = None) -> None:
        recipient = self._entry.options.get(CONF_DEFAULT_RECIPIENT)
        if not recipient:
            raise HomeAssistantError(
                "Hornero has no default recipient. Set one in Settings > Devices "
                "& services > Hornero > Configure, or use one of the per-contact "
                "notify entities instead."
            )

        await _send(self.coordinator, self._client_id, recipient, message, title)


class HorneroContactNotify(CoordinatorEntity[HorneroCoordinator], NotifyEntity):
    """Sends to one allowed sender, named after the contact or group."""

    _attr_has_entity_name = False

    def __init__(
        self, coordinator: HorneroCoordinator, client_id: str, item: dict
    ) -> None:
        super().__init__(coordinator)
        self._client_id = client_id
        self._jid = item["id"]
        # Falls back to the raw id when WhatsApp has not synced a name yet.
        self._attr_name = item.get("name") or self._jid.split("@")[0]
        self._attr_unique_id = f"{DOMAIN}_{client_id}_notify_{self._jid}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, client_id)},
            name=f"Hornero {client_id}",
            manufacturer="Hornero",
            model="WhatsApp client",
        )

    @property
    def available(self) -> bool:
        client = self.coordinator.client(self._client_id)
        allowed = any(item.get("id") == self._jid for item in self.coordinator.allowlist)
        return bool(client.get("connected")) and allowed

    def _handle_coordinator_update(self) -> None:
        # Pick up a name that WhatsApp synced after the entity was created.
        for item in self.coordinator.allowlist:
            if item.get("id") == self._jid and item.get("name"):
                self._attr_name = item["name"]
                break
        super()._handle_coordinator_update()

    async def async_send_message(self, message: str, title: str | None = None) -> None:
        await _send(self.coordinator, self._client_id, self._jid, message, title)


async def _send(
    coordinator: HorneroCoordinator,
    client_id: str,
    recipient: str,
    message: str,
    title: str | None,
) -> None:
    text = f"*{title}*\n{message}" if title else message
    try:
        await coordinator.api.send_message(
            client_id, {"to": recipient, "body": {"text": text}}
        )
    except HorneroError as err:
        raise HomeAssistantError(str(err)) from err
