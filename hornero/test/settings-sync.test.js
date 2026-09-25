import { describe, expect, it, beforeEach, vi } from "vitest";
import request from "supertest";
import pino from "pino";
import { createApp } from "../src/app.js";
import { SettingsStore } from "../src/settings.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The panel and the Home Assistant entities both edit the same settings. This
 * checks they really share one store rather than each keeping its own copy.
 */
describe("los ajustes son un solo estado compartido", () => {
  let settings;
  let app;
  let dataDir;

  beforeEach(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "hornero-sync-"));
    settings = new SettingsStore({ dataDir });
    await settings.load({});
    app = createApp({
      clients: {},
      token: "t",
      logger: pino({ level: "silent" }),
      settings,
    });
  });

  const auth = (req) => req.set("Authorization", "Bearer t");

  it("un cambio desde una entidad se ve en el panel", async () => {
    // The switch entity writes through the same endpoint the panel reads.
    await auth(request(app).put("/api/v1/settings")).send({ markRead: true });

    const res = await auth(request(app).get("/api/v1/settings"));
    expect(res.body.settings.markRead).toBe(true);
  });

  it("un cambio desde el panel se ve en el siguiente sondeo de la entidad", async () => {
    await auth(request(app).put("/api/v1/settings")).send({
      typingMaxSeconds: 7,
    });

    // What the coordinator would fetch on its next poll.
    const res = await auth(request(app).get("/api/v1/settings"));
    expect(res.body.settings.typingMaxSeconds).toBe(7);
    expect(settings.get("typingMaxSeconds")).toBe(7);
  });

  it("cambiar una clave no pisa las demás", async () => {
    await auth(request(app).put("/api/v1/settings")).send({ markRead: true });
    await auth(request(app).put("/api/v1/settings")).send({
      logLevel: "debug",
    });

    const res = await auth(request(app).get("/api/v1/settings"));
    expect(res.body.settings).toMatchObject({
      markRead: true,
      logLevel: "debug",
    });
  });

  it("sobrevive a un reinicio del add-on", async () => {
    await auth(request(app).put("/api/v1/settings")).send({ markOnline: true });

    // A fresh store over the same directory is what a restart looks like.
    const reloaded = new SettingsStore({ dataDir });
    await reloaded.load({});
    expect(reloaded.get("markOnline")).toBe(true);
  });
});
