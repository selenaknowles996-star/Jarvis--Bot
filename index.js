import http from "http";
http.createServer((req,res)=>{res.end('JARVIS is Online')}).listen(process.env.PORT || 3000);
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) start();
    } else if (connection === "open") {
      console.log("JARVIS is online!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const cmd = text.trim().toLowerCase();

    if (cmd === ".ping") {
      await sock.sendMessage(from, { text: "Pong! JARVIS is alive ⚡" });
    }
    if (cmd === ".menu" || cmd === ".help") {
      await sock.sendMessage(from, { text: "🤖 *JARVIS BOT*\n\n.ping - Check if bot is alive\n.menu - Show this menu\n.hi - Say hello" });
    }
    if (cmd === ".hi" || cmd === "hi") {
      await sock.sendMessage(from, { text: "Hello! I am JARVIS, your WhatsApp bot." });
    }
  });
}

start();
