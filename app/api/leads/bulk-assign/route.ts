import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { emitRealtime } from "@/lib/realtime";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!["MANAGER", "TEAM_LEADER"].includes(user.roleCode)) {
    return NextResponse.json(
      { ok: false, message: "Tidak memiliki akses" },
      { status: 403 }
    );
  }

  const { filters, toSalesId, reason } = await req.json();

  if (!toSalesId) {
    return NextResponse.json(
      { ok: false, message: "Target sales wajib dipilih" },
      { status: 400 }
    );
  }

  const raw = filters || {};

  const cleanFilters = {
    status: raw.status && raw.status !== "ALL" ? raw.status : null,
    subStatus: raw.subStatus && raw.subStatus !== "ALL" ? raw.subStatus : null,
    stage: raw.stage && raw.stage !== "ALL" ? Number(raw.stage) : null,
    salesId: raw.salesId && raw.salesId !== "ALL" ? Number(raw.salesId) : null,
  };

  // ================= FILTER =================
  const where: any = {
    isExcluded: false,
  };

  if (cleanFilters.status) where.status = { code: cleanFilters.status };

  if (cleanFilters.subStatus)
    where.subStatus = { code: cleanFilters.subStatus };

  if (cleanFilters.stage) where.stageId = cleanFilters.stage;

  if (cleanFilters.salesId) where.salesId = cleanFilters.salesId;

  // === VALIDATION ===
  if (!filters?.status) {
    return NextResponse.json(
      { ok: false, message: "filter status harus dipilih" },
      { status: 400 }
    );
  }

  if (filters?.salesId && Number(filters.salesId) === toSalesId) {
    return NextResponse.json(
      { ok: false, message: "Lead sudah dimiliki sales tersebut" },
      { status: 400 }
    );
  }

  const targetSales = await prisma.user.findUnique({
    where: { id: toSalesId },
    select: { id: true, name: true, role: { select: { code: true } } },
  });

  if (!targetSales || targetSales.role?.code !== "SALES") {
    return NextResponse.json(
      { ok: false, message: "Sales tujuan tidak valid" },
      { status: 400 }
    );
  }

  // ================= TRANSACTION =================
  let affectedLeads = 0;

  try {
    await prisma.$transaction(async (tx) => {
      const leads = await tx.lead.findMany({
        where,
        select: { id: true, salesId: true },
      });

      console.log("TOTAL LEAD DITEMUKAN:", leads.length);

      if (!leads.length) {
        throw new Error("NO_LEADS");
      }

      if (leads.length > 1000) {
        throw new Error("TERLALU_BANYAK_LEAD");
      }

      const leadIds = leads.map((l) => l.id);

      await tx.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { salesId: toSalesId },
      });

      await tx.leadNurturingState.updateMany({
        where: { leadId: { in: leadIds } },
        data: {
          status: "PAUSED",
          pauseReason: "SYSTEM_RULE",
        },
      });

      await tx.leadAssignmentHistory.createMany({
        data: leads.map((l) => ({
          leadId: l.id,
          fromSalesId: l.salesId,
          toSalesId,
          assignedById: user.id,
          assignedByRole: user.roleCode,
          reason,
        })),
      });

      await tx.leadActivity.createMany({
        data: leads.map((l) => ({
          leadId: l.id,
          title: "Lead dipindahkan (bulk)",
          description: reason || "Pemindahan massal",
          createdById: user.id,
          happenedAt: new Date(),
        })),
      });

      affectedLeads = leads.length;
    });
  } catch (err: any) {
    console.error("Bulk assign error:", err);
    console.log("BULK ASSIGN FILTER:", cleanFilters);
    return NextResponse.json(
      { ok: false, message: "Gagal memproses bulk assign" },
      { status: 500 }
    );
  }

  // realtime notif
  emitRealtime({
    room: `user:${toSalesId}`,
    event: "lead_bulk_assigned",
    payload: {
      total: affectedLeads,
      from: user.name,
    },
  });

  return NextResponse.json({
    ok: true,
    moved: affectedLeads,
    message: `Berhasil memindahkan ${affectedLeads} lead`,
  });
}
