import EventEmitter2 from "eventemitter2";
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from "baileys";
import PQueue from "p-queue";
import pino from "pino";

/** Message types accepted by the `type` discriminator of incoming events. */
export const MessageType = {
  text: "conversation",
  location: "locationMessage",
  liveLocation: "liveLocationMessage",
  image: "imageMessage",
  video: "videoMessage",
  document: "documentMessage",
  contact: "contactMessage",
};

const SUFFIXES = ["@s.whatsapp.net", "@g.us", "@broadcast", "@lid"];

/** Disconnect reasons that must reconnect immediately, without backoff. */
const IMMEDIATE_RECONNECT = new Set([
  DisconnectReason.restartRequired, // 515: handshake asks for a fresh socket
]);

const ERROR_MESSAGES = {
  401: "Logged Out",
  403: "Forbidden",
  408: "Connection Lost",
  411: "Multidevice Mismatch",
  428: "Connection Closed",
  440: "Connection Replaced",
  500: "Bad Session",
  503: "Unavailable Service",
  515: "Restart Required",
};

export class WhatsappNumberNotFoundError extends Error {
  constructor(phone = "") {
    super(`Send message failed. Number ${phone} is not on Whatsapp.`);
    this.name = "WhatsappNumberNotFoundError";
    this.code = 404;
  }
}

export class WhatsappDisconnectedError extends Error {
  constructor() {
    super("Send message failed. Whatsapp disconnected error.");
    this.name = "WhatsappDisconnectedError";
    this.code = 401;
  }
}

export class WhatsappError extends Error {
  constructor(statusCode, cause) {
    const label = ERROR_MESSAGES[statusCode] || "Unknown Error";
    const detail = cause?.message ? `: ${cause.message}` : "";
    super(`Whatsapp error ${statusCode} (${label})${detail}`);
    this.name = "WhatsappError";
    this.code = statusCode;
    this.cause = cause;
  }
}

/** Wraps a Boom/unknown error from Baileys without discarding its message. */
const wrapError = (err) => {
  if (err instanceof WhatsappError) return err;
  const statusCode =
    err?.output?.statusCode ?? err?.output?.payload?.statusCode ?? 500;
  return new WhatsappError(statusCode, err);
};

export class WhatsappClient extends EventEmitter2 {
  #conn;
  #path;
  #logger;
  #offline;
  #refreshMs;
  #baseDelayMs;
  #maxDelayMs;
  #maxAttempts;

  #refreshInterval;
  #presenceInterval;
  #saveCreds;
  #version;
  #queue = new PQueue({ concurrency: 1 });
  #existsCache = new Map();
  #existsTtlMs = 10 * 60 * 1000;
  #stopped = false;
  #lastQr = null;

