require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const PORT = Number(process.env.PORT || 3016);
const SOCKET_CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || true;
const SOCKET_ADMIN_KEY = process.env.SOCKET_ADMIN_KEY || "";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: SOCKET_CORS_ORIGIN === "true" ? true : SOCKET_CORS_ORIGIN,
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: SOCKET_CORS_ORIGIN === "true" ? true : SOCKET_CORS_ORIGIN,
    credentials: true,
  },
});

// --- Rooms convention ---
// lead:{leadId}
// user:{userId}

io.on("connection", (socket) => {
  // Client join rooms
  socket.on("join", ({ leadId, userId }) => {
    if (leadId) socket.join(`lead:${leadId}`);
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on("leave", ({ leadId, userId }) => {
    if (leadId) socket.leave(`lead:${leadId}`);
    if (userId) socket.leave(`user:${userId}`);
  });

  socket.on("disconnect", () => {
    // optional log
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

/**
 * Server-to-server emit endpoint (dipanggil dari Next API)
 * Header: x-socket-admin-key: <SOCKET_ADMIN_KEY>
 * Body: { room: "lead:123", event: "wa_inbound", payload: {...} }
 */
app.post("/emit", (req, res) => {
  const key = req.headers["x-socket-admin-key"];
  if (!SOCKET_ADMIN_KEY || key !== SOCKET_ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { room, event, payload } = req.body || {};
  if (!room || !event) {
    return res.status(400).json({ ok: false, error: "missing_room_or_event" });
  }

  io.to(room).emit(event, payload || null);
  return res.json({ ok: true });
});

server.listen(PORT, () => {
  console.log(`[SOCKET] listening on ${PORT}`);
});
