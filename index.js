const express = require("express");
const cors = require("cors");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

const app = express();
app.use(cors());
app.use(express.json());

let sock;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "open") {
            console.log("✅ Bot conectado a WhatsApp");
        }
    });
}

// Ruta para enviar mensajes
app.post("/send", async (req, res) => {
    const { numero, mensaje } = req.body;

    if (!numero || !mensaje) {
        return res.status(400).json({ error: "Número y mensaje son requeridos" });
    }

    try {
        const jid = numero.replace(/[^0-9]/g, "") + "@s.whatsapp.net"; // Formato correcto
        await sock.sendMessage(jid, { text: mensaje });
        console.log(`📤 Mensaje enviado a ${numero}: ${mensaje}`);
        res.json({ success: true, message: "Mensaje enviado" });
    } catch (error) {
        console.error("❌ Error enviando mensaje:", error);
        res.status(500).json({ error: "No se pudo enviar el mensaje" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    startBot();
});

