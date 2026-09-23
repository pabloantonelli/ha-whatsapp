/**
 * Compatibility layer for the pre-3.0 endpoints. These routes keep the exact
 * request shape, status codes and response bodies of v2.1.0, so existing Home
 * Assistant automations and any direct HTTP callers keep working unchanged.
 */
import { Router } from "express";

const OK = { status: "OK" };

/** Mirrors the original checks so the same bodies and codes come back. */
const resolve = (clients, req, res) => {
  const id = req.body?.clientId;

  if (!id) {
    res.status(400).json({ status: "KO", error: "Client ID required" });
    return null;
  }
  if (!Object.hasOwn(clients, id)) {
    res.status(404).json({ status: "KO", error: "Client not found" });
    return null;
  }
  return clients[id];
};

export const createLegacyRouter = (clients, logger) => {
  const router = Router();

  const handle = (name, action) => async (req, res) => {
    const client = resolve(clients, req, res);
    if (!client) return;

    try {
      await action(client, req.body);
      res.json(OK);
    } catch (error) {
      logger.error(
        { err: error.message, endpoint: name },
        "legacy request failed",
      );
      res.status(500).json({ status: "KO", error: error.message });
    }
  };

  router.post(
    "/sendMessage",
    handle("sendMessage", (client, body) =>
      client.sendMessage(body.to, body.body, body.options),
    ),
  );

  router.post(
    "/setStatus",
    handle("setStatus", (client, body) =>
      client.updateProfileStatus(body.status),
    ),
  );

  router.post(
    "/presenceSubscribe",
    handle("presenceSubscribe", (client, body) =>
      client.presenceSubscribe(body.userId),
    ),
  );

  router.post(
    "/sendPresenceUpdate",
    handle("sendPresenceUpdate", (client, body) =>
      client.sendPresenceUpdate(body.type, body.to),
    ),
  );

  router.post(
    "/sendInfinityPresenceUpdate",
    handle("sendInfinityPresenceUpdate", (client, body) =>
      client.setSendPresenceUpdateInterval(body.type, body.to),
    ),
  );

  return router;
};
