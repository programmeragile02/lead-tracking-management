// app/api/dashboard/team-leader/route.ts
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
    const monthParam = url.searchParams.get("month"); // format: "2025-12"

    // ====== Hitung periode dari query ======
    const now = new Date();
    let monthStart: Date;
    let nextMonth: Date;

    if (monthParam) {
      const [yearStr, monthStr] = monthParam.split("-");
      const year = Number(yearStr);
      const monthIdx = Number(monthStr) - 1; // 0-based

      if (
        !Number.isNaN(year) &&
        !Number.isNaN(monthIdx) &&
        monthIdx >= 0 &&
        monthIdx < 12
      ) {
        monthStart = new Date(year, monthIdx, 1);
        nextMonth = new Date(year, monthIdx + 1, 1);
      } else {
        // fallback bulan ini
        monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
    } else {
      // default: bulan ini
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const periodLabel = monthStart.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    // Ambil TL + daftar sales di bawahnya
    const teamLeader = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
        role: { code: "TEAM_LEADER" },
        deletedAt: null,
        isActive: true,
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
            totalLeads: 0,
            totalClosing: 0,
            totalRevenue: 0,
            leadTargetTeam: 0,
            leadActualThisMonth: 0,
            revenueTargetTeam: 0,
            revenueActualThisMonth: 0,
          },
          salesPerformance: [],
          problemLeads: {
            overdue: [],
            hotNotClosed: [],
            untouched: [],
          },
        },
      });
    }

    // ====== Target dari LeadTargetSetting ======
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

    const leadTargetTeam = leadTargetPerSalesThisMonth * salesIds.length;

    const revenueTargetPerSales = Number(
      targetSetting?.closingTargetAmount ?? 0
    );

    const revenueTargetTeam = revenueTargetPerSales * salesIds.length;

    // ======== AGREGASI LEAD BY SALES (periode bulan) ========

    const leadsBySales = await prisma.lead.groupBy({
      by: ["salesId"],
      where: {
        salesId: { in: salesIds },
        createdAt: { gte: monthStart, lt: nextMonth },
      },
      _count: { _all: true },
    });

    const closingBySales = await prisma.lead.groupBy({
      by: ["salesId"],
      where: {
        salesId: { in: salesIds },
        status: { code: "CLOSE_WON" },
        updatedAt: { gte: monthStart, lt: nextMonth },
      },
      _count: { _all: true },
      _sum: { priceClosing: true },
    });

    const totalLeads = leadsBySales.reduce(
      (sum, item) => sum + item._count._all,
      0
    );

    const totalClosing = closingBySales.reduce(
      (sum, item) => sum + item._count._all,
      0
    );

    const totalRevenue = closingBySales.reduce(
      (sum, item) => sum + Number(item._sum.priceClosing ?? 0),
      0
    );

    const salesPerformance = salesList.map((sales) => {
      const leadAgg = leadsBySales.find((l) => l.salesId === sales.id);
      const closingAgg = closingBySales.find((c) => c.salesId === sales.id);

      const leadActual = leadAgg?._count._all ?? 0;
      const closingCount = closingAgg?._count._all ?? 0;
      const revenueActual = Number(closingAgg?._sum.priceClosing ?? 0);

      return {
        salesId: sales.id,
        salesName: sales.name,
        leadTarget: leadTargetPerSalesThisMonth,
        leadActual,
        revenueTarget: revenueTargetPerSales,
        revenueActual,
        closingCount,
      };
    });

    // ======== PROBLEM LEADS (pakai seluruh data, tidak dibatasi bulan) ========
    const nowDate = new Date();

    const overdueLeads = await prisma.lead.findMany({
      where: {
        salesId: { in: salesIds },
        followUps: {
          some: {
            doneAt: null,
            nextActionAt: { lt: nowDate },
          },
        },
      },
      include: {
        product: true,
        source: true,
        status: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
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
      },
      include: {
        product: true,
        source: true,
        status: true,
      },
      take: 20,
      orderBy: { updatedAt: "desc" },
    });

    const untouchedLeads = await prisma.lead.findMany({
      where: {
        salesId: { in: salesIds },
        followUps: { none: {} },
      },
      include: {
        product: true,
        source: true,
        status: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const leadIdsForNextFU = [
      ...new Set([
        ...overdueLeads.map((l) => l.id),
        ...hotNotClosedLeads.map((l) => l.id),
      ]),
    ];

    const nextFollowUps = leadIdsForNextFU.length
      ? await prisma.leadFollowUp.findMany({
          where: {
            leadId: { in: leadIdsForNextFU },
            doneAt: null,
          },
          include: { type: true },
          orderBy: { nextActionAt: "asc" },
        })
      : [];

    const nextFUByLead = new Map<number, (typeof nextFollowUps)[number]>();

    nextFollowUps.forEach((fu) => {
      const existing = nextFUByLead.get(fu.leadId);
      if (
        !existing ||
        (fu.nextActionAt &&
          existing.nextActionAt &&
          fu.nextActionAt < existing.nextActionAt)
      ) {
        nextFUByLead.set(fu.leadId, fu);
      }
    });

    const mapLeadToProblemItem = (lead: any) => {
      const fu = nextFUByLead.get(lead.id);
      return {
        id: lead.id,
        name: lead.name,
        statusCode: lead.status?.code ?? null,
        productName: lead.product?.name ?? null,
        sourceName: lead.source?.name ?? null,
        createdAt: lead.createdAt,
        nextActionAt: fu?.nextActionAt ?? null,
        followUpTypeName: fu?.type?.name ?? null,
      };
    };

    return NextResponse.json({
      ok: true,
      data: {
        summary: {
          teamLeaderId: teamLeader.id,
          teamLeaderName: teamLeader.name,
          teamSize: salesIds.length,
          periodLabel,
          totalLeads,
          totalClosing,
          totalRevenue,
          leadTargetTeam,
          leadActualThisMonth: totalLeads,
          revenueTargetTeam,
          revenueActualThisMonth: totalRevenue,
        },
        salesPerformance,
        problemLeads: {
          overdue: overdueLeads.map(mapLeadToProblemItem),
          hotNotClosed: hotNotClosedLeads.map(mapLeadToProblemItem),
          untouched: untouchedLeads.map(mapLeadToProblemItem),
        },
      },
    });
  } catch (error) {
    console.error("[TEAM_LEADER_DASHBOARD]", error);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat dashboard" },
      { status: 500 }
    );
  }
}
