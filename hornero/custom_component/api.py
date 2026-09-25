"""HTTP client for the Hornero add-on."""

from __future__ import annotations

import logging
from typing import Any

import aiohttp

_LOGGER = logging.getLogger(__name__)

TIMEOUT = aiohttp.ClientTimeout(total=60)


class HorneroError(Exception):
    """The add-on could not be reached, or rejected the request."""


class HorneroApi:
    """Thin async wrapper over the add-on's HTTP API."""

    def __init__(self, session: aiohttp.ClientSession, base_url: str, token: str) -> None:
        self._session = session
        self._base = base_url.rstrip("/")
        self._token = token

    @property
    def base_url(self) -> str:
        return self._base

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._token}"} if self._token else {}

    async def _request(self, method: str, path: str, payload: dict | None = None) -> Any:
        url = f"{self._base}{path}"

        try:
            async with self._session.request(
                method, url, json=payload, headers=self._headers(), timeout=TIMEOUT
            ) as response:
                if response.status >= 400:
                    detail = await self._error_detail(response)
                    raise HorneroError(f"{response.status}: {detail}")
                if response.content_type == "application/json":
                    return await response.json()
                return await response.read()
        except aiohttp.ClientError as err:
            raise HorneroError(f"cannot reach the Hornero add-on: {err}") from err

    @staticmethod
    async def _error_detail(response: aiohttp.ClientResponse) -> str:
        try:
            body = await response.json()
            return body.get("error", response.reason or "")
        except (aiohttp.ContentTypeError, ValueError):
            return response.reason or ""

    async def health(self) -> dict:
        return await self._request("GET", "/health")

    async def clients(self) -> list[dict]:
        data = await self._request("GET", "/api/v1/clients")
        return data.get("clients", [])

    async def settings(self) -> dict:
        data = await self._request("GET", "/api/v1/settings")
        return data.get("settings", {})

    async def update_settings(self, patch: dict) -> dict:
        data = await self._request("PUT", "/api/v1/settings", patch)
        return data.get("settings", {})

    async def qr_png(self, client_id: str) -> bytes | None:
        try:
            return await self._request("GET", f"/api/v1/clients/{client_id}/qr?format=png")
        except HorneroError:
            # 404 simply means the client is already paired.
            return None

    async def send_message(self, client_id: str, payload: dict) -> dict:
        return await self._request("POST", f"/api/v1/clients/{client_id}/messages", payload)

    async def send_media(self, client_id: str, payload: dict) -> dict:
        return await self._request("POST", f"/api/v1/clients/{client_id}/media", payload)

    async def mark_read(self, client_id: str, payload: dict) -> dict:
        return await self._request("POST", f"/api/v1/clients/{client_id}/read", payload)

    async def set_status(self, client_id: str, status: str) -> dict:
        return await self._request(
            "POST", f"/api/v1/clients/{client_id}/status", {"status": status}
        )

    async def presence(self, client_id: str, payload: dict) -> dict:
        return await self._request("POST", f"/api/v1/clients/{client_id}/presence", payload)

    async def presence_subscribe(self, client_id: str, user_id: str) -> dict:
        return await self._request(
            "POST",
            f"/api/v1/clients/{client_id}/presence/subscribe",
            {"userId": user_id},
        )

    async def restart(self, client_id: str) -> dict:
        return await self._request("POST", f"/api/v1/clients/{client_id}/restart")

    async def logout(self, client_id: str) -> dict:
        return await self._request("POST", f"/api/v1/clients/{client_id}/logout")
