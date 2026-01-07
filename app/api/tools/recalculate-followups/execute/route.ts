import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

type PlannedFU = {
  order: 1 | 2 | 3;
  delayDays: number;
};

const FU_DELAYS: Record<1 | 2 | 3, number> = {
  1: 1, // dari sekarang
  2: 3, // dari FU sebelumnya
  3: 6, // dari FU sebelumnya
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

function nextActionFromBase(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const followUpTypes = await prisma.leadFollowUpType.findMany({
    where: {
      code: { in: ["FU1", "FU2", "FU3"] },
      isActive: true,
    },
  });

  const fuTypeMap = Object.fromEntries(
    followUpTypes.map((t) => [t.code, t.id])
  ) as Record<"FU1" | "FU2" | "FU3", number>;

  if (!fuTypeMap.FU1 || !fuTypeMap.FU2 || !fuTypeMap.FU3) {
    return NextResponse.json(
      {
        ok: false,
        error: "Master Follow Up Type belum lengkap (FU1, FU2, FU3 wajib ada)",
      },
      { status: 500 }
    );
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
      followUps: {
        orderBy: { createdAt: "asc" }, // hitung FU dengan benar
      },
    },
  });

  let createdFU1 = 0;
  let createdFU2 = 0;
  let createdFU3 = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (lead.followUps.length >= 3) {
      skipped++;
      continue;
    }

    const fuCount = lead.followUps.length;
    const plans = getMissingFollowUps(fuCount);

    if (plans.length === 0) {
      skipped++;
      continue;
    }

    // SAFETY: ambil FU type yang SUDAH ADA di lead ini
    const existingTypeIds = new Set(
      lead.followUps.map((fu) => fu.typeId).filter(Boolean)
    );

    let baseDate =
      lead.followUps.length > 0
        ? lead.followUps[lead.followUps.length - 1].nextActionAt ??
          lead.followUps[lead.followUps.length - 1].createdAt
        : new Date();

    for (const plan of plans) {
      const typeCode = `FU${plan.order}` as "FU1" | "FU2" | "FU3";
      const typeId = fuTypeMap[typeCode];

      // SAFETY: jangan bikin FU dobel
      if (existingTypeIds.has(typeId)) {
        continue;
      }

      baseDate = nextActionFromBase(baseDate, FU_DELAYS[plan.order]);

      await prisma.leadFollowUp.create({
        data: {
          leadId: lead.id,
          salesId: user.id,
          typeId,
          note: `Auto FU${plan.order} (rekalkulasi)`,
          nextActionAt: baseDate,
          channel: "WHATSAPP",
        },
      });

      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          title: "Follow Up Otomatis Dibuat",
          description: `Auto FU${
            plan.order
          } dijadwalkan pada ${baseDate.toLocaleString("id-ID")}`,
          happenedAt: new Date(),
          createdById: user.id,
        },
      });

      if (plan.order === 1) createdFU1++;
      if (plan.order === 2) createdFU2++;
      if (plan.order === 3) createdFU3++;
    }
  }

  return NextResponse.json({
    ok: true,
    created: {
      fu1: createdFU1,
      fu2: createdFU2,
      fu3: createdFU3,
    },
    skipped,
  });
}
