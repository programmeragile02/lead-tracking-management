import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { emitRealtime } from "@/lib/realtime";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const leadId = Number(id);

  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, message: "ID lead tidak valid" },
      { status: 400 }
    );
  }

  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // hanya manager & team leader
  if (
    currentUser.roleCode !== "MANAGER" &&
    currentUser.roleCode !== "TEAM_LEADER"
  ) {
    return NextResponse.json(
      { ok: false, message: "Tidak punya akses assign lead" },
      { status: 403 }
    );
  }

  let body: {
    toSalesId?: number;
    reason?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Payload tidak valid" },
      { status: 400 }
    );
  }

  const { toSalesId, reason } = body;

  if (!toSalesId) {
    return NextResponse.json(
      { ok: false, message: "Target sales wajib diisi" },
      { status: 400 }
    );
  }

  // ambil lead
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      name: true,
      salesId: true,
    },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, message: "Lead tidak ditemukan" },
      { status: 404 }
    );
  }

  const fromSales = lead.salesId
    ? await prisma.user.findUnique({
        where: { id: lead.salesId },
        select: { id: true, name: true },
      })
    : null;

  const actor = {
    id: currentUser.id,
    name: currentUser.name,
  };

  // ambil target sales
  const targetSales = await prisma.user.findUnique({
    where: { id: toSalesId },
    select: {
      id: true,
      name: true,
      role: { select: { code: true } },
      isActive: true,
      teamLeaderId: true,
    },
  });

  if (!targetSales || !targetSales.isActive) {
    return NextResponse.json(
      { ok: false, message: "Sales target tidak valid atau nonaktif" },
      { status: 400 }
    );
  }

  // VALIDASI: hanya SALES
  if (targetSales.role?.code !== "SALES") {
    return NextResponse.json(
      { ok: false, message: "Lead hanya boleh diassign ke SALES" },
      { status: 400 }
    );
  }

  // VALIDASI SCOPE TL
  if (
    currentUser.roleCode === "TEAM_LEADER" &&
    targetSales.teamLeaderId !== currentUser.id
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sales tersebut bukan bawahan Anda",
      },
      { status: 403 }
    );
  }

  // kalau sales sama, tolak
  if (lead.salesId === toSalesId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Lead sudah dimiliki oleh sales tersebut",
      },
      { status: 400 }
    );
  }

  // =========================
  // TRANSACTION
  // =========================
  await prisma.$transaction(async (tx) => {
    // 1. audit reassignment
    await tx.leadAssignmentHistory.create({
      data: {
        leadId,
        fromSalesId: lead.salesId,
        toSalesId,
        assignedById: currentUser.id,
        assignedByRole: currentUser.roleCode,
        reason,
      },
    });

    // 2. update owner lead
    await tx.lead.update({
      where: { id: leadId },
      data: {
        salesId: toSalesId,
      },
    });

    // 3. pause nurturing (jika ada)
    await tx.leadNurturingState.updateMany({
      where: { leadId },
      data: {
        status: "PAUSED",
        pauseReason: "SYSTEM_RULE",
      },
    });

    // 4. activity otomatis
    await tx.leadActivity.create({
      data: {
        leadId,
        title: "Lead Dipindahkan",
        description: reason
          ? `Lead dipindahkan ke sales baru. Alasan: ${reason}`
          : "Lead dipindahkan ke sales baru",
        happenedAt: new Date(),
        createdById: currentUser.id,
      },
    });
  });

  // SALES BARU (DAPET LEAD)
  await emitRealtime({
    room: `user:${toSalesId}`,
    event: "lead_list_changed",
    payload: {
      type: "ASSIGNED_TO_YOU",
      leadId: lead.id,
      leadName: lead.name,
      fromSalesId: fromSales?.id ?? null,
      fromSalesName: fromSales?.name ?? null,
      assignedById: actor.id,
      assignedByName: actor.name,
      at: new Date().toISOString(),
    },
  });

  // SALES LAMA (KEHILANGAN LEAD)
  if (fromSales?.id) {
    await emitRealtime({
      room: `user:${fromSales.id}`,
      event: "lead_list_changed",
      payload: {
        type: "REMOVED_FROM_YOU",
        leadId: lead.id,
        leadName: lead.name,
        toSalesId,
        toSalesName: targetSales.name,
        assignedById: actor.id,
        assignedByName: actor.name,
        at: new Date().toISOString(),
      },
    });
  }

  // ACTOR (MANAGER / TL)
  await emitRealtime({
    room: `user:${actor.id}`,
    event: "lead_list_changed",
    payload: {
      type: "ASSIGN_ACTIVITY",
      leadId: lead.id,
      leadName: lead.name,
      fromSalesId: fromSales?.id ?? null,
      toSalesId,
      toSalesName: targetSales.name,
      at: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Lead berhasil dipindahkan ke sales baru",
  });
}
