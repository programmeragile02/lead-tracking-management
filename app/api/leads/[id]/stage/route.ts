import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

type Body = {
  stageId?: number;
  stageCode?: string;
  note?: string;
  skipIntermediate?: boolean;
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

  const body = (await req.json()) as Body;

  let stage;
  if (body.stageId) {
    stage = await prisma.leadStage.findUnique({
      where: { id: body.stageId },
    });
  } else if (body.stageCode) {
    stage = await prisma.leadStage.findUnique({
      where: { code: body.stageCode },
    });
  } else {
    return NextResponse.json(
      { ok: false, error: "stageId or stageCode is required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.isExcluded) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  if (!stage || !stage.isActive) {
    return NextResponse.json(
      { ok: false, error: "Stage not found / inactive" },
      { status: 400 }
    );
  }

  // jika user adalah SALES, pastikan dia pemilik lead
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const ownerSalesId = lead.salesId ?? user.id;
  const now = new Date();

  const [updatedLead] = await prisma.$transaction([
    prisma.leadStageHistory.updateMany({
      where: { leadId, doneAt: null },
      data: { doneAt: now, note: "Auto close: pindah tahap" },
    }),

    prisma.lead.update({
      where: { id: leadId },
      data: { stageId: stage.id },
    }),
    
    prisma.leadStageHistory.create({
      data: {
        leadId,
        stageId: stage.id,
        changedById: user.id,
        salesId: ownerSalesId,
        note: body.note || null,
        mode: "NORMAL",
        doneAt: null,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      lead: updatedLead,
    },
  });
}
