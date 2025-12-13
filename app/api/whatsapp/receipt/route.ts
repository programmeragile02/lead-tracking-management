import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";
import { NextRequest, NextResponse } from "next/server";

const WA_WEBHOOK_KEY = process.env.WA_WEBHOOK_KEY || "";

export async function POST(req: NextRequest) {
  // auth dari WA service
  const key = req.headers.get("x-wa-webhook-key") || "";
  if (!WA_WEBHOOK_KEY || key !== WA_WEBHOOK_KEY) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { waMessageId, waStatus, at } = body;

  const time = new Date(at || Date.now());

  const data: any = { waStatus };

  if (waStatus === "SENT") data.sentAt = time;
  if (waStatus === "DELIVERED") data.deliveredAt = time;
  if (waStatus === "READ") data.readAt = time;

  const allowed = new Set(["SENT", "DELIVERED", "READ", "FAILED", "PENDING"]);
  if (!waMessageId || !allowed.has(String(waStatus))) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 }
    );
  }

  // update db
  await prisma.leadMessage.updateMany({
    where: { waMessageId },
    data,
  });

  // ambil leadId untuk room
  const msg = await prisma.leadMessage.findFirst({
    where: { waMessageId },
    select: {
      leadId: true,
      id: true,
      waStatus: true,
      sentAt: true,
      deliveredAt: true,
      readAt: true,
    },
  });

  const leadId = msg?.leadId ?? null;

  if (leadId) {
    await emitRealtime({
      room: `lead:${leadId}`,
      event: "wa_receipt",
      payload: {
        leadId,
        waMessageId,
        waStatus,
        at: time.toISOString(),
      },
    });
  }

  return NextResponse.json({ ok: true, data: { leadId } });
}
