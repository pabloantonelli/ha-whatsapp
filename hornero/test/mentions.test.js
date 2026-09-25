import { describe, expect, it } from "vitest";
import { addressesMe, passesMentionRule } from "../src/mentions.js";

const OWN = ["5491122334455:7@s.whatsapp.net", "173478124720340@lid"];

const group = (message) => ({ key: { remoteJid: "120363@g.us" }, message });

describe("addressesMe", () => {
  it("matches a mention even with a device suffix on our own id", () => {
    expect(
      addressesMe(
        group({
          extendedTextMessage: {
            contextInfo: { mentionedJid: ["5491122334455@s.whatsapp.net"] },
          },
        }),
        OWN,
      ),
    ).toBe(true);
  });

  it("matches a mention by LID", () => {
    expect(
      addressesMe(
        group({
          extendedTextMessage: {
            contextInfo: { mentionedJid: ["173478124720340@lid"] },
          },
        }),
        OWN,
      ),
    ).toBe(true);
  });

  it("matches a reply to something we sent", () => {
    expect(
      addressesMe(
        group({
          extendedTextMessage: {
            contextInfo: {
              participant: "5491122334455@s.whatsapp.net",
              quotedMessage: { conversation: "alarm armed" },
            },
          },
        }),
        OWN,
      ),
    ).toBe(true);
  });

  it("finds the context on a caption, not only on text", () => {
    expect(
      addressesMe(
        group({
          imageMessage: {
            caption: "look",
            contextInfo: { mentionedJid: ["173478124720340@lid"] },
          },
        }),
        OWN,
      ),
    ).toBe(true);
  });

  it("ignores chatter that names someone else", () => {
    expect(
      addressesMe(
        group({
          extendedTextMessage: {
            contextInfo: { mentionedJid: ["5491199999999@s.whatsapp.net"] },
          },
        }),
        OWN,
      ),
    ).toBe(false);
  });

  it("is false when the account identity is not known yet", () => {
    expect(
      addressesMe(
        group({
          extendedTextMessage: {
            contextInfo: { mentionedJid: ["5491122334455@s.whatsapp.net"] },
          },
        }),
        [],
      ),
    ).toBe(false);
  });
});

describe("passesMentionRule", () => {
  const msg = group({ conversation: "hola a todos" });

  it("lets everything through while disabled", () => {
    expect(passesMentionRule(msg, { ownJids: OWN, enabled: false })).toBe(true);
  });

  it("drops unaddressed group chatter while enabled", () => {
    expect(passesMentionRule(msg, { ownJids: OWN, enabled: true })).toBe(false);
  });

  it("never filters a direct chat", () => {
    const direct = {
      key: { remoteJid: "5491199999999@s.whatsapp.net" },
      message: { conversation: "hola" },
    };
    expect(passesMentionRule(direct, { ownJids: OWN, enabled: true })).toBe(
      true,
    );
  });
});
