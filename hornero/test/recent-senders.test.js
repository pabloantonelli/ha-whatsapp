import { describe, expect, it } from "vitest";
import { RecentSenders } from "../src/recent-senders.js";

const msg = (key, pushName) => ({ key, pushName });

describe("RecentSenders", () => {
  it("guarda quién escribió, permitido o no", () => {
    const recent = new RecentSenders();
    recent.record(
      msg({ remoteJid: "5491111111111@s.whatsapp.net" }, "Ana"),
      true,
    );
    recent.record(msg({ remoteJid: "999@lid" }, "Desconocido"), false);

    expect(recent.entries.map((e) => [e.name, e.allowed])).toEqual([
      ["Desconocido", false],
      ["Ana", true],
    ]);
  });

  it("agrupa por conversación: un grupo es una sola entrada", () => {
    const recent = new RecentSenders();
    const group = { remoteJid: "120363000@g.us", participant: "1@lid" };
    recent.record(msg(group, "Ana"), true);
    recent.record(msg({ ...group, participant: "2@lid" }, "Beto"), true);

    expect(recent.entries).toHaveLength(1);
    expect(recent.entries[0].group).toBe(true);
  });

  it("conserva los identificadores alternativos, para poder permitirlos", () => {
    const recent = new RecentSenders();
    recent.record(
      msg({
        remoteJid: "173478124720340@lid",
        remoteJidAlt: "5491111111111@s.whatsapp.net",
      }),
      false,
    );

    expect(recent.entries[0].ids).toContain("5491111111111@s.whatsapp.net");
  });

  it("descarta las entradas más viejas al llegar al límite", () => {
    const recent = new RecentSenders({ limit: 2 });
    for (const n of [1, 2, 3]) {
      recent.record(msg({ remoteJid: `${n}@s.whatsapp.net` }), true);
    }

    expect(recent.entries.map((e) => e.id)).toEqual([
      "3@s.whatsapp.net",
      "2@s.whatsapp.net",
    ]);
  });
});
