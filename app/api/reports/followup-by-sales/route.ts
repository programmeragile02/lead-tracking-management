import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function parsePeriod(period: string | null) {
  if (!period) return null;
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return null;

  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

function getWeekOfMonth(date: Date) {
  const day = date.getUTCDate();
  return Math.ceil(day / 7); // 1–5
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const roleCode = (user as any).roleCode;
    const isManager = roleCode === "MANAGER";
    const isTeamLeader = roleCode === "TEAM_LEADER";

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period");
    const teamLeaderId = searchParams.get("teamLeaderId");

    const range = parsePeriod(period);
    if (!range) {
      return NextResponse.json(
        { ok: false, error: "Periode tidak valid" },
        { status: 400 }
      );
    }

    const { start, end } = range;

    // ================= sales scope =================
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
      const tlId = Number(teamLeaderId);
      if (!tlId) {
        return NextResponse.json(
          { ok: false, error: "teamLeaderId wajib" },
          { status: 400 }
        );
      }

      const tl = await prisma.user.findFirst({
        where: {
          id: tlId,
          managerId: user.id,
          role: { code: "TEAM_LEADER" },
        },
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
      return NextResponse.json(
        { ok: false, error: "Role tidak diizinkan" },
        { status: 403 }
      );
    }

    // ================= master follow up =================
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

    // ================= aggregation =================
    const rows = await prisma.leadFollowUp.findMany({
      where: {
        salesId: { in: salesIds },
        doneAt: { not: null, gte: start, lt: end },
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

      const tid = String(r.typeId);
      const sid = String(r.salesId);
      const week = getWeekOfMonth(r.doneAt);

      if (!matrix[tid]) matrix[tid] = {};
      if (!matrix[tid][sid]) matrix[tid][sid] = {};
      matrix[tid][sid][week] = (matrix[tid][sid][week] ?? 0) + 1;

      totalsPerSales[sid] = (totalsPerSales[sid] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      data: {
        followUpTypes,
        sales: salesUsers,
        weeks: [1, 2, 3, 4, 5],
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