  #status = {
    attempt: 0,
    connected: false,
    disconnected: false,
    reconnecting: false,
    phone: null,
    name: null,
    lastConnectedAt: null,
    lastDisconnectReason: null,
  };

  constructor({
    path,
    logger,
    offline = true,
    // 0 disables the periodic restart. It was a Baileys 6 workaround; Baileys 7
    // keeps the socket alive on its own, so it is off unless explicitly enabled.
    refreshMs = 0,
    baseDelayMs = 1000,
    maxDelayMs = 5 * 60 * 1000,
    maxAttempts = Infinity,
  }) {
    super();
    this.#path = path;
    this.#logger = logger ?? pino({ level: "silent" });
    this.#offline = offline;
    this.#refreshMs = refreshMs;
    this.#baseDelayMs = baseDelayMs;
    this.#maxDelayMs = maxDelayMs;
    this.#maxAttempts = maxAttempts;
  }

  /** Public, read-only view of the connection state. */
  get status() {
    return { ...this.#status };
  }

  get qr() {
    return this.#lastQr;
  }

  /** Opens the socket. Must be awaited by the caller so failures surface. */
  async start() {
    this.#stopped = false;
    await this.#connect();
  }

  /** Permanently stops the client; no reconnection will be attempted. */
  async stop() {
    this.#stopped = true;
    this.#status.disconnected = true;
    this.#status.reconnecting = false;
    clearInterval(this.#refreshInterval);
    clearInterval(this.#presenceInterval);
    try {
      this.#conn?.end(undefined);
    } catch {
      // the socket may already be closed
    }
  }

  restart() {
    this.emit("restart");
    this.#status.connected = false;
    this.#status.reconnecting = true;
    return this.#conn?.end(undefined);
  }

  async #connect() {
    if (this.#status.connected || this.#stopped) return;

    const version = await this.#resolveVersion();
    const { state, saveCreds } = await useMultiFileAuthState(this.#path);
    this.#saveCreds = saveCreds;

    this.#conn = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.#logger),
      },
      logger: this.#logger,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: !this.#offline,
      generateHighQualityLinkPreview: true,
      // No message store is kept, so decryption retries cannot be served.
      getMessage: async () => undefined,
    });

    this.#conn.ev.on("creds.update", async () => {
      await this.#saveCreds();
      if (state.creds.me) {
        this.#status.phone = state.creds.me.id.split(":")[0];
        this.#status.name = state.creds.me.name ?? null;
        this.emit("pair", {
          phone: this.#status.phone,
          name: this.#status.name,
        });
      }
    });

    this.#conn.ev.on("connection.update", this.#onConnectionUpdate);
    this.#conn.ev.on("messages.upsert", this.#onMessagesUpsert);
    this.#conn.ev.on("messages.update", this.#onMessagesUpdate);
    this.#conn.ev.on("presence.update", (presence) =>
      this.emit("presence_update", presence),
    );
  }

  /**
   * The version lookup hits the network. Cache it and fall back to Baileys'
   * bundled default so a DNS hiccup cannot break an entire reconnection.
   */
  async #resolveVersion() {
    try {
      const { version } = await fetchLatestBaileysVersion();
      this.#version = version;
    } catch (err) {
      this.#logger.warn(
        { err: err.message },
        "could not fetch latest WhatsApp Web version, using cached/default",
      );
    }
    return this.#version;
  }

  #onConnectionUpdate = (event) => {
    if (event.qr) {
      this.#lastQr = event.qr;
      this.emit("qr", event.qr);
    }
    if (event.connection === "open") this.#onConnected();
    else if (event.connection === "close") this.#onDisconnected(event);
  };

  #onConnected = () => {
    this.#status.attempt = 0;
    this.#status.connected = true;
    this.#status.disconnected = false;
    this.#status.reconnecting = false;
    this.#status.lastConnectedAt = new Date().toISOString();
    this.#status.lastDisconnectReason = null;
    this.#lastQr = null;

    clearInterval(this.#refreshInterval);
    if (this.#refreshMs > 0) {
      this.#refreshInterval = setInterval(
        () => this.restart(),
        this.#refreshMs,
      );
    }
    if (this.#offline) this.setSendPresenceUpdateInterval("unavailable");

    this.emit("ready");
  };

  #onDisconnected = ({ lastDisconnect }) => {
    this.#status.connected = false;
    clearInterval(this.#refreshInterval);
    this.setSendPresenceUpdateInterval();

    const statusCode =
      lastDisconnect?.error?.output?.statusCode ??
      lastDisconnect?.error?.output?.payload?.statusCode;
    this.#status.lastDisconnectReason = statusCode ?? null;

    if (statusCode === DisconnectReason.loggedOut) {
      this.#status.reconnecting = false;
      this.#status.disconnected = true;
      this.emit("logout");
      return;
    }

    this.emit("disconnected", statusCode);
    this.#reconnect(statusCode);
  };

  #onMessagesUpsert = ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key?.fromMe) continue;
      delete msg.message.messageContextInfo;
      const [type] = Object.keys(msg.message);
      this.emit("msg", { type, ...msg });
    }
  };

  #onMessagesUpdate = (updates) => {
    for (const { key, update } of updates) {
      if (update?.status === undefined) continue;
      this.emit("ack", {
        messageId: key?.id,
        to: key?.remoteJid,
        status: update.status,
      });
    }
  };

  /** Exponential backoff with jitter, so a WhatsApp outage is not hammered. */
  #reconnect(statusCode) {
    if (this.#stopped) return;

    if (this.#status.attempt >= this.#maxAttempts) {
      this.#status.reconnecting = false;
      this.#status.disconnected = true;
      this.emit("gave_up");
      return;
    }

    const attempt = this.#status.attempt++;
    this.#status.reconnecting = true;

    const delay = IMMEDIATE_RECONNECT.has(statusCode)
      ? 0
      : Math.min(this.#baseDelayMs * 2 ** attempt, this.#maxDelayMs) *
        (0.5 + Math.random() / 2);

    setTimeout(() => {
      this.#connect().catch((err) =>
        this.#logger.error({ err: err.message }, "reconnection attempt failed"),
      );
    }, delay);
  }

  #assertConnected() {
    if (!this.#status.connected) throw new WhatsappDisconnectedError();
  }

  /** Normalises a phone number or JID into a WhatsApp JID. */
  toJid(phone) {
    const value = phone?.toString().trim();
    if (!value) throw new Error("Invalid phone");
    if (SUFFIXES.some((suffix) => value.endsWith(suffix))) return value;
    return `${value.replace(/^\+/, "").replace(/\D/g, "")}@s.whatsapp.net`;
  }

  /**
   * Group and broadcast JIDs cannot be resolved by onWhatsApp; for everything
   * else the answer is cached, since the lookup counts towards rate limits.
   */
  async #exists(id) {
    if (
      id.endsWith("@g.us") ||
      id.endsWith("@broadcast") ||
      id.endsWith("@lid")
    ) {
      return true;
    }

    const cached = this.#existsCache.get(id);
    if (cached && cached.expiresAt > Date.now()) return cached.exists;

    const [result] = await this.#conn.onWhatsApp(id);
    const exists = Boolean(result?.exists ?? result);
    this.#existsCache.set(id, {
      exists,
      expiresAt: Date.now() + this.#existsTtlMs,
    });
    return exists;
  }

  async checkNumber(phone) {
    this.#assertConnected();
    const id = this.toJid(phone);
    return { jid: id, exists: await this.#exists(id) };
  }

  /** Requests an 8-digit pairing code as an alternative to scanning the QR. */
  async requestPairingCode(phone) {
    if (this.#status.connected) {
      throw new Error("Client is already paired.");
    }
    if (!this.#conn) {
      throw new WhatsappDisconnectedError();
    }
    const number = phone.toString().replace(/\D/g, "");
    try {
      return await this.#conn.requestPairingCode(number);
    } catch (err) {
      throw wrapError(err);
    }
  }

  /** Sends a message. Returns Baileys' result, which carries the message id. */
  sendMessage(phone, content, options) {
    return this.#queue.add(async () => {
      this.#assertConnected();
      const id = this.toJid(phone);

      if (!(await this.#exists(id))) {
        throw new WhatsappNumberNotFoundError(phone);
      }

      try {
        return await this.#conn.sendMessage(id, content, options);
      } catch (err) {
        throw wrapError(err);
      }
    });
  }

  async sendPresenceUpdate(type, phone) {
    this.#assertConnected();
    try {
      await this.#conn.sendPresenceUpdate(
        type,
        phone ? this.toJid(phone) : undefined,
      );
    } catch (err) {
      throw wrapError(err);
    }
  }

  async presenceSubscribe(phone) {
    this.#assertConnected();
    const id = this.toJid(phone);

    if (!(await this.#exists(id))) {
      throw new WhatsappNumberNotFoundError(phone);
    }

    try {
      await this.#conn.presenceSubscribe(id);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async updateProfileStatus(status) {
    this.#assertConnected();
    try {
      await this.#conn.updateProfileStatus(status);
    } catch (err) {
      throw wrapError(err);
    }
  }

  /** Keeps re-sending a presence so the account can appear permanently online. */
  setSendPresenceUpdateInterval(type, phone) {
    clearInterval(this.#presenceInterval);
    if (!type) return;

    const push = () =>
      this.sendPresenceUpdate(type, phone).catch(() =>
        clearInterval(this.#presenceInterval),
      );

    push();
    this.#presenceInterval = setInterval(push, 10000);
  }
}
