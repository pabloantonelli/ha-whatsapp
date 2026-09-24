import { describe, expect, it, beforeEach, vi } from "vitest";
import request from "supertest";
import pino from "pino";
import { createApp } from "../src/app.js";

vi.mock("../src/media.js", () => ({
  captureSnapshot: vi.fn(async () => ({
    buffer: Buffer.from("fake-jpeg"),
    mimetype: "image/jpeg",
    name: "Front door",
  })),
  captureRecording: vi.fn(async () => ({
    buffer: Buffer.from("fake-mp4"),
    mimetype: "video/mp4",
  })),
  toMessageContent: vi.fn(({ buffer, mimetype }, caption) => ({
    [mimetype.startsWith("video/") ? "video" : "image"]: buffer,
    mimetype,
    ...(caption ? { caption } : {}),
  })),
}));

import { captureRecording, captureSnapshot } from "../src/media.js";

const TOKEN = "test-token";

const makeClient = (overrides = {}) => ({
  status: {
    connected: true,
    disconnected: false,
    reconnecting: false,
    phone: "5491100000000",
  },
  qr: null,
  sendMessage: vi.fn(async () => ({
    key: { id: "3EB0ABC", remoteJid: "5491111111111@s.whatsapp.net" },
    messageTimestamp: 1737400000,
  })),
  updateProfileStatus: vi.fn(async () => {}),
  presenceSubscribe: vi.fn(async () => {}),
  sendPresenceUpdate: vi.fn(async () => {}),
  setSendPresenceUpdateInterval: vi.fn(),
  checkNumber: vi.fn(async () => ({ jid: "x@s.whatsapp.net", exists: true })),
  fetchGroups: vi.fn(async () => [
    { id: "120363000@g.us", name: "Familia", participants: 5, announce: false },
  ]),
  contacts: [{ id: "5491111111111@s.whatsapp.net", name: "Ana" }],
  fetchAvatarUrl: vi.fn(async () => null),
  requestPairingCode: vi.fn(async () => "ABCD1234"),
  restart: vi.fn(async () => {}),
  emit: vi.fn(),
  ...overrides,
});

let client;
let app;
let allowlist;

beforeEach(() => {
  client = makeClient();
  allowlist = {
    entries: ["5491111111111@s.whatsapp.net"],
    open: false,
    replace: vi.fn(async (entries) => {
      allowlist.entries = entries.map((e) => `${e}@s.whatsapp.net`);
      return allowlist.entries;
    }),
  };
  app = createApp({
    clients: { default: client },
    token: TOKEN,
    logger: pino({ level: "silent" }),
    allowlist,
    recentSenders: {
      entries: [
        {
          id: "173478124720340@lid",
          ids: ["173478124720340@lid", "5491111111111@s.whatsapp.net"],
          name: "Ana",
          group: false,
          allowed: false,
          at: "2026-09-24T00:00:00.000Z",
        },
      ],
    },
  });
});

