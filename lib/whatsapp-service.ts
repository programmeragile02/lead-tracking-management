const WA_SERVICE_BASE = process.env.WA_SERVICE_BASE || "http://localhost:4004";

export async function ensureWaClient(userId: number) {
  await fetch(`${WA_SERVICE_BASE}/clients/${userId}/start`, {
    method: "POST",
  });
}

export async function fetchWaQr(userId: number) {
  const resp = await fetch(`${WA_SERVICE_BASE}/clients/${userId}/qr`, {
    method: "GET",
    cache: "no-store",
  });
  if (!resp.ok) {
    throw new Error("Failed to fetch WA QR");
  }
  return resp.json() as Promise<{
    ok: boolean;
    status: string;
    qrDataUrl: string | null;
    phoneNumber?: string | null;
  }>;
}

export async function sendWaMessage(params: {
  userId: number;
  to: string;
  body: string;
  meta?: any;
}) {
  const resp = await fetch(`${WA_SERVICE_BASE}/messages/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const json = await resp.json();
  if (!resp.ok || !json.ok) {
    throw new Error(json.error || "Failed to send WA message");
  }
  return json as {
    ok: boolean;
    waMessageId: string;
    meta?: any;
  };
}

export async function sendWaDocument(params: {
  userId: number;
  to: string; // "628xxxx"
  fileUrl: string; // URL publik PDF
  fileName: string;
  mimetype: string; // "application/pdf"
  caption?: string;
}) {
  const resp = await fetch(`${WA_SERVICE_BASE}/messages/send-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const json = await resp.json();
  if (!resp.ok || !json.ok) {
    throw new Error(json.error || "Failed to send WA document");
  }

  return json as {
    ok: boolean;
    waMessageId: string;
  };
}

export async function logoutWaClient(userId: number) {
  const resp = await fetch(`${WA_SERVICE_BASE}/clients/${userId}/logout`, {
    method: "POST",
  });
  const json = await resp.json();
  if (!resp.ok || !json.ok) {
    throw new Error(json.error || "Failed to logout WA client");
  }
  return json;
}

// sync chat
export async function fetchWaHistory(params: {
  userId: number;
  peer: string; // "628xxxx" atau "@c.us"
  limit?: number;
}) {
  const resp = await fetch(`${WA_SERVICE_BASE}/messages/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-wa-webhook-key": process.env.WA_WEBHOOK_KEY || "",
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const json = await resp.json();
  if (!resp.ok || !json.ok)
    throw new Error(json.error || "Failed to fetch WA history");
  return json as {
    ok: boolean;
    data: {
      peerJid: string;
      messages: Array<{
        waMessageId: string;
        waChatId: string;
        fromMe: boolean;
        body: string;
        timestamp: number; // unix seconds
        from?: string | null;
        to?: string | null;
      }>;
      note?: string;
    };
  };
}

export async function fetchWaStatus(userId: number) {
  const resp = await fetch(`${WA_SERVICE_BASE}/clients/${userId}/status`, {
    cache: "no-store",
  });

  if (!resp.ok) {
    throw new Error("Failed to fetch WA status");
  }

  return resp.json() as Promise<{
    ok: boolean;
    status: "INIT" | "PENDING_QR" | "CONNECTED" | "DISCONNECTED" | "ERROR";
    phoneNumber?: string | null;
  }>;
}
