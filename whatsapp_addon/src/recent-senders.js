import { identifiersOf } from "./allowlist.js";

/**
 * Remembers who wrote recently, allowed or not, so the panel can offer a
 * one-click Allow instead of asking people to work out an identifier they
 * never see — WhatsApp increasingly addresses people by LID, which looks
 * nothing like their phone number.
 */
export class RecentSenders {
  #limit;
  #byKey = new Map();

  constructor({ limit = 25 } = {}) {
    this.#limit = limit;
  }

  record(msg, allowed) {
    const ids = identifiersOf(msg);
    if (ids.length === 0) return;

    const isGroup = String(msg.key.remoteJid).endsWith("@g.us");
    // One entry per conversation: the group, or the person who wrote.
    const key = isGroup ? msg.key.remoteJid : ids[0];

    this.#byKey.delete(key);
    this.#byKey.set(key, {
      id: key,
      ids,
      name: msg.pushName || null,
      group: isGroup,
      allowed,
      at: new Date().toISOString(),
    });

    while (this.#byKey.size > this.#limit) {
      this.#byKey.delete(this.#byKey.keys().next().value);
    }
  }

  /** Most recent first. */
  get entries() {
    return [...this.#byKey.values()].reverse();
  }
}