describe("compatibilidad con la API v2", () => {
  it("POST /sendMessage responde exactamente {status:'OK'}", async () => {
    const res = await request(app)
      .post("/sendMessage")
      .send({
        clientId: "default",
        to: "5491111111111",
        body: { text: "hola" },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "OK" });
    expect(client.sendMessage).toHaveBeenCalledWith(
      "5491111111111",
      { text: "hola" },
      undefined,
      { typing: undefined },
    );
  });

  it("devuelve 400 y {status:'KO'} cuando falta clientId", async () => {
    const res = await request(app)
      .post("/sendMessage")
      .send({ to: "549111", body: {} });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: "KO", error: "Client ID required" });
  });

  it("devuelve 404 cuando el cliente no existe", async () => {
    const res = await request(app)
      .post("/sendMessage")
      .send({ clientId: "otro", to: "549111", body: {} });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: "KO", error: "Client not found" });
  });

  it("devuelve 500 con el mensaje de error del cliente", async () => {
    client.sendMessage.mockRejectedValueOnce(
      new Error("Whatsapp disconnected error."),
    );

    const res = await request(app)
      .post("/sendMessage")
      .send({ clientId: "default", to: "549111", body: {} });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: "KO",
      error: "Whatsapp disconnected error.",
    });
  });

  it("mantiene los otros cuatro endpoints heredados", async () => {
    const calls = [
      [
        "/setStatus",
        { clientId: "default", status: "Disponible" },
        () => client.updateProfileStatus,
      ],
      [
        "/presenceSubscribe",
        { clientId: "default", userId: "549111" },
        () => client.presenceSubscribe,
      ],
      [
        "/sendPresenceUpdate",
        { clientId: "default", type: "composing", to: "549111" },
        () => client.sendPresenceUpdate,
      ],
      [
        "/sendInfinityPresenceUpdate",
        { clientId: "default", type: "available" },
        () => client.setSendPresenceUpdateInterval,
      ],
    ];

    for (const [route, body, getSpy] of calls) {
      const res = await request(app).post(route).send(body);
      expect(res.body, route).toEqual({ status: "OK" });
      expect(getSpy(), route).toHaveBeenCalled();
    }
  });

  it("los endpoints heredados no exigen token", async () => {
    const res = await request(app)
      .post("/sendMessage")
      .send({ clientId: "default", to: "549111", body: { text: "hola" } });

    expect(res.status).toBe(200);
  });
});

