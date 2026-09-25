import { describe, expect, it } from "vitest";
import { MessageLog, describeContent } from "../src/message-log.js";

describe("describeContent", () => {
  it("resume cada tipo de mensaje en una línea", () => {
    expect(describeContent({ text: "hola" })).toBe("hola");
    expect(describeContent({ image: {}, caption: "mirá" })).toBe("mirá");
    expect(describeContent({ image: {} })).toContain("image");
    expect(describeContent({ video: {} })).toContain("video");
    expect(describeContent({ location: {} })).toContain("location");
  });

  it("no se rompe con contenido desconocido", () => {
    expect(describeContent({ somethingNew: {} })).toBe("somethingNew");
    expect(describeContent(null)).toBe("");
  });
});

describe("MessageLog", () => {
  it("registra lo enviado con su destinatario real", () => {
    const log = new MessageLog();
    log.recordSent({
      clientId: "default",
      to: "5491111111111",
      content: { text: "hola" },
      result: { key: { id: "ABC", remoteJid: "5491111111111@s.whatsapp.net" } },
    });

    expect(log.entries[0]).toMatchObject({
      direction: "out",
      jid: "5491111111111@s.whatsapp.net",
      messageId: "ABC",
      preview: "hola",
      status: "sent",
    });
  });

  it("sigue el estado de entrega con los acuses", () => {
    const log = new MessageLog();
    log.recordSent({
      clientId: "default",
      to: "549",
      content: { text: "hola" },
      result: { key: { id: "ABC", remoteJid: "549@s.whatsapp.net" } },
    });

    log.markStatus("ABC", 3);
    expect(log.entries[0].status).toBe("delivered");

    log.markStatus("ABC", 4);
    expect(log.entries[0].status).toBe("read");
  });

  it("ignora un acuse de un mensaje que no registró", () => {
    const log = new MessageLog();
    expect(() => log.markStatus("NOPE", 3)).not.toThrow();
  });

  it("deja ver por qué falló un envío", () => {
    const log = new MessageLog();
    log.recordFailure({
      clientId: "default",
      to: "549",
      content: { text: "hola" },
      error: "WhatsApp is not connected.",
    });

    expect(log.entries[0]).toMatchObject({
      status: "failed",
      error: "WhatsApp is not connected.",
    });
  });

  it("registra lo recibido con el nombre del remitente", () => {
    const log = new MessageLog();
    log.recordReceived({
      clientId: "default",
      msg: {
        key: { id: "X", remoteJid: "549@s.whatsapp.net" },
        pushName: "Ana",
        message: { conversation: "buenas" },
      },
    });

    expect(log.entries[0]).toMatchObject({
      direction: "in",
      name: "Ana",
      preview: "buenas",
    });
  });

  it("recorta la vista previa de un mensaje largo", () => {
    const log = new MessageLog();
    log.recordSent({
      clientId: "d",
      to: "549",
      content: { text: "x".repeat(500) },
      result: {},
    });

    expect(log.entries[0].preview.length).toBeLessThanOrEqual(180);
  });

  it("conserva sólo las entradas más recientes", () => {
    const log = new MessageLog({ limit: 2 });
    for (const n of [1, 2, 3]) {
      log.recordSent({
        clientId: "d",
        to: String(n),
        content: { text: `m${n}` },
        result: {},
      });
    }

    expect(log.entries.map((e) => e.preview)).toEqual(["m3", "m2"]);
  });
});
