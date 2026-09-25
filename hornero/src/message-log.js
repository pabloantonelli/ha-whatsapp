/**
 * A short, in-memory record of what went out and came in, so the panel can
 * show whether a message was actually sent and delivered.
 *
 * Deliberately not persisted: it lives until the add-on restarts, and holds
 * only a preview of each message rather than the full conversation.
 */

const PREVIEW_LENGTH = 180;

/** A readable one-line summary of whatever was sent. */
export const describeContent = (content) => {
  if (!content || typeof content !== "object") return String(content ?? "");

  if (typeof content.text === "string") return content.text;
  if (typeof content.caption === "string") return content.caption;
  if (content.image) return "📷 image";
  if (content.video) return "🎥 video";
  if (content.audio) return "🎤 audio";
  if (content.document) return "📄 document";
  if (content.location) return "📍 location";
  if (content.react) return `reaction ${content.react.text ?? ""}`.trim();

  const [type] = Object.keys(content);
  return type ?? "";
};

export class MessageLog {
  #limit;
  #entries = [];

  constructor({ limit = 50 } = {}) {
    this.#limit = limit;
  }

  #push(entry) {
    this.#entries.unshift(entry);
    if (this.#entries.length > this.#limit) this.#entries.length = this.#limit;
  }

  recordSent({ clientId, to, content, result }) {
    this.#push({
      direction: "out",
      clientId,
      jid: result?.key?.remoteJid ?? String(to),
      messageId: result?.key?.id ?? null,
      preview: describeContent(content).slice(0, PREVIEW_LENGTH),
      status: "sent",
      at: new Date().toISOString(),
    });
  }

  recordFailure({ clientId, to, content, error }) {
    this.#push({
      direction: "out",
      clientId,
      jid: String(to),
      messageId: null,
      preview: describeContent(content).slice(0, PREVIEW_LENGTH),
      status: "failed",
      error,
      at: new Date().toISOString(),
    });
  }

  recordReceived({ clientId, msg }) {
    const content = msg?.message ?? {};
    const text =
      content.conversation ??
      content.extendedTextMessage?.text ??
      describeContent(content);

    this.#push({
      direction: "in",
      clientId,
      jid: msg?.key?.remoteJid ?? "",
      messageId: msg?.key?.id ?? null,
      name: msg?.pushName ?? null,
      preview: String(text).slice(0, PREVIEW_LENGTH),
      at: new Date().toISOString(),
    });
  }

  /** WhatsApp reports delivery as a number; 3 is delivered, 4 is read. */
  markStatus(messageId, status) {
    if (!messageId) return;
    const entry = this.#entries.find(
      (item) => item.direction === "out" && item.messageId === messageId,
    );
    if (!entry) return;

    const labels = { 2: "sent", 3: "delivered", 4: "read", 5: "played" };
    entry.status = labels[status] ?? entry.status;
  }

  /** Most recent first. */
  get entries() {
    return [...this.#entries];
  }
}