describe("API v1", () => {
  const auth = (req) => req.set("Authorization", `Bearer ${TOKEN}`);

  it("rechaza peticiones sin token", async () => {
    const res = await request(app).get("/api/v1/clients");
    expect(res.status).toBe(401);
  });

  it("acepta peticiones de ingress sin token", async () => {
    const res = await request(app)
      .get("/api/v1/clients")
      .set("X-Ingress-Path", "/api/hassio_ingress/x");
    expect(res.status).toBe(200);
  });

  it("devuelve el messageId al enviar", async () => {
    const res = await auth(
      request(app).post("/api/v1/clients/default/messages"),
    ).send({
      to: "5491111111111",
      body: { text: "hola" },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      messageId: "3EB0ABC",
      to: "5491111111111@s.whatsapp.net",
      timestamp: 1737400000,
    });
  });

  it("valida el cuerpo y explica el fallo", async () => {
    const res = await auth(
      request(app).post("/api/v1/clients/default/messages"),
    ).send({ to: "549111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request body");
    expect(res.body.details[0].path).toBe("body");
  });

  it("expone el estado de los clientes", async () => {
    const res = await auth(request(app).get("/api/v1/clients"));

    expect(res.status).toBe(200);
    expect(res.body.clients[0]).toMatchObject({
      clientId: "default",
      connected: true,
    });
  });

  it("entrega un código de emparejamiento", async () => {
    const res = await auth(
      request(app).post("/api/v1/clients/default/pairing-code"),
    ).send({
      phone: "5491111111111",
    });

    expect(res.body).toEqual({ code: "ABCD1234" });
  });
});

describe("/health", () => {
  it("refleja el estado real de conexión", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    // El bug de v2.x: siempre informaba connected:false.
    expect(res.body.clients.default.connected).toBe(true);
    // La versión sale del package.json, no se fija aquí.
    expect(res.body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("media", () => {
  const auth = (req) => req.set("Authorization", `Bearer ${TOKEN}`);

  it("envía un snapshot de una cámara", async () => {
    const res = await auth(
      request(app).post("/api/v1/clients/default/media"),
    ).send({
      to: "5491111111111",
      entityId: "camera.front_door",
      caption: "Mirá",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      messageId: "3EB0ABC",
      mimetype: "image/jpeg",
    });
    expect(captureSnapshot).toHaveBeenCalledWith("camera.front_door");
    expect(client.sendMessage).toHaveBeenCalledWith(
      "5491111111111",
      expect.objectContaining({ mimetype: "image/jpeg", caption: "Mirá" }),
      undefined,
      { typing: undefined },
    );
  });

  it("graba un video cuando se indica duración", async () => {
    const res = await auth(
      request(app).post("/api/v1/clients/default/media"),
    ).send({
      to: "5491111111111",
      entityId: "camera.front_door",
      duration: 10,
      lookback: 5,
    });

    expect(res.status).toBe(200);
    expect(res.body.mimetype).toBe("video/mp4");
    expect(captureRecording).toHaveBeenCalledWith("camera.front_door", {
      duration: 10,
      lookback: 5,
    });
  });

  it("rechaza duraciones fuera de rango", async () => {
    const res = await auth(
      request(app).post("/api/v1/clients/default/media"),
    ).send({ to: "549111", entityId: "camera.x", duration: 500 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request body");
  });
});

describe("chats", () => {
  const auth = (req) => req.set("Authorization", `Bearer ${TOKEN}`);

  it("lista grupos con su JID y contactos", async () => {
    const res = await auth(request(app).get("/api/v1/clients/default/chats"));

    expect(res.status).toBe(200);
    // El JID de un grupo no se puede deducir de un teléfono: es el único modo.
    expect(res.body.groups[0]).toEqual({
      id: "120363000@g.us",
      name: "Familia",
      participants: 5,
      announce: false,
    });
    expect(res.body.contacts[0].name).toBe("Ana");
  });

  it("exige token", async () => {
    const res = await request(app).get("/api/v1/clients/default/chats");
    expect(res.status).toBe(401);
  });
});

describe("datos de conexión para los snippets", () => {
  it("se sirven por ingress", async () => {
    const res = await request(app)
      .get("/api/v1/connection")
      .set("X-Ingress-Path", "/api/hassio_ingress/x");

    expect(res.status).toBe(200);
    expect(res.body.token).toBe(TOKEN);
  });

  it("no se sirven con token, sólo por ingress", async () => {
    const res = await request(app)
      .get("/api/v1/connection")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(403);
  });
});

describe("avatares", () => {
  it("devuelve 404 cuando el chat no tiene foto", async () => {
    const res = await request(app)
      .get("/api/v1/clients/default/avatar/123@s.whatsapp.net")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
    expect(client.fetchAvatarUrl).toHaveBeenCalledWith("123@s.whatsapp.net");
  });
});

describe("indicador de escritura", () => {
  const auth = (req) => req.set("Authorization", `Bearer ${TOKEN}`);

  it("se puede desactivar por llamada, para alertas urgentes", async () => {
    await auth(request(app).post("/api/v1/clients/default/messages")).send({
      to: "5491111111111",
      body: { text: "Fuga de agua" },
      typing: false,
    });

    expect(client.sendMessage).toHaveBeenCalledWith(
      "5491111111111",
      { text: "Fuga de agua" },
      undefined,
      { typing: false },
    );
  });

  it("los endpoints heredados también lo pueden desactivar", async () => {
    await request(app)
      .post("/sendMessage")
      .send({
        clientId: "default",
        to: "5491111111111",
        body: { text: "urgente" },
        typing: false,
      });

    expect(client.sendMessage).toHaveBeenCalledWith(
      "5491111111111",
      { text: "urgente" },
      undefined,
      { typing: false },
    );
  });
});

describe("allowlist", () => {
  const auth = (req) => req.set("Authorization", `Bearer ${TOKEN}`);

  it("devuelve las entradas actuales", async () => {
    const res = await auth(request(app).get("/api/v1/allowlist"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      entries: ["5491111111111@s.whatsapp.net"],
      open: false,
    });
  });

  it("reemplaza la lista completa", async () => {
    const res = await auth(request(app).put("/api/v1/allowlist")).send({
      entries: ["5492222222222"],
    });

    expect(res.status).toBe(200);
    expect(allowlist.replace).toHaveBeenCalledWith(["5492222222222"]);
  });

  it("rechaza un cuerpo que no sea una lista", async () => {
    const res = await auth(request(app).put("/api/v1/allowlist")).send({
      entries: "5492222222222",
    });

    expect(res.status).toBe(400);
  });
});

describe("remitentes recientes", () => {
  it("los expone para poder permitirlos desde el panel", async () => {
    const res = await request(app)
      .get("/api/v1/recent-senders")
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.senders[0]).toMatchObject({
      id: "173478124720340@lid",
      name: "Ana",
      allowed: false,
    });
  });
});
