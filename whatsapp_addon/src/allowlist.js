import fs from "node:fs/promises";
import path from "node:path";

/**
 * Incoming messages reach Home Assistant as events, and automations act on
 * them, so an unfiltered inbox means any stranger can trigger them. The
 * allowlist decides which senders are allowed through.
 *
 * It lives in /data rather than the add-on options so it can be edited from
 * the panel; the `allowed_senders` option seeds it on first run.
 */

const SUFFIXES = ["@s.whatsapp.net", "@g.us", "@broadcast", "@lid"];

/** Accepts phone numbers in any shape, plus full JIDs, and normalises them. */
export const normaliseEntry = (entry) => {
  const value = String(entry ?? "").trim();
  if (!value) return null;
  if (SUFFIXES.some((suffix) => value.endsWith(suffix))) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `${digits}@s.whatsapp.net` : null;
};

export const buildAllowlist = (entries) =>
  new Set((entries ?? []).map(normaliseEntry).filter(Boolean));

/**
 * A group message carries the group in `remoteJid` and the author in
 * `participant`, so either one may be listed: the whole group, or a person.
 */
export const isAllowed = (msg, allowlist) => {
  if (!allowlist || allowlist.size === 0) return true;

  const candidates = [msg?.key?.remoteJid, msg?.key?.participant].filter(
    Boolean,
  );

  return candidates.some((jid) => {
    if (allowlist.has(jid)) return true;
    // Compare bare numbers too, so a device suffix like :12 still matches.
    const bare = jid.replace(/:\d+(?=@)/, "");
    return allowlist.has(bare);
  });
};

/** Persisted, editable allowlist. */
export class AllowlistStore {
  #file;
  #entries = [];
  #set = new Set();
  #logger;

  constructor({ dataDir, logger }) {
    this.#file = path.join(dataDir, "allowlist.json");
    this.#logger = logger;
  }

  /** Loads from disk, falling back to the add-on option on first run. */
  async load(seed) {
    try {
      const raw = await fs.readFile(this.#file, "utf8");
      this.#apply(JSON.parse(raw).entries ?? []);
      return;
    } catch {
      // not saved yet
    }

    this.#apply(seed ?? []);
    if (this.#entries.length) await this.#persist();
  }

  #apply(entries) {
    this.#set = buildAllowlist(entries);
    this.#entries = [...this.#set];
  }

  async #persist() {
    try {
      await fs.writeFile(
        this.#file,
        JSON.stringify({ entries: this.#entries }, null, 2),
      );
    } catch (err) {
      this.#logger?.error({ err: err.message }, "could not save the allowlist");
    }
  }

  get entries() {
    return [...this.#entries];
  }

  /** True while empty: an empty allowlist accepts everyone. */
  get open() {
    return this.#set.size === 0;
  }

  async replace(entries) {
    this.#apply(entries);
    await this.#persist();
    return this.entries;
  }

  allows(msg) {
    return isAllowed(msg, this.#set);
  }
}
