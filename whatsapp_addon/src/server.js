/**
 * Copyright © 2026 Pablo Antonelli
 *
 * Derived from the WhatsApp Home Assistant add-on by Giuseppe Castaldo
 * (https://github.com/giuseppecastaldo/ha-addons), licensed under Apache-2.0.
 *
 * Licensed under the Apache License, Version 2.0. See the LICENSE file.
 */
import fs from "node:fs/promises";
import path from "node:path";
import pino from "pino";
import { createApp } from "./app.js";
import { writeConnectionFile } from "./component.js";
import { loadConfig, VERSION } from "./config.js";
import { HomeAssistant } from "./homeassistant.js";
import { WhatsappClient } from "./whatsapp-client.js";

const main = async () => {
  const config = await loadConfig();
  const logger = pino({ level: config.logLevel });
  const ha = new HomeAssistant(logger);
  const clients = {};

  const createClient = async (key) => {
    const client = new WhatsappClient({
      path: path.join(config.dataDir, key),
      logger: logger.child({ client: key }),
      offline: !config.markOnline,
      refreshMs: config.refreshMs,
    });

    client.on("restart", () => logger.debug({ client: key }, "restarting"));
    client.on("qr", (qr) => {
      logger.info({ client: key }, "pairing required, see the WhatsApp panel or your notifications");
      ha.notifyQr(key, qr);
    });
    client.on("ready", () => {
      logger.info({ client: key }, "client is ready");
      ha.dismissQr(key);
    });
    client.on("pair", (info) => logger.info({ client: key, ...info }, "paired"));
    client.on("msg", (msg) => ha.fireEvent("new_whatsapp_message", { clientId: key, ...msg }));
    client.on("presence_update", (presence) =>
      ha.fireEvent("whatsapp_presence_update", { clientId: key, ...presence })
    );
    client.on("ack", (ack) => ha.fireEvent("whatsapp_message_ack", { clientId: key, ...ack }));
    client.on("disconnected", (code) =>
      logger.warn({ client: key, code }, "disconnected, reconnecting")
    );
    client.on("gave_up", () => logger.error({ client: key }, "gave up reconnecting"));

    client.on("logout", async () => {
      logger.info({ client: key }, "logged out, wiping session and restarting");
      await client.stop();
      try {
        await fs.rm(path.join(config.dataDir, key), { recursive: true, force: true });
      } catch (err) {
        logger.error({ client: key, err: err.message }, "could not remove session data");
      }
      await createClient(key);
    });

    clients[key] = client;

    // A failure here must not abort the other clients.
    await client.start().catch((err) =>
      logger.error({ client: key, err: err.message }, "could not start client")
    );

    return client;
  };

  for (const key of config.clients) {
    await createClient(key);
  }

  // Publish the endpoint before serving, so the custom component can reach us
  // as soon as Home Assistant loads it.
  await writeConnectionFile({ port: config.port, token: config.token, logger });

  const app = createApp({ clients, token: config.token, logger });

  app.listen(config.port, () =>
    logger.info(
      { port: config.port, version: VERSION, clients: config.clients },
      "WhatsApp add-on started"
    )
  );

  process.on("unhandledRejection", (reason) =>
    logger.error({ err: reason instanceof Error ? reason.message : reason }, "unhandled rejection")
  );
  process.on("uncaughtException", (err) =>
    logger.error({ err: err.message, stack: err.stack }, "uncaught exception")
  );

  const shutdown = async () => {
    logger.info("shutting down");
    await Promise.all(Object.values(clients).map((client) => client.stop()));
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

main().catch((err) => {
  console.error("Fatal error during startup:", err.message);
  process.exit(1);
});
