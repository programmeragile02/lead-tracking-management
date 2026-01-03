import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, message: "Belum login" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month"); // "YYYY-MM"
    const now = new Date();

    // ===== Periode berdasarkan query =====
    let monthStart: Date;
    let nextMonth: Date;

    if (monthParam) {
      const [yearStr, monthStr] = monthParam.split("-");
      const year = Number(yearStr);
      const monthIdx = Number(monthStr) - 1;
      if (
        !Number.isNaN(year) &&
        !Number.isNaN(monthIdx) &&
        monthIdx >= 0 &&
        monthIdx < 12
      ) {
        monthStart = new Date(year, monthIdx, 1);
        nextMonth = new Date(year, monthIdx + 1, 1);
      } else {
        monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
    } else {
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const periodLabel = monthStart.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    // ===== Pastikan user ini Team Leader & ambil daftar sales =====
    const teamLeader = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
        role: { code: "TEAM_LEADER" },
        isActive: true,
        deletedAt: null,
      },
      include: {
        sales: {
          where: {
            isActive: true,
            deletedAt: null,
          },
        },
      },
    });

    if (!teamLeader) {
      return NextResponse.json(
        { ok: false, message: "Hanya bisa diakses Team Leader" },
        { status: 403 }
      );
    }

    const salesList = teamLeader.sales;
    const salesIds = salesList.map((s) => s.id);

    if (salesIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          summary: {
            teamLeaderId: teamLeader.id,
            teamLeaderName: teamLeader.name,
            teamSize: 0,
            periodLabel,
            totalLeadsPeriod: 0,
            totalClosingPeriod: 0,
            totalRevenuePeriod: 0,
          },
          members: [],
        },
      });
    }

    // ===== Target global =====
    const targetSetting = await prisma.leadTargetSetting.findFirst({
      where: { id: 1 },
    });

    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    ).getDate();

    const leadTargetPerSalesThisMonth =
      (targetSetting?.leadTargetPerDay ?? 0) * daysInMonth;
    const closingTargetPerSales = Number(
      targetSetting?.closingTargetAmount ?? 0
    );
    const closingTargetTeam = closingTargetPerSales * salesIds.length;

    // ===== Aggregasi lead & closing per sales (periode) =====
    const leadsPeriodAgg = await prisma.lead.groupBy({
      by: ["salesId"],
      where: {
        salesId: { in: salesIds },
        createdAt: { gte: monthStart, lt: nextMonth },
        isExcluded: false,
      },
      _count: { _all: true },
    });

    const leadsLifetimeAgg = await prisma.lead.groupBy({
      by: ["salesId"],
      where: {
        salesId: { in: salesIds },
        isExcluded: false,
      },
      _count: { _all: true },
    });

    const closingPeriodAgg = await prisma.lead.groupBy({
      by: ["salesId"],
      where: {
        salesId: { in: salesIds },
        status: { code: "CLOSE_WON" },
        updatedAt: { gte: monthStart, lt: nextMonth },
        isExcluded: false,
      },
      _count: { _all: true },
      _sum: { priceClosing: true },
    });

    const totalLeadsPeriod = leadsPeriodAgg.reduce(
      (sum, row) => sum + row._count._all,
      0
    );

    const totalClosingPeriod = closingPeriodAgg.reduce(
      (sum, row) => sum + row._count._all,
      0
    );

    const totalRevenuePeriod = closingPeriodAgg.reduce(
      (sum, row) => sum + Number(row._sum.priceClosing ?? 0),
      0
    );

    // ===== WA sessions =====
    const waSessions = await prisma.whatsAppSession.findMany({
      where: { userId: { in: salesIds } },
    });
    const waSessionByUserId = new Map(waSessions.map((s) => [s.userId, s]));

    // ===== Aktivitas follow up hari ini =====
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const fuDoneToday = await prisma.leadFollowUp.findMany({
      where: {
        salesId: { in: salesIds },
        doneAt: { gte: todayStart, lt: tomorrowStart },
      },
      select: { id: true, salesId: true },
    });

    const fuScheduledToday = await prisma.leadFollowUp.findMany({
      where: {
        salesId: { in: salesIds },
        doneAt: null,
        nextActionAt: { gte: todayStart, lt: tomorrowStart },
      },
      select: { id: true, salesId: true },
    });

    const fuOverdue = await prisma.leadFollowUp.findMany({
      where: {
        salesId: { in: salesIds },
        doneAt: null,
        nextActionAt: { lt: now },
      },
      select: { id: true, salesId: true },
    });

    const countBySalesId = (
      rows: { salesId: number | null }[]
    ): Map<number, number> => {
      const m = new Map<number, number>();
      for (const r of rows) {
        if (!r.salesId) continue;
        m.set(r.salesId, (m.get(r.salesId) ?? 0) + 1);
      }
      return m;
    };

    const fuDoneTodayBySales = countBySalesId(fuDoneToday);
    const fuScheduledTodayBySales = countBySalesId(fuScheduledToday);
    const fuOverdueBySales = countBySalesId(fuOverdue);

    // ===== Problem leads per sales =====
    const overdueLeads = await prisma.lead.findMany({
      where: {
        salesId: { in: salesIds },
        followUps: {
          some: {
            doneAt: null,
            nextActionAt: { lt: now },
          },
        },
        isExcluded: false,
      },
      select: { id: true, salesId: true },
    });

    const hotNotClosedLeads = await prisma.lead.findMany({
      where: {
        salesId: { in: salesIds },
        status: { code: "HOT" },
        NOT: {
          status: {
            code: { in: ["CLOSE_WON", "CLOSE_LOST"] },
          },
        },
        isExcluded: false,
      },
      select: { id: true, salesId: true },
    });

    const untouchedLeads = await prisma.lead.findMany({
      where: {
        salesId: { in: salesIds },
        followUps: { none: {} },
        isExcluded: false,
      },
      select: { id: true, salesId: true },
    });

    const overdueLeadBySales = countBySalesId(overdueLeads);
    const hotNotClosedBySales = countBySalesId(hotNotClosedLeads);
    const untouchedBySales = countBySalesId(untouchedLeads);

    // ===== Map data anggota tim =====
    const members = salesList.map((sales) => {
      const leadsPeriod =
        leadsPeriodAgg.find((l) => l.salesId === sales.id)?._count._all ?? 0;

      const leadsLifetime =
        leadsLifetimeAgg.find((l) => l.salesId === sales.id)?._count._all ?? 0;

      const closingAgg = closingPeriodAgg.find((c) => c.salesId === sales.id);
      const closingPeriod = closingAgg?._count._all ?? 0;
      const revenuePeriod = Number(closingAgg?._sum.priceClosing ?? 0);

      const waSession = waSessionByUserId.get(sales.id);

      return {
        salesId: sales.id,
        name: sales.name,
        email: sales.email,
        phone: sales.phone,
        photo: sales.photo,
        createdAt: sales.createdAt,

        leadTarget: leadTargetPerSalesThisMonth,
        closingTarget: closingTargetPerSales,
        leadsPeriod,
        leadsLifetime,
        closingPeriod,
        revenuePeriod,

        fuDoneToday: fuDoneTodayBySales.get(sales.id) ?? 0,
        fuScheduledToday: fuScheduledTodayBySales.get(sales.id) ?? 0,
        fuOverdue: fuOverdueBySales.get(sales.id) ?? 0,

        overdueLeadCount: overdueLeadBySales.get(sales.id) ?? 0,
        hotNotClosedCount: hotNotClosedBySales.get(sales.id) ?? 0,
        untouchedLeadCount: untouchedBySales.get(sales.id) ?? 0,

        waStatus: waSession?.status ?? null,
        waPhoneNumber: waSession?.phoneNumber ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        summary: {
          teamLeaderId: teamLeader.id,
          teamLeaderName: teamLeader.name,
          teamSize: salesIds.length,
          periodLabel,
          totalLeadsPeriod,
          totalClosingPeriod,
          totalRevenuePeriod,
          closingTargetTeam,
        },
        members,
      },
    });
  } catch (error) {
    console.error("[TEAM_LEADER_TEAM]", error);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat data tim" },
      { status: 500 }
    );
  }
}
