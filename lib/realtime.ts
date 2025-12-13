export async function emitRealtime(params: {
  room: string;
  event: string;
  payload?: any;
}) {
  const base = process.env.SOCKET_SERVER_URL || "";
  const key = process.env.SOCKET_ADMIN_KEY || "";

  if (!base || !key) {
    console.warn("[realtime] ENV missing", {
      SOCKET_SERVER_URL: base,
      SOCKET_ADMIN_KEY: key ? "***" : "",
    });
    return;
  }

  try {
    await fetch(`${base}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-admin-key": key,
      },
      body: JSON.stringify(params),
    });
  } catch (e) {
    // optional log
    console.error("[realtime] emit failed:", e);
  }
}
