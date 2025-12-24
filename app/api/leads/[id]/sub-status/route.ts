import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await ctx.params;
  const leadId = Number(id);
  const { subStatusId, note } = await req.json();

  if (!leadId || !subStatusId) {
    return NextResponse.json(
      { ok: false, message: "Invalid payload" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      statusId: true,
      salesId: true,
    },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, message: "Lead not found" },
      { status: 404 }
    );
  }

  // ambil sub status + status induknya
  const subStatus = await prisma.leadSubStatus.findUnique({
    where: { id: subStatusId },
    include: { status: true },
  });

  if (!subStatus || !subStatus.isActive) {
    return NextResponse.json(
      { ok: false, message: "Sub status not found" },
      { status: 400 }
    );
  }

  const now = new Date();
  const statusChanged = lead.statusId !== subStatus.statusId;

  await prisma.$transaction(async (tx) => {
    // 1️⃣ update lead
    await tx.lead.update({
      where: { id: leadId },
      data: {
        subStatusId: subStatus.id,
        statusId: subStatus.statusId,
      },
    });

    // 2️⃣ history sub status
    await tx.leadSubStatusHistory.create({
      data: {
        leadId,
        subStatusId: subStatus.id,
        changedById: user.id,
        salesId: lead.salesId ?? user.id,
        note: note || null,
      },
    });

    // 3️⃣ history status utama (HANYA kalau berubah)
    if (statusChanged) {
      await tx.leadStatusHistory.create({
        data: {
          leadId,
          statusId: subStatus.statusId,
          changedById: user.id,
          salesId: lead.salesId ?? user.id,
          note: "Update otomatis dari sub status",
        },
      });
    }

    // 4️⃣ activity log
    await tx.leadActivity.create({
      data: {
        leadId,
        title: "Sub status diubah",
        description: statusChanged
          ? `Sub status diubah ke "${subStatus.name}" dan status utama ikut diperbarui`
          : `Sub status diubah ke "${subStatus.name}"`,
        happenedAt: now,
        createdById: user.id,
      },
    });
  });

  return NextResponse.json({
    ok: true,
    data: {
      subStatus,
      status: subStatus.status,
      statusChanged,
    },
  });
}
