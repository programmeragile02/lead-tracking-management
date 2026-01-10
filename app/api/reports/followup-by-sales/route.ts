import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

/* ================= UTIL ================= */
function parsePeriod(period: string | null) {
  if (!period) return null;

  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return null;

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  return { start, end, year: y, month: m };
}

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

    const dayOfWeek = current.getUTCDay();
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

/* ================= API ================= */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Belum login" },
        { status: 401 }
      );
    }

    const role = user.roleCode;
    const isManager = role === "MANAGER";
    const isTeamLeader = role === "TEAM_LEADER";

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

    /* ===== SALES SCOPE ===== */
    let salesIds: number[] = [];

    if (isTeamLeader) {
      const sales = await prisma.user.findMany({
        where: {
          teamLeaderId: user.id,
          role: { code: "SALES" },
          isActive: true,
        },
        select: { id: true },
      });

      salesIds = sales.map((s) => s.id);
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
            managerId: user.id,
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

        salesIds = sales.map((s) => s.id);
      } else {
        // ===== MANAGER + ALL TL =====
        const tls = await prisma.user.findMany({
          where: {
            managerId: user.id,
            role: { code: "TEAM_LEADER" },
          },
          select: { id: true },
        });

        if (tls.length > 0) {
          const sales = await prisma.user.findMany({
            where: {
              teamLeaderId: { in: tls.map((t) => t.id) },
              role: { code: "SALES" },
              isActive: true,
            },
            select: { id: true },
          });

          salesIds = sales.map((s) => s.id);
        }
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Role tidak diizinkan" },
        { status: 403 }
      );
    }

    if (salesIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          followUpTypes: [],
          sales: [],
          weeks: [],
          matrix: {},
          totalsPerSales: {},
        },
      });
    }

    /* ===== MASTER FOLLOW UP ===== */
    const followUpTypes = await prisma.leadFollowUpType.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, code: true },
    });

    const salesUsers = await prisma.user.findMany({
      where: { id: { in: salesIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    /* ===== FOLLOW UP DONE ===== */
    const rows = await prisma.leadFollowUp.findMany({
      where: {
        salesId: { in: salesIds },
        doneAt: { not: null, gte: start, lt: end },
        lead: { isExcluded: false },
      },
      select: {
        typeId: true,
        salesId: true,
        doneAt: true,
      },
    });

    const matrix: Record<string, Record<string, Record<number, number>>> = {};
    const totalsPerSales: Record<string, number> = {};

    for (const r of rows) {
      if (!r.salesId || !r.typeId || !r.doneAt) continue;

      const week = getWeekIndex(r.doneAt, weeks);
      if (!week) continue;

      const tid = String(r.typeId);
      const sid = String(r.salesId);

      matrix[tid] ??= {};
      matrix[tid][sid] ??= {};
      matrix[tid][sid][week] = (matrix[tid][sid][week] ?? 0) + 1;

      totalsPerSales[sid] = (totalsPerSales[sid] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      data: {
        followUpTypes,
        sales: salesUsers,
        weeks: weeks.map((w) => ({
          week: w.week,
          label: w.label,
        })),
        matrix,
        totalsPerSales,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat laporan follow up" },
      { status: 500 }
    );
  }
}
