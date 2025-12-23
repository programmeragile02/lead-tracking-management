import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { ensureWaClient, sendWaMessage } from "@/lib/whatsapp-service";
import { emitRealtime } from "@/lib/realtime";
import { getWaTargetFromLead } from "@/lib/wa-utils";
import { canAccessLead } from "@/lib/lead-access";

export const runtime = "nodejs";

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
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_lead_id" },
      { status: 400 }
    );
  }

  const { message } = await req.json();
  if (!message || !message.trim()) {
    return NextResponse.json(
      { ok: false, error: "message_required" },
      { status: 400 }
    );
  }

  // === ambil lead + sales + hirarki ===
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      sales: {
        select: {
          id: true,
          name: true,
          teamLeaderId: true,
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found" },
      { status: 404 }
    );
  }

  // === GUARD AKSES ===
  if (!canAccessLead(user, lead)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  // === OWNER WA HARUS ADA ===
  const salesId = lead.salesId;
  if (!salesId) {
    return NextResponse.json(
      { ok: false, error: "lead_has_no_sales" },
      { status: 400 }
    );
  }

  // === ambil chat terakhir (untuk waChatId) ===
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

  // 1) SIMPAN MESSAGE (PENDING)
  const leadMessage = await prisma.leadMessage.create({
    data: {
      leadId: lead.id,

      // WA OWNER (SALES)
      salesId: salesId,

      // AUDIT
      sentById: user.id,
      sentByRole: user.roleSlug,

      channel: "WHATSAPP",
      direction: "OUTBOUND",

      waChatId: lastMsg?.waChatId ?? null,
      toNumber: lead.phone ?? null,
      content: message.trim(),
      waStatus: "PENDING",
    },
  });

  // realtime optimistic update
  await emitRealtime({
    room: `lead:${lead.id}`,
    event: "wa_outbound_created",
    payload: {
      leadId: lead.id,
      message: leadMessage,
    },
  });

  // 2) KIRIM VIA WA SERVICE (PASTI SALES)
  try {
    const sendResult = await sendWaMessage({
      userId: salesId, 
      to: waTarget,
      body: message.trim(),
      meta: {
        leadId: lead.id,
        leadMessageId: leadMessage.id,
        sentById: user.id,
        sentByRole: user.roleSlug,
      },
    });

    // === 3) UPDATE WA MESSAGE ID ===
    const updated = await prisma.leadMessage.update({
      where: { id: leadMessage.id },
      data: {
        waMessageId: sendResult.waMessageId,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[lead-whatsapp] send error:", err);

    await prisma.leadMessage.update({
      where: { id: leadMessage.id },
      data: { waStatus: "FAILED" },
    });

    return NextResponse.json(
      { ok: false, error: "send_failed" },
      { status: 500 }
    );
  }
}
