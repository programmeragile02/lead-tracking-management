import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function parsePeriod(period: string | null) {
  if (!period) return null;
  const [y, m] = period.split("-");
  const year = Number(y);
  const month = Number(m);
  if (!year || !month) return null;

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
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
    const period = searchParams.get("period"); // YYYY-MM
    const teamLeaderIdParam = searchParams.get("teamLeaderId");

    const dateRange = parsePeriod(period);
    if (!dateRange) {
      return NextResponse.json(
        { ok: false, error: "Periode tidak valid" },
        { status: 400 }
      );
    }

    const { start, end } = dateRange;

    const roleCode = currentUser.roleCode;
    const isManager = roleCode === "MANAGER";
    const isTeamLeader = roleCode === "TEAM_LEADER";

    let salesFilterIds: number[] = [];

    // ===== Tentukan sales yg boleh dilihat =====
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
      const teamLeaderId = Number(teamLeaderIdParam);
      if (!teamLeaderId) {
        return NextResponse.json(
          { ok: false, error: "teamLeaderId wajib diisi" },
          { status: 400 }
        );
      }

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
      return NextResponse.json(
        { ok: false, error: "Role tidak diizinkan" },
        { status: 403 }
      );
    }

    if (!salesFilterIds.length) {
      return NextResponse.json({
        ok: true,
        data: { sales: [], matrix: {}, totalsPerSales: {} },
      });
    }

    // ===== ambil sales =====
    const salesUsers = await prisma.user.findMany({
      where: { id: { in: salesFilterIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // ===== group klik per sales =====
    const rows = await prisma.leadTrackedLinkClick.groupBy({
      by: ["salesId"],
      _count: { _all: true },
      where: {
        salesId: { in: salesFilterIds },
        clickedAt: { gte: start, lt: end },
      },
    });

    const matrix: Record<string, number> = {};
    const totalsPerSales: Record<string, number> = {};

    rows.forEach((r) => {
      if (!r.salesId) return;
      const sid = String(r.salesId);
      matrix[sid] = r._count._all;
      totalsPerSales[sid] = r._count._all;
    });

    return NextResponse.json({
      ok: true,
      data: {
        sales: salesUsers,
        matrix,
        totalsPerSales,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat laporan klik link" },
      { status: 500 }
    );
  }
}
