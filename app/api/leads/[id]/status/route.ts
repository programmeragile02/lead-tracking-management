import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Body = {
  statusId?: number;
  note?: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid lead id" },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Body;

  if (!body.statusId || Number.isNaN(body.statusId)) {
    return NextResponse.json(
      { ok: false, error: "statusId is required" },
      { status: 400 }
    );
  }

  const statusId = body.statusId;

  const [lead, targetStatus] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, salesId: true, isExcluded: true },
    }),
    prisma.leadStatus.findUnique({
      where: { id: statusId },
    }),
  ]);

  if (!lead || lead.isExcluded) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  if (!targetStatus || !targetStatus.isActive) {
    return NextResponse.json(
      { ok: false, error: "Status not found or inactive" },
      { status: 400 }
    );
  }

  // SALES hanya boleh ubah lead miliknya
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const ownerSalesId = lead.salesId ?? user.id;

  // Rule: HOT / CLOSE_WON / CLOSE_LOST → nurturing STOPPED
  const shouldStopNurturing = ["CLOSE_WON", "CLOSE_LOST"].includes(
    targetStatus.code.toUpperCase()
  );

  const now = new Date();

  const [updatedLead] = await prisma.$transaction([
    // 1️ Update status lead
    prisma.lead.update({
      where: { id: leadId },
      data: {
        statusId: targetStatus.id,
      },
    }),

    // 2️ History status
    prisma.leadStatusHistory.create({
      data: {
        leadId,
        statusId: targetStatus.id,
        changedById: user.id,
        salesId: ownerSalesId,
        note: body.note || null,
      },
    }),

    // 3️ Stop nurturing (jika perlu)
    ...(shouldStopNurturing
      ? [
          prisma.leadNurturingState.upsert({
            where: { leadId },
            create: {
              leadId,
              status: NurturingStatus.STOPPED,
              manualPaused: false,
              pauseReason: null,
              pausedAt: null,
              nextSendAt: null,
              currentStep: 0,
              startedAt: null,
              lastSentAt: null,
              lastMessageKey: null,
            },
            update: {
              status: NurturingStatus.STOPPED,
              manualPaused: false,
              pauseReason: null,
              pausedAt: null,
              nextSendAt: null,
              startedAt: null,
              lastSentAt: null,
              lastMessageKey: null,
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      lead: updatedLead,
      stoppedNurturing: shouldStopNurturing,
      at: now.toISOString(),
    },
  });
}
