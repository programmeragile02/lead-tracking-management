import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WEBHOOK_KEY = process.env.WA_WEBHOOK_KEY || "";

export async function POST(req: NextRequest) {
  if (WEBHOOK_KEY) {
    const headerKey = req.headers.get("x-wa-webhook-key");
    if (headerKey !== WEBHOOK_KEY) {
      return NextResponse.json(
        { ok: false, error: "invalid_webhook_key" },
        { status: 401 }
      );
    }
  }

  const body = await req.json();
  const { userId, phoneNumber, waUserJid, status } = body;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId_required" },
      { status: 400 }
    );
  }

  const validStatuses = [
    "PENDING_QR",
    "CONNECTED",
    "DISCONNECTED",
    "ERROR",
  ] as const;
  const normalizedStatus =
    typeof status === "string" &&
    (validStatuses as readonly string[]).includes(status)
      ? status
      : "CONNECTED";

  try {
    const session = await prisma.whatsAppSession.upsert({
      where: { userId: Number(userId) },
      create: {
        userId: Number(userId),
        phoneNumber: phoneNumber || null,
        waUserJid: waUserJid || null,
        status: normalizedStatus as any,
        lastConnectedAt: normalizedStatus === "CONNECTED" ? new Date() : null,
        lastSeenAt: new Date(),
      },
      update: {
        phoneNumber: phoneNumber || null,
        waUserJid: waUserJid || null,
        status: normalizedStatus as any,
        lastConnectedAt:
          normalizedStatus === "CONNECTED" ? new Date() : undefined,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, data: session });
  } catch (err) {
    console.error("[session-sync] error:", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
