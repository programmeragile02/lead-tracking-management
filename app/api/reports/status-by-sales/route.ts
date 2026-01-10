import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function parsePeriod(period: string | null): {
  start: Date;
  end: Date;
  year: number;
  month: number;
} | null {
  if (!period) return null;

  const [yearStr, monthStr] = period.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!year || !month) return null;

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1)); // bulan berikutnya

  return { start, end, year, month };
}

/**
 * Membagi minggu berdasarkan kalender:
 * W1 = tgl 1 s/d Minggu pertama
 * W berikutnya = Senin–Minggu
 */
function buildWeeks(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));

  const weeks: {
    week: number;
    start: Date;
    end: Date;
    label: string;
  }[] = [];

  let current = new Date(firstDay);
  let week = 1;

  while (current <= lastDay) {
    const start = new Date(current);

    const dayOfWeek = current.getUTCDay(); // 0 = Minggu
    const diffToSunday = (7 - dayOfWeek) % 7;

    let end = new Date(current);
    end.setUTCDate(end.getUTCDate() + diffToSunday);

    if (end > lastDay) end = new Date(lastDay);

    weeks.push({
      week,
      start,
      end,
      label: `${start.getUTCDate()}-${end.getUTCDate()}`,
    });

    current = new Date(end);
    current.setUTCDate(current.getUTCDate() + 1);
    week++;
  }

  return weeks;
}

function getWeekIndex(date: Date, weeks: ReturnType<typeof buildWeeks>) {
  return weeks.find((w) => date >= w.start && date <= w.end)?.week;
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "Belum login" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period");
    const teamLeaderIdParam = searchParams.get("teamLeaderId");

    const parsed = parsePeriod(period);
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "Periode tidak valid" },
        { status: 400 }
      );
    }

    const { start, end, year, month } = parsed;
    const weeks = buildWeeks(year, month);

    const roleCode = currentUser.roleCode;
    const isManager = roleCode === "MANAGER";
    const isTeamLeader = roleCode === "TEAM_LEADER";

    // ===== Tentukan sales yg boleh dilihat =====
    let salesFilterIds: number[] = [];

    if (isTeamLeader) {
      const sales = await prisma.user.findMany({
        where: {
          teamLeaderId: currentUser.id,
          role: { code: "SALES" },
          isActive: true,
        },
        select: { id: true },
      });
      salesFilterIds = sales.map((s) => s.id);
    } else if (isManager) {
      const teamLeaderId =
        teamLeaderIdParam && teamLeaderIdParam !== "ALL"
          ? Number(teamLeaderIdParam)
          : null;

      if (teamLeaderId) {
        // ===== MANAGER + 1 TL =====
        const tl = await prisma.user.findFirst({
          where: {
            id: teamLeaderId,
            role: { code: "TEAM_LEADER" },
            managerId: currentUser.id,
          },
          select: { id: true },
        });

        if (!tl) {
          return NextResponse.json(
            { ok: false, error: "Team leader tidak valid" },
            { status: 403 }
          );
        }

        const sales = await prisma.user.findMany({
          where: {
            teamLeaderId: tl.id,
            role: { code: "SALES" },
            isActive: true,
          },
          select: { id: true },
        });

        salesFilterIds = sales.map((s) => s.id);
      } else {
        // ===== MANAGER + ALL TL =====
        const tls = await prisma.user.findMany({
          where: {
            managerId: currentUser.id,
            role: { code: "TEAM_LEADER" },
          },
          select: { id: true },
        });

        if (tls.length === 0) {
          salesFilterIds = [];
        } else {
          const sales = await prisma.user.findMany({
            where: {
              teamLeaderId: { in: tls.map((t) => t.id) },
              role: { code: "SALES" },
              isActive: true,
            },
            select: { id: true },
          });

          salesFilterIds = sales.map((s) => s.id);
        }
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Role tidak diizinkan" },
        { status: 403 }
      );
    }

    if (salesFilterIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          statuses: [],
          sales: [],
          weeks: [],
          matrix: {},
          totalsPerSales: {},
        },
      });
    }

    // ===== Master status =====
    const statuses = await prisma.leadStatus.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, code: true },
    });

    const salesUsers = await prisma.user.findMany({
      where: { id: { in: salesFilterIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const histories = await prisma.leadStatusHistory.findMany({
      where: {
        salesId: { in: salesFilterIds },
        createdAt: { gte: start, lt: end },
        lead: {
          isExcluded: false,
        },
      },
      select: {
        statusId: true,
        salesId: true,
        createdAt: true,
      },
    });

    const matrix: Record<string, Record<string, Record<number, number>>> = {};
    const totalsPerSales: Record<string, number> = {};

    for (const h of histories) {
      if (!h.salesId) continue;

      const week = getWeekIndex(h.createdAt, weeks);
      if (!week) continue;

      const statusId = String(h.statusId);
      const salesId = String(h.salesId);

      if (!matrix[statusId]) matrix[statusId] = {};
      if (!matrix[statusId][salesId]) matrix[statusId][salesId] = {};
      matrix[statusId][salesId][week] =
        (matrix[statusId][salesId][week] ?? 0) + 1;

      totalsPerSales[salesId] = (totalsPerSales[salesId] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      data: {
        statuses,
        sales: salesUsers,
        weeks: weeks.map((w) => ({
          week: w.week,
          label: w.label,
        })),
        matrix,
        totalsPerSales,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat laporan status" },
      { status: 500 }
    );
  }
}
