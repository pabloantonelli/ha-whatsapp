/**
 * Copyright © 2026 Pablo Antonelli
 * Licensed under the Apache License, Version 2.0. See the LICENSE file.
 */
import axios from "axios";
import QRCode from "qrcode";

const SUPERVISOR = "http://supervisor/core/api";

/**
 * Thin wrapper over the Supervisor proxy to the Home Assistant core API.
 * Every call is best-effort: a failure here must never take down the add-on.
 */
export class HomeAssistant {
  #logger;
  #http;

  constructor(logger) {
    this.#logger = logger;
    this.#http = axios.create({
      baseURL: SUPERVISOR,
      timeout: 10000,
      headers: { Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}` },
    });
  }

  async #post(url, body, description) {
    try {
      await this.#http.post(url, body);
    } catch (err) {
      this.#logger.error({ err: err.message }, `failed to ${description}`);
    }
  }

  fireEvent(event, data) {
    return this.#post(`/events/${event}`, data, `fire event ${event}`);
  }

  async notifyQr(clientId, qr) {
    const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 512 });
    return this.#post(
      "/services/persistent_notification/create",
      {
        title: `WhatsApp QR code (${clientId})`,
        message:
          `Scan this code with WhatsApp on your phone to pair **${clientId}**, ` +
          `or open the WhatsApp panel in the sidebar to pair with an 8-digit code.\n\n` +
          `![QR code](${dataUrl})`,
        notification_id: `whatsapp_addon_qrcode_${clientId}`,
      },
      "create QR notification"
    );
  }

  dismissQr(clientId) {
    return this.#post(
      "/services/persistent_notification/dismiss",
      { notification_id: `whatsapp_addon_qrcode_${clientId}` },
      "dismiss QR notification"
    );
  }
}
