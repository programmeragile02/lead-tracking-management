import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

type PlannedFU = {
  order: 1 | 2 | 3;
  delayDays: number;
};

function getMissingFollowUps(fuCount: number): PlannedFU[] {
  if (fuCount >= 3) return [];

  if (fuCount === 0) {
    return [
      { order: 1, delayDays: 1 },
      { order: 2, delayDays: 3 },
      { order: 3, delayDays: 6 },
    ];
  }

  if (fuCount === 1) {
    return [
      { order: 2, delayDays: 3 },
      { order: 3, delayDays: 6 },
    ];
  }

  if (fuCount === 2) {
    return [{ order: 3, delayDays: 6 }];
  }

  return [];
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const since = subDays(new Date(), 30);

  const leads = await prisma.lead.findMany({
    where: {
      salesId: user.id,
      isExcluded: false,
      createdAt: { gte: since },
      status: {
        code: { in: ["WARM", "HOT"] },
      },
    },
    include: {
      status: true,
      stage: true,
      followUps: {
        orderBy: { createdAt: "asc" }, // hitung urutan
      },
    },
  });

  const summary = {
    totalLeads: leads.length,
    willCreateFU1: 0,
    willCreateFU2: 0,
    willCreateFU3: 0,
    skipped: 0,
  };

  const items = leads.map((lead) => {
    const fuCount = lead.followUps.length;
    const planned = getMissingFollowUps(fuCount);

    if (planned.length === 0) {
      summary.skipped++;
    }

    planned.forEach((p) => {
      if (p.order === 1) summary.willCreateFU1++;
      if (p.order === 2) summary.willCreateFU2++;
      if (p.order === 3) summary.willCreateFU3++;
    });

    return {
      leadId: lead.id,
      leadName: lead.name,
      status: lead.status?.name ?? null,
      stage: lead.stage?.name ?? null,

      fuCount,
      plannedFollowUps: planned.map((p) => ({
        order: p.order,
        delayDays: p.delayDays,
        label: `FU${p.order}`,
      })),
    };
  });

  return NextResponse.json({
    ok: true,
    summary,
    items,
  });
}
