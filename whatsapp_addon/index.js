import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import { WhatsappClient } from "./whatsapp.js";
import log4js from "log4js";
import qrimage from "qr-image";

const logger = log4js.getLogger();
logger.level = "info";

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const clients = {};

const onReady = (key) => {
  logger.info(key, "client is ready.");
  axios.post(
    "http://supervisor/core/api/services/persistent_notification/dismiss",
    {
      notification_id: `whatsapp_addon_qrcode_${key}`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}`,
      },
    }
  ).catch(err => logger.error("Error dismissing notification:", err.message));
};

const onQr = (qr, key) => {
  logger.info(
    key,
    "require authentication over QRCode, please see your notifications..."
  );

  const code = qrimage.image(qr, { type: "png" });

  code.on("readable", function () {
    const img_string = code.read().toString("base64");
    axios.post(
      "http://supervisor/core/api/services/persistent_notification/create",
      {
        title: `Whatsapp QRCode (${key})`,
        message: `Please scan the following QRCode for **${key}** client... ![QRCode](data:image/png;base64,${img_string})`,
        notification_id: `whatsapp_addon_qrcode_${key}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}`,
        },
      }
    ).catch(err => logger.error("Error creating notification:", err.message));
  });
};

const onMsg = (msg, key) => {
  axios.post(
    "http://supervisor/core/api/events/new_whatsapp_message",
    { clientId: key, ...msg },
    {
      headers: {
        Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}`,
      },
    }
  ).catch(err => logger.error("Error firing message event:", err.message));
  logger.debug(`New message event fired from ${key}.`);
};

const onPresenceUpdate = (presence, key) => {
  axios.post(
    "http://supervisor/core/api/events/whatsapp_presence_update",
    { clientId: key, ...presence },
    {
      headers: {
        Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}`,
      },
    }
  ).catch(err => logger.error("Error firing presence event:", err.message));
  logger.debug(`New presence event fired from ${key}.`);
};

const onLogout = async (key) => {
  logger.info(`Client ${key} was logged out. Restarting...`);

  // Use promises version of fs for better async handling
  try {
    await fs.promises.rm(`/data/${key}`, { recursive: true, force: true });
  } catch (err) {
    logger.error(`Error removing data for ${key}:`, err.message);
  }

  init(key);
};

const init = (key) => {
  clients[key] = new WhatsappClient({ path: `/data/${key}` });

  clients[key].on("restart", () => logger.debug(`${key} client restarting...`));
  clients[key].on("qr", (qr) => onQr(qr, key));
  clients[key].once("ready", () => onReady(key));
  clients[key].on("msg", (msg) => onMsg(msg, key));
  clients[key].on("logout", () => onLogout(key));
  clients[key].on("presence_update", (presence) =>
    onPresenceUpdate(presence, key)
  );
};

// Read options and initialize clients
fs.readFile("data/options.json", function (error, content) {
  if (error) {
    logger.error("Error reading options.json:", error.message);
    process.exit(1);
  }

  const options = JSON.parse(content);

  options.clients.forEach((key) => {
    init(key);
  });

  app.listen(port, () => logger.info(`Whatsapp Addon started on port ${port}.`));

  // Send message endpoint
  app.post("/sendMessage", async (req, res) => {
    const message = req.body;

    if (!message.hasOwnProperty("clientId")) {
      logger.error("Error in sending message. Please specify client ID.");
      return res.status(400).json({ status: "KO", error: "Client ID required" });
    }

    if (!clients.hasOwnProperty(message.clientId)) {
      logger.error("Error in sending message. Client ID not found.");
      return res.status(404).json({ status: "KO", error: "Client not found" });
    }

    const wapp = clients[message.clientId];

    try {
      await wapp.sendMessage(message.to, message.body, message.options);
      logger.debug("Message successfully sent from addon.");
      res.json({ status: "OK" });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ status: "KO", error: error.message });
    }
  });

  // Set status endpoint
  app.post("/setStatus", async (req, res) => {
    const status = req.body.status;

    if (!req.body.hasOwnProperty("clientId")) {
      logger.error("Error in set status. Please specify client ID.");
      return res.status(400).json({ status: "KO", error: "Client ID required" });
    }

    if (!clients.hasOwnProperty(req.body.clientId)) {
      logger.error("Error in set status. Client ID not found.");
      return res.status(404).json({ status: "KO", error: "Client not found" });
    }

    const wapp = clients[req.body.clientId];

    try {
      await wapp.updateProfileStatus(status);
      res.json({ status: "OK" });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ status: "KO", error: error.message });
    }
  });

  // Presence subscribe endpoint
  app.post("/presenceSubscribe", async (req, res) => {
    const request = req.body;

    if (!req.body.hasOwnProperty("clientId")) {
      logger.error("Error in subscribe presence. Please specify client ID.");
      return res.status(400).json({ status: "KO", error: "Client ID required" });
    }

    if (!clients.hasOwnProperty(req.body.clientId)) {
      logger.error("Error in subscribe presence. Client ID not found.");
      return res.status(404).json({ status: "KO", error: "Client not found" });
    }

    const wapp = clients[req.body.clientId];

    try {
      await wapp.presenceSubscribe(request.userId);
      res.json({ status: "OK" });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ status: "KO", error: error.message });
    }
  });

  // Send presence update endpoint
  app.post("/sendPresenceUpdate", async (req, res) => {
    const request = req.body;

    if (!req.body.hasOwnProperty("clientId")) {
      logger.error("Error in presence update. Please specify client ID.");
      return res.status(400).json({ status: "KO", error: "Client ID required" });
    }

    if (!clients.hasOwnProperty(req.body.clientId)) {
      logger.error("Error in presence update. Client ID not found.");
      return res.status(404).json({ status: "KO", error: "Client not found" });
    }

    const wapp = clients[req.body.clientId];

    try {
      await wapp.sendPresenceUpdate(request.type, request.to);
      res.json({ status: "OK" });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ status: "KO", error: error.message });
    }
  });

  // Send infinity presence update endpoint
  app.post("/sendInfinityPresenceUpdate", async (req, res) => {
    const request = req.body;

    if (!req.body.hasOwnProperty("clientId")) {
      logger.error("Error in presence update. Please specify client ID.");
      return res.status(400).json({ status: "KO", error: "Client ID required" });
    }

    if (!clients.hasOwnProperty(req.body.clientId)) {
      logger.error("Error in presence update. Client ID not found.");
      return res.status(404).json({ status: "KO", error: "Client not found" });
    }

    const wapp = clients[req.body.clientId];

    try {
      wapp.setSendPresenceUpdateInterval(request.type, request.to);
      res.json({ status: "OK" });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ status: "KO", error: error.message });
    }
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    const clientsStatus = {};
    Object.keys(clients).forEach(key => {
      clientsStatus[key] = {
        connected: clients[key]?._status?.connected || false,
      };
    });

    res.json({
      status: "OK",
      version: "2.0.0",
      baileys: "7.0.0-rc.9",
      clients: clientsStatus,
    });
  });
});
