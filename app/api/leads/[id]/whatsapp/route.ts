import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { sendWaMessage } from "@/lib/whatsapp-service";
import { emitRealtime } from "@/lib/realtime";
import { getWaTargetFromLead } from "@/lib/wa-utils";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const leadId = Number(id);
  const { message } = await req.json();

  if (!message || !message.trim()) {
    return NextResponse.json(
      { ok: false, error: "message_required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found" },
      { status: 404 }
    );
  }

  // aturan: sales hanya boleh kirim ke lead miliknya
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  // if (!lead.phone) {
  //   return NextResponse.json(
  //     { ok: false, error: "lead_has_no_phone" },
  //     { status: 400 }
  //   );
  // }

  const lastMsg = await prisma.leadMessage.findFirst({
    where: {
      leadId: lead.id,
      channel: "WHATSAPP",
    },
    orderBy: { createdAt: "desc" },
    select: { waChatId: true },
  });

  const waTarget = getWaTargetFromLead(lead, lastMsg?.waChatId);

  if (!waTarget) {
    return NextResponse.json(
      { ok: false, error: "no_whatsapp_target" },
      { status: 400 }
    );
  }

  // 1. simpan pesan sebagai OUTBOUND di DB
  const leadMessage = await prisma.leadMessage.create({
    data: {
      leadId: lead.id,
      salesId: user.id,
      channel: "WHATSAPP",
      direction: "OUTBOUND",
      waChatId: lastMsg?.waChatId ?? null,
      fromNumber: user.phone || null,
      toNumber: lead.phone || null,
      content: message.trim(),
      waStatus: "PENDING",
      sentAt: null,
    },
  });

  await emitRealtime({
    room: `lead:${lead.id}`,
    event: "wa_outbound_created",
    payload: {
      leadId: lead.id,
      message: leadMessage,
    },
  });

  // const toNumber = lead.phone.replace(/[^0-9]/g, ""); // normalisasi simpel

  // 2. kirim pesan ke WA service
  try {
    const sendResult = await sendWaMessage({
      userId: user.id,
      to: waTarget,
      body: message.trim(),
      meta: {
        leadId: lead.id,
        leadMessageId: leadMessage.id,
      },
    });

    // 3. update waMessageId
    const updated = await prisma.leadMessage.update({
      where: { id: leadMessage.id },
      data: { waMessageId: sendResult.waMessageId },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[lead-whatsapp] send error:", err);

    await prisma.leadMessage.update({
      where: { id: leadMessage.id },
      data: { waStatus: "FAILED" },
    });

    // optional: tandai error
    return NextResponse.json(
      { ok: false, error: "send_failed" },
      { status: 500 }
    );
  }
}
