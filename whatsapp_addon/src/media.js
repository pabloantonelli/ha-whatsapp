import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";

const CORE = "http://supervisor/core";
const MEDIA_DIR = process.env.WHATSAPP_MEDIA_DIR || "/media/whatsapp";

/** Home Assistant writes recordings here; both sides see the same /media mount. */
const RECORDING_TIMEOUT_MS = 15000;

const http = () =>
  axios.create({
    baseURL: CORE,
    timeout: 60000,
    headers: { Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}` },
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Grabs a still frame from a camera or image entity. Both expose an
 * `entity_picture` that the Supervisor can proxy, so one path covers both.
 */
export const captureSnapshot = async (entityId) => {
  const client = http();
  const { data: state } = await client.get(`/api/states/${entityId}`);

  let url = state?.attributes?.entity_picture;
  if (!url && entityId.startsWith("camera.")) {
    url = `/api/camera_proxy/${entityId}`;
  }
  if (!url) {
    throw new Error(
      `Entity ${entityId} has no image to capture. Use a camera or image entity.`,
    );
  }

  const { data, headers } = await client.get(url, {
    responseType: "arraybuffer",
  });

  return {
    buffer: Buffer.from(data),
    mimetype: headers["content-type"] || "image/jpeg",
    name: state?.attributes?.friendly_name || entityId,
  };
};

/**
 * Records a clip through Home Assistant's camera.record service and reads it
 * back from the shared /media mount. `lookback` includes footage from before
 * the call, which is usually the part worth sending.
 */
export const captureRecording = async (entityId, { duration, lookback }) => {
  if (!entityId.startsWith("camera.")) {
    throw new Error(`Recording requires a camera entity, got ${entityId}.`);
  }

  await fs.mkdir(MEDIA_DIR, { recursive: true });

  const filename = `${entityId.replace(/\./g, "_")}-${Date.now()}.mp4`;
  const target = path.join(MEDIA_DIR, filename);

  await http().post("/api/services/camera/record", {
    entity_id: entityId,
    filename: target,
    duration,
    ...(lookback ? { lookback } : {}),
  });

  // The service returns as soon as recording starts, so wait for the file to
  // appear and stop growing before sending it.
  const deadline = Date.now() + duration * 1000 + RECORDING_TIMEOUT_MS;
  let lastSize = -1;

  while (Date.now() < deadline) {
    await sleep(1000);
    let size;
    try {
      ({ size } = await fs.stat(target));
    } catch {
      continue; // not created yet
    }
    if (size > 0 && size === lastSize) {
      return {
        buffer: await fs.readFile(target),
        mimetype: "video/mp4",
        path: target,
      };
    }
    lastSize = size;
  }

  throw new Error(
    `Recording ${entityId} did not finish in time. Does the camera support streaming?`,
  );
};

/** Builds the Baileys message content for a captured file. */
export const toMessageContent = ({ buffer, mimetype }, caption) => {
  if (mimetype.startsWith("video/")) {
    return { video: buffer, mimetype, ...(caption ? { caption } : {}) };
  }
  return { image: buffer, mimetype, ...(caption ? { caption } : {}) };
};
