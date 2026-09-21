"""HTTP client for the WhatsApp add-on.

Copyright © 2026 Pablo Antonelli

Derived from the WhatsApp Home Assistant add-on by Giuseppe Castaldo
(https://github.com/giuseppecastaldo/ha-addons), licensed under Apache-2.0.
"""
from __future__ import annotations

import json
import logging
import os
import time

import requests

_LOGGER = logging.getLogger(__name__)

# Written by the add-on on every start. Reading it at call time (instead of
# hardcoding an address into this file) means a new container IP or a rotated
# token is picked up without reinstalling the component.
CONNECTION_FILE = os.path.join(os.path.dirname(__file__), "connection.json")

CACHE_SECONDS = 30
TIMEOUT = 30


class WhatsappError(Exception):
    """Raised when the add-on cannot be reached or rejects a request."""


class Whatsapp:
    def __init__(self) -> None:
        self._connection: dict | None = None
        self._loaded_at: float = 0.0

    def _load_connection(self) -> dict:
        now = time.monotonic()
        if self._connection and now - self._loaded_at < CACHE_SECONDS:
            return self._connection

        try:
            with open(CONNECTION_FILE, encoding="utf-8") as handle:
                connection = json.load(handle)
        except FileNotFoundError as err:
            raise WhatsappError(
                "The WhatsApp add-on has not published its address yet. "
                "Make sure the add-on is running, then try again."
            ) from err
        except (OSError, ValueError) as err:
            raise WhatsappError(f"Could not read {CONNECTION_FILE}: {err}") from err

        if not connection.get("base_url"):
            raise WhatsappError("The add-on connection file has no base_url.")

        self._connection = connection
        self._loaded_at = now
        return connection

    def _post(self, endpoint: str, data: dict) -> dict:
        # The add-on validates payloads strictly, so drop unset optional keys
        # instead of sending them as null.
        data = {key: value for key, value in data.items() if value is not None}
        connection = self._load_connection()
        url = f"{connection['base_url'].rstrip('/')}/api/v1{endpoint}"
        headers = {}
        if token := connection.get("token"):
            headers["Authorization"] = f"Bearer {token}"

        try:
            response = requests.post(url, json=data, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as err:
            # The address may have changed while the add-on restarted.
            self._connection = None
            raise WhatsappError(f"Could not reach the WhatsApp add-on: {err}") from err

        if response.status_code >= 400:
            try:
                detail = response.json().get("error", response.text)
            except ValueError:
                detail = response.text
            raise WhatsappError(f"WhatsApp add-on returned {response.status_code}: {detail}")

        try:
            return response.json()
        except ValueError:
            return {}

    @staticmethod
    def _client_id(data: dict) -> str:
        client_id = data.get("clientId")
        if not client_id:
            raise WhatsappError("clientId is required.")
        return client_id

    def send_message(self, data: dict) -> dict:
        client_id = self._client_id(data)
        return self._post(
            f"/clients/{client_id}/messages",
            {"to": data["to"], "body": data["body"], "options": data.get("options")},
        )

    def set_status(self, data: dict) -> dict:
        client_id = self._client_id(data)
        return self._post(f"/clients/{client_id}/status", {"status": data["status"]})

    def presence_subscribe(self, data: dict) -> dict:
        client_id = self._client_id(data)
        return self._post(
            f"/clients/{client_id}/presence/subscribe", {"userId": data["userId"]}
        )

    def send_presence_update(self, data: dict) -> dict:
        client_id = self._client_id(data)
        return self._post(
            f"/clients/{client_id}/presence",
            {"type": data["type"], "to": data.get("to")},
        )

    def send_infinity_presence_update(self, data: dict) -> dict:
        client_id = self._client_id(data)
        return self._post(
            f"/clients/{client_id}/presence",
            {"type": data["type"], "to": data.get("to"), "infinity": True},
        )
