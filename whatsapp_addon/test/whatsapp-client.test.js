import { describe, expect, it } from "vitest";
import {
  WhatsappClient,
  WhatsappError,
  WhatsappDisconnectedError,
  typingDelayMs,
} from "../src/whatsapp-client.js";

const client = new WhatsappClient({ path: "/tmp/does-not-matter" });

describe("toJid", () => {
  it("añade el sufijo a un número suelto", () => {
    expect(client.toJid("5491111111111")).toBe("5491111111111@s.whatsapp.net");
  });

  it("quita el prefijo + y los separadores", () => {
    expect(client.toJid("+54 9 11 1111-1111")).toBe(
      "5491111111111@s.whatsapp.net",
    );
  });

  it("respeta los JID que ya vienen completos", () => {
    for (const jid of [
      "5491111111111@s.whatsapp.net",
      "120363000000000000@g.us",
      "status@broadcast",
      "123456@lid",
    ]) {
      expect(client.toJid(jid)).toBe(jid);
    }
  });

  it("rechaza valores vacíos", () => {
    expect(() => client.toJid("")).toThrow("Invalid phone");
    expect(() => client.toJid(null)).toThrow("Invalid phone");
  });
});

describe("estado", () => {
  it("expone el estado de conexión (el /health de v2.x siempre daba false)", () => {
    expect(client.status).toMatchObject({ connected: false, attempt: 0 });
  });

  it("devuelve una copia, no la referencia interna", () => {
    const snapshot = client.status;
    snapshot.connected = true;
    expect(client.status.connected).toBe(false);
  });
});

describe("errores", () => {
  it("conserva el mensaje original en vez de descartarlo", () => {
    const err = new WhatsappError(428, new Error("socket hung up"));

    expect(err.code).toBe(428);
    expect(err.message).toContain("Connection Closed");
    expect(err.message).toContain("socket hung up");
    expect(err.cause).toBeInstanceOf(Error);
  });

  it("etiqueta los códigos desconocidos sin romperse", () => {
    expect(new WhatsappError(999).message).toContain("Unknown Error");
  });

  it("marca la desconexión con código 401", () => {
    expect(new WhatsappDisconnectedError().code).toBe(401);
  });
});

describe("guardas de conexión", () => {
  it("no intenta enviar si el socket está caído", async () => {
    await expect(
      client.sendMessage("5491111111111", { text: "hola" }),
    ).rejects.toBeInstanceOf(WhatsappDisconnectedError);
  });

  it("no pide código de emparejamiento sin socket", async () => {
    await expect(
      client.requestPairingCode("5491111111111"),
    ).rejects.toBeInstanceOf(WhatsappDisconnectedError);
  });
});

describe("retardo de escritura", () => {
  it("crece con la longitud del texto", () => {
    const short = typingDelayMs("ok", 3000, () => 1);
    const long = typingDelayMs("x".repeat(60), 3000, () => 1);
    expect(long).toBeGreaterThan(short);
  });

  it("nunca supera el máximo configurado", () => {
    const delay = typingDelayMs("x".repeat(5000), 3000, () => 1);
    expect(delay).toBeLessThanOrEqual(3000);
  });

  it("varía entre envíos, para no mandar siempre con el mismo ritmo", () => {
    const lowest = typingDelayMs("hola", 3000, () => 0);
    const highest = typingDelayMs("hola", 3000, () => 1);
    expect(lowest).toBeLessThan(highest);
  });

  it("es cero cuando el indicador está apagado", () => {
    expect(typingDelayMs("hola", 0, () => 1)).toBe(0);
  });
});
