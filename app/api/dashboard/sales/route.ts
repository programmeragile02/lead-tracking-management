export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function getDateRanges() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { now, startOfDay, endOfDay, startOfMonth, startOfNextMonth };
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.roleSlug !== "sales") {
      return NextResponse.json(
        {
          ok: false,
          message: "Hanya sales yang bisa mengakses dashboard ini.",
        },
        { status: 403 }
      );
    }

    const salesId = currentUser.id;
    const { now, startOfDay, endOfDay, startOfMonth, startOfNextMonth } =
      getDateRanges();

    // 1. Setting target global (LeadTargetSetting id=1)
    const setting = await prisma.leadTargetSetting.findUnique({
      where: { id: 1 },
    });

    const leadTargetPerDay = setting?.leadTargetPerDay ?? 0;
    const closingTargetAmount =
      setting?.closingTargetAmount ?? new Prisma.Decimal(0);

    // 2. Lead hari ini milik sales ini
    const todayLeadCount = await prisma.lead.count({
      where: {
        salesId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // 3. Closing bulan ini (sum priceClosing) milik sales ini
    const closingAgg = await prisma.lead.aggregate({
      _sum: {
        priceClosing: true,
      },
      where: {
        salesId,
        priceClosing: {
          not: null,
        },
        // kalau kamu mau pakai createdAt untuk bulan, ganti ke createdAt
        updatedAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    const closingActualAmount =
      closingAgg._sum.priceClosing ?? new Prisma.Decimal(0);

    // 4. Lead aktif HOT & WARM milik sales ini
    const [hotCount, warmCount] = await Promise.all([
      prisma.lead.count({
        where: {
          salesId,
          status: {
            code: "HOT",
          },
        },
      }),
      prisma.lead.count({
        where: {
          salesId,
          status: {
            code: "WARM",
          },
        },
      }),
    ]);

    // 5. Tindak lanjut terlambat: nextActionAt < now
    const lateFollowUpCount = await prisma.leadFollowUp.count({
      where: {
        salesId,
        nextActionAt: {
          not: null,
          lt: now,
        },
      },
    });

    // 6. Tindak lanjut hari ini (berdasarkan nextActionAt hari ini)
    const followUpsToday = await prisma.leadFollowUp.findMany({
      where: {
        salesId,
        nextActionAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        lead: {
          select: {
            name: true,
            product: { select: { name: true } },
          },
        },
        type: {
          select: { code: true, name: true },
        },
      },
      orderBy: {
        nextActionAt: "asc",
      },
      take: 5,
    });

    // 7. Lead baru hari ini
    const newLeadsToday = await prisma.lead.findMany({
      where: {
        salesId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        source: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // 8. Aktivitas terbaru: 5 follow up terakhir milik sales ini
    const recentFollowUps = await prisma.leadFollowUp.findMany({
      where: { salesId },
      include: {
        lead: {
          select: {
            name: true,
            status: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        doneAt: "desc",
      },
      take: 5,
    });

    const data = {
      user: {
        id: salesId,
        name: currentUser.name,
      },
      kpi: {
        targetLeadPerDay: leadTargetPerDay,
        todayLeadCount,
        closingTargetAmount: closingTargetAmount.toString(),
        closingActualAmount: closingActualAmount.toString(),
        hotLeadCount: hotCount,
        warmLeadCount: warmCount,
        lateFollowUpCount,
      },
      followUpsToday: followUpsToday.map((fu) => ({
        id: fu.id,
        leadName: fu.lead?.name ?? "-",
        productName: fu.lead?.product?.name ?? "-",
        followUpType: fu.type?.code ?? fu.type?.name ?? "Follow Up",
        time: fu.nextActionAt
          ? fu.nextActionAt.toISOString()
          : fu.doneAt.toISOString(),
        status:
          fu.nextActionAt && fu.nextActionAt < now
            ? ("overdue" as const)
            : ("pending" as const),
      })),
      newLeadsToday: newLeadsToday.map((lead) => ({
        id: lead.id,
        leadName: lead.name,
        channel: lead.source?.name ?? "Unknown",
        createdAt: lead.createdAt.toISOString(),
      })),
      recentActivities: recentFollowUps.map((fu) => ({
        id: fu.id,
        time: fu.doneAt.toISOString(),
        type: fu.type?.name ?? "Follow Up",
        leadName: fu.lead?.name ?? "-",
        status: fu.lead?.status?.code ?? "UNKNOWN",
        note: fu.note ?? "",
      })),
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET /api/dashboard/sales error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil data dashboard sales." },
      { status: 500 }
    );
  }
}
