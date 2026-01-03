import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { sendWaDocument, ensureWaClient } from "@/lib/whatsapp-service";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { emitRealtime } from "@/lib/realtime";
import { getWaTargetFromLead } from "@/lib/wa-utils";
import { canAccessLead } from "@/lib/lead-access";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_lead_id" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string | null) || "";

  if (!file) {
    return NextResponse.json(
      { ok: false, error: "file_required" },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { ok: false, error: "file_must_be_pdf" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      sales: {
        select: {
          id: true,
          teamLeaderId: true,
        },
      },
    },
  });

  if (!lead || lead.isExcluded) {
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

  const salesId = lead.salesId;
  if (!salesId) {
    return NextResponse.json(
      { ok: false, error: "lead_has_no_sales" },
      { status: 400 }
    );
  }

  const lastMsg = await prisma.leadMessage.findFirst({
    where: {
      leadId,
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

  // === SIMPAN FILE ===
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `proposal-${leadId}-${randomUUID()}.pdf`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "proposals");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);

  const publicUrl = `/uploads/proposals/${fileName}`;
  const baseUrl = process.env.APP_PUBLIC_BASE_URL || "http://localhost:3015";
  const absoluteUrl = new URL(publicUrl, baseUrl).toString();

  // === 1) CREATE MESSAGE ===
  const leadMessage = await prisma.leadMessage.create({
    data: {
      leadId,
      salesId,

      // AUDIT
      sentById: user.id,
      sentByRole: user.roleSlug,

      channel: "WHATSAPP",
      direction: "OUTBOUND",

      waChatId: lastMsg?.waChatId ?? null,
      toNumber: lead.phone ?? null,

      content: caption,
      type: "MEDIA",
      mediaUrl: publicUrl,
      mediaName: fileName,
      mediaMime: "application/pdf",
      waStatus: "PENDING",
    },
  });

  // update lastmessage
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      lastMessageAt: new Date(),
      lastOutboundAt: new Date(),
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

  // === 2) SEND VIA WA SALES ===
  try {
    const waResult = await sendWaDocument({
      userId: salesId,
      to: waTarget,
      fileUrl: absoluteUrl,
      fileName,
      mimetype: "application/pdf",
      caption,
    });

    await prisma.leadMessage.update({
      where: { id: leadMessage.id },
      data: { waMessageId: waResult.waMessageId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WA-PROPOSAL] send failed:", err);

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
