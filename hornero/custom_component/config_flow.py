"""Config flow for Hornero.

The add-on announces itself to the Supervisor, so in the usual case Home
Assistant offers to set it up on its own. The manual step is a fallback, and
even then it fills itself in from the connection file the add-on writes.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import HorneroApi, HorneroError
from .const import (
    CONF_BASE_URL,
    CONF_DEFAULT_RECIPIENT,
    CONF_TOKEN,
    CONNECTION_FILE,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)


def _read_connection_file() -> dict:
    """Base URL and token the add-on publishes on every start."""
    try:
        return json.loads(Path(CONNECTION_FILE).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


class HorneroConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the setup dialog."""

    VERSION = 1

    @staticmethod
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return HorneroOptionsFlow()

    def __init__(self) -> None:
        self._discovered: dict[str, Any] = {}

    async def _validate(self, base_url: str, token: str) -> str | None:
        """Returns an error key, or None when the add-on answers."""
        api = HorneroApi(async_get_clientsession(self.hass), base_url, token)
        try:
            await api.health()
        except HorneroError as err:
            _LOGGER.debug("cannot reach %s: %s", base_url, err)
            return "cannot_connect"
        return None

    async def async_step_hassio(self, discovery_info) -> ConfigFlowResult:
        """The add-on told the Supervisor it is running."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        config = discovery_info.config or {}
        self._discovered = {
            CONF_BASE_URL: config.get("base_url") or _read_connection_file().get("base_url"),
            CONF_TOKEN: config.get("token") or _read_connection_file().get("token"),
        }
        self.context["title_placeholders"] = {"name": "Hornero"}
        return await self.async_step_confirm()

    async def async_step_confirm(self, user_input=None) -> ConfigFlowResult:
        """One click to accept the discovered add-on."""
        if user_input is not None:
            error = await self._validate(
                self._discovered[CONF_BASE_URL], self._discovered[CONF_TOKEN]
            )
            if error:
                return self.async_abort(reason=error)
            return self.async_create_entry(title="Hornero", data=self._discovered)

        return self.async_show_form(step_id="confirm")

    async def async_step_user(self, user_input=None) -> ConfigFlowResult:
        """Manual setup, pre-filled from the connection file when present."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        errors: dict[str, str] = {}

        if user_input is not None:
            error = await self._validate(user_input[CONF_BASE_URL], user_input.get(CONF_TOKEN, ""))
            if error:
                errors["base"] = error
            else:
                return self.async_create_entry(title="Hornero", data=user_input)

        stored = await self.hass.async_add_executor_job(_read_connection_file)
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_BASE_URL,
                    default=(user_input or stored).get(CONF_BASE_URL, "http://localhost:3000"),
                ): str,
                vol.Optional(
                    CONF_TOKEN, default=(user_input or stored).get(CONF_TOKEN, "")
                ): str,
            }
        )

        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)


class HorneroOptionsFlow(OptionsFlow):
    """Options: the recipient the notify entity sends to."""

    async def async_step_init(self, user_input=None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_DEFAULT_RECIPIENT,
                    default=self.config_entry.options.get(CONF_DEFAULT_RECIPIENT, ""),
                ): str
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
