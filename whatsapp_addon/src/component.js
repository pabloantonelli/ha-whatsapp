/**
 * Copyright © 2026 Pablo Antonelli
 * Licensed under the Apache License, Version 2.0. See the LICENSE file.
 */
import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";

const COMPONENT_DIR = process.env.WHATSAPP_COMPONENT_DIR
  || "/config/custom_components/whatsapp";

/**
 * Asks the Supervisor for this add-on's own hostname. That name is stable for
 * the life of the install and always resolves to the current container IP,
 * unlike the IP itself, which Docker reassigns on restart.
 */
const fetchHostname = async (logger) => {
  try {
    const { data } = await axios.get("http://supervisor/addons/self/info", {
      timeout: 10000,
      headers: { Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}` },
    });
    return data?.data?.hostname || null;
  } catch (err) {
    logger.warn({ err: err.message }, "could not read the add-on hostname from the Supervisor");
    return null;
  }
};

/**
 * Writes the endpoint the custom component talks to. The component reads this
 * file at call time, so a changed hostname or token takes effect without
 * reinstalling it — which is what the v2.x `sed` on whatsapp.py needed.
 */
export const writeConnectionFile = async ({ port, token, logger }) => {
  const hostname = (await fetchHostname(logger)) || process.env.HOSTNAME;

  if (!hostname) {
    logger.error("no hostname available; the custom component will not be able to reach the add-on");
    return null;
  }

  const target = path.join(COMPONENT_DIR, "connection.json");
  const payload = { base_url: `http://${hostname}:${port}`, token };

  try {
    await fs.mkdir(COMPONENT_DIR, { recursive: true });
    await fs.writeFile(target, JSON.stringify(payload, null, 2));
    logger.info({ base_url: payload.base_url }, "custom component endpoint written");
    return payload.base_url;
  } catch (err) {
    logger.error({ err: err.message }, "could not write the custom component endpoint");
    return null;
  }
};
