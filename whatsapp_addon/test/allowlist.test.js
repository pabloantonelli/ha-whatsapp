import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  AllowlistStore,
  buildAllowlist,
  isAllowed,
  normaliseEntry,
} from "../src/allowlist.js";

const msg = (remoteJid, participant) => ({ key: { remoteJid, participant } });

describe("normaliseEntry", () => {
  it("acepta números en cualquier formato", () => {
    for (const input of [
      "5491111111111",
      "+54 9 11 1111-1111",
      "+5491111111111",
    ]) {
      expect(normaliseEntry(input)).toBe("5491111111111@s.whatsapp.net");
    }
  });

  it("respeta los JID completos", () => {
    expect(normaliseEntry("120363000@g.us")).toBe("120363000@g.us");
  });

  it("descarta entradas vacías", () => {
    expect(normaliseEntry("   ")).toBeNull();
  });
});

describe("isAllowed", () => {
  it("sin lista, deja pasar a todos (comportamiento por defecto)", () => {
    expect(isAllowed(msg("999@s.whatsapp.net"), buildAllowlist([]))).toBe(true);
  });

  it("bloquea a quien no está en la lista", () => {
    const list = buildAllowlist(["5491111111111"]);
    expect(isAllowed(msg("5492222222222@s.whatsapp.net"), list)).toBe(false);
  });

  it("deja pasar a quien sí está", () => {
    const list = buildAllowlist(["+54 9 11 1111-1111"]);
    expect(isAllowed(msg("5491111111111@s.whatsapp.net"), list)).toBe(true);
  });

  it("ignora el sufijo de dispositivo", () => {
    const list = buildAllowlist(["5491111111111"]);
    expect(isAllowed(msg("5491111111111:12@s.whatsapp.net"), list)).toBe(true);
  });

  it("permite listar un grupo entero", () => {
    const list = buildAllowlist(["120363000@g.us"]);
    // En un grupo, remoteJid es el grupo y participant es quien escribió.
    expect(
      isAllowed(msg("120363000@g.us", "5499999999999@s.whatsapp.net"), list),
    ).toBe(true);
  });

  it("permite listar a una persona dentro de un grupo no listado", () => {
    const list = buildAllowlist(["5491111111111"]);
    expect(
      isAllowed(msg("120363999@g.us", "5491111111111@s.whatsapp.net"), list),
    ).toBe(true);
    expect(
      isAllowed(msg("120363999@g.us", "5490000000000@s.whatsapp.net"), list),
    ).toBe(false);
  });
});

describe("AllowlistStore", () => {
  const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "wa-allowlist-"));

  it("se siembra con la opción del add-on la primera vez", async () => {
    const dir = tmp();
    const store = new AllowlistStore({ dataDir: dir });
    await store.load(["+54 9 11 1111-1111"]);

    expect(store.entries).toEqual(["5491111111111@s.whatsapp.net"]);
    expect(store.open).toBe(false);
  });

  it("persiste los cambios y los relee", async () => {
    const dir = tmp();
    const first = new AllowlistStore({ dataDir: dir });
    await first.load([]);
    await first.replace(["120363000@g.us"]);

    const second = new AllowlistStore({ dataDir: dir });
    await second.load(["ignorado-porque-ya-hay-archivo"]);

    expect(second.entries).toEqual(["120363000@g.us"]);
  });

  it("vacía acepta a cualquiera", async () => {
    const store = new AllowlistStore({ dataDir: tmp() });
    await store.load([]);

    expect(store.open).toBe(true);
    expect(store.allows(msg("999@s.whatsapp.net"))).toBe(true);
  });
});

describe("identificadores LID", () => {
  // WhatsApp addresses people by LID, which looks nothing like their number.
  const byPhone = buildAllowlist(["5491111111111"]);

  it("acepta un LID cuyo número alternativo está en la lista", () => {
    const incoming = {
      key: {
        remoteJid: "173478124720340@lid",
        remoteJidAlt: "5491111111111@s.whatsapp.net",
      },
    };
    expect(isAllowed(incoming, byPhone)).toBe(true);
  });

  it("acepta al autor de un grupo identificado por LID", () => {
    const incoming = {
      key: {
        remoteJid: "120363000@g.us",
        participant: "173478124720340@lid",
        participantAlt: "5491111111111@s.whatsapp.net",
      },
    };
    expect(isAllowed(incoming, byPhone)).toBe(true);
  });

  it("sigue bloqueando a un desconocido con LID", () => {
    const incoming = {
      key: {
        remoteJid: "999999@lid",
        remoteJidAlt: "5490000000000@s.whatsapp.net",
      },
    };
    expect(isAllowed(incoming, byPhone)).toBe(false);
  });

  it("permite listar el LID directamente", () => {
    const list = buildAllowlist(["173478124720340@lid"]);
    expect(isAllowed({ key: { remoteJid: "173478124720340@lid" } }, list)).toBe(
      true,
    );
  });
});
