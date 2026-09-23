import { Router } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { asyncRoute, resolveClient, validate } from "./middleware.js";

const messageSchema = z.object({
  to: z.union([z.string().min(1), z.number()]),
  body: z.record(z.string(), z.unknown()),
  options: z.record(z.string(), z.unknown()).optional(),
});

const presenceSchema = z.object({
  type: z.enum([
    "unavailable",
    "available",
    "composing",
    "recording",
    "paused",
  ]),
  to: z.union([z.string().min(1), z.number()]).optional(),
  infinity: z.boolean().optional(),
});

const subscribeSchema = z.object({
  userId: z.union([z.string().min(1), z.number()]),
});

const statusSchema = z.object({
  status: z.string(),
});

const pairingSchema = z.object({
  phone: z.union([z.string().min(1), z.number()]),
});

const describe = (id, client) => ({
  clientId: id,
  ...client.status,
  hasQr: Boolean(client.qr),
});

export const createApiRouter = (clients) => {
  const router = Router();
  const withClient = resolveClient(clients);

  router.get("/clients", (req, res) => {
    res.json({
      clients: Object.entries(clients).map(([id, client]) =>
        describe(id, client),
      ),
    });
  });

  router.get("/clients/:clientId", withClient, (req, res) => {
    res.json(describe(req.clientId, req.client));
  });

  router.get(
    "/clients/:clientId/qr",
    withClient,
    asyncRoute(async (req, res) => {
      const qr = req.client.qr;
      if (!qr) {
        return res.status(404).json({
          error: req.client.status.connected
            ? "Client is already paired."
            : "No QR code available yet.",
        });
      }

      if (req.query.format === "png") {
        res.type("png");
        return QRCode.toFileStream(res, qr, { margin: 1, width: 512 });
      }
      return res.json({
        qr,
        dataUrl: await QRCode.toDataURL(qr, { margin: 1, width: 512 }),
      });
    }),
  );

  router.post(
    "/clients/:clientId/pairing-code",
    withClient,
    validate(pairingSchema),
    asyncRoute(async (req, res) => {
      const code = await req.client.requestPairingCode(req.validated.phone);
      res.json({ code });
    }),
  );

  router.post(
    "/clients/:clientId/messages",
    withClient,
    validate(messageSchema),
    asyncRoute(async (req, res) => {
      const { to, body, options } = req.validated;
      const result = await req.client.sendMessage(to, body, options);
      res.json({
        messageId: result?.key?.id ?? null,
        to: result?.key?.remoteJid ?? null,
        timestamp: result?.messageTimestamp ?? null,
      });
    }),
  );

  router.get(
    "/clients/:clientId/check/:phone",
    withClient,
    asyncRoute(async (req, res) => {
      res.json(await req.client.checkNumber(req.params.phone));
    }),
  );

  router.post(
    "/clients/:clientId/status",
    withClient,
    validate(statusSchema),
    asyncRoute(async (req, res) => {
      await req.client.updateProfileStatus(req.validated.status);
      res.json({ ok: true });
    }),
  );

  router.post(
    "/clients/:clientId/presence",
    withClient,
    validate(presenceSchema),
    asyncRoute(async (req, res) => {
      const { type, to, infinity } = req.validated;
      if (infinity) req.client.setSendPresenceUpdateInterval(type, to);
      else await req.client.sendPresenceUpdate(type, to);
      res.json({ ok: true });
    }),
  );

  router.post(
    "/clients/:clientId/presence/subscribe",
    withClient,
    validate(subscribeSchema),
    asyncRoute(async (req, res) => {
      await req.client.presenceSubscribe(req.validated.userId);
      res.json({ ok: true });
    }),
  );

  router.post(
    "/clients/:clientId/restart",
    withClient,
    asyncRoute(async (req, res) => {
      await req.client.restart();
      res.json({ ok: true });
    }),
  );

  router.post(
    "/clients/:clientId/logout",
    withClient,
    asyncRoute(async (req, res) => {
      req.client.emit("logout");
      res.json({ ok: true });
    }),
  );

  return router;
};
