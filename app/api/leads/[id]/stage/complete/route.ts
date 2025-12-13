// app/api/leads/[id]/stage/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type Body = {
  stageId?: number;
  stageCode?: string;
  note?: string;
  mode?: "NORMAL" | "SKIPPED";
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
  const body = (await req.json().catch(() => ({}))) as Body;

  const stage = body.stageId
    ? await prisma.leadStage.findUnique({ where: { id: body.stageId } })
    : body.stageCode
    ? await prisma.leadStage.findUnique({ where: { code: body.stageCode } })
    : null;

  if (!stage || !stage.isActive) {
    return NextResponse.json(
      { ok: false, error: "Stage not found / inactive" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, salesId: true },
  });
  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const ownerSalesId = lead.salesId ?? user.id;
  const now = new Date();
  const mode = body.mode === "SKIPPED" ? "SKIPPED" : "NORMAL";

  const result = await prisma.$transaction(async (tx) => {
    // cari history terakhir utk stage ini
    const last = await tx.leadStageHistory.findFirst({
      where: { leadId, stageId: stage.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, doneAt: true },
    });

    if (last && !last.doneAt) {
      // update doneAt
      return tx.leadStageHistory.update({
        where: { id: last.id },
        data: {
          doneAt: now,
          mode,
          note: body.note || "Checklist: tahap diselesaikan",
        },
      });
    }

    // belum ada history atau history terakhir sudah done → buat record baru (langsung selesai)
    return tx.leadStageHistory.create({
      data: {
        leadId,
        stageId: stage.id,
        changedById: user.id,
        salesId: ownerSalesId,
        createdAt: now,
        doneAt: now,
        mode,
        note: body.note || "Checklist: tahap diselesaikan",
      },
    });
  });

  return NextResponse.json({ ok: true, data: result });
}
