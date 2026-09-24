import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BAILEYS_VERSION, VERSION } from "./config.js";
import { authenticate, errorHandler } from "./routes/middleware.js";
import { createApiRouter } from "./routes/api.js";
import { createLegacyRouter } from "./routes/legacy.js";

const publicDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "public",
);

/** Builds the Express app. Kept separate from the server so tests can mount it. */
export const createApp = ({ clients, token, logger, baseUrl }) => {
  const app = express();

  // Only the ingress panel is served from a browser, and it is same-origin.
  app.use(cors({ origin: false }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      version: VERSION,
      baileys: BAILEYS_VERSION,
      clients: Object.fromEntries(
        Object.entries(clients).map(([id, client]) => [id, client.status]),
      ),
    });
  });

  app.use(
    "/api/v1",
    authenticate(token),
    createApiRouter(clients, { token, baseUrl }),
  );

  // Legacy endpoints stay unauthenticated: the custom component shipped with
  // v2.x does not send a token, and breaking those installs is not acceptable.
  app.use("/", createLegacyRouter(clients, logger));

  // Always revalidate: the panel is served through ingress, where a cached
  // copy would keep running an old version after an add-on update.
  app.use(
    express.static(publicDir, {
      setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
    }),
  );

  app.use(errorHandler(logger));

  return app;
};
