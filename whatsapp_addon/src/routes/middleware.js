/**
 * Copyright © 2026 Pablo Antonelli
 * Licensed under the Apache License, Version 2.0. See the LICENSE file.
 */

/**
 * Bearer-token auth. Ingress requests are already authenticated by the
 * Supervisor, which injects X-Ingress-Path, so they are allowed through.
 */
export const authenticate = (token) => (req, res, next) => {
  if (req.get("X-Ingress-Path") !== undefined) return next();

  const header = req.get("Authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (provided !== token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
};

/** Resolves :clientId into req.client, replacing the checks duplicated per route. */
export const resolveClient = (clients) => (req, res, next) => {
  const id = req.params.clientId ?? req.body?.clientId;

  if (!id) {
    return res.status(400).json({ error: "Client ID required" });
  }
  if (!Object.hasOwn(clients, id)) {
    return res.status(404).json({ error: "Client not found" });
  }

  req.clientId = id;
  req.client = clients[id];
  return next();
};

/** Validates the body against a zod schema, replacing ad-hoc hasOwnProperty checks. */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  req.validated = result.data;
  return next();
};

/** Wraps an async handler so rejections reach the error middleware. */
export const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** Centralised error handler; replaces the try/catch repeated in every route. */
export const errorHandler = (logger) => (err, req, res, _next) => {
  const status = Number.isInteger(err.code) && err.code >= 400 && err.code < 600
    ? err.code
    : 500;

  logger.error({ err: err.message, path: req.path }, "request failed");
  res.status(status).json({ error: err.message });
};
