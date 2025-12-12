import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function parsePeriod(period: string | null): { start: Date; end: Date } | null {
  if (!period) return null;
  const [yearStr, monthStr] = period.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return null;

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // bulan berikutnya

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

    const roleCode = (currentUser as any).roleCode ?? currentUser.role?.code;
    const isManager = roleCode === "MANAGER";
    const isTeamLeader = roleCode === "TEAM_LEADER";

    // ========= Tentukan daftar sales yg boleh dilihat =========
    let salesFilterIds: number[] = [];

    if (isTeamLeader) {
      // TL: lihat dirinya + semua sales yg dibawahi
      const sales = await prisma.user.findMany({
        where: {
          OR: [
            { id: currentUser.id },
            { teamLeaderId: currentUser.id, role: { code: "SALES" } },
          ],
          isActive: true,
        },
        select: { id: true },
      });
      salesFilterIds = sales.map((s) => s.id);
    } else if (isManager) {
      // Manager: wajib pilih TL
      const teamLeaderId = teamLeaderIdParam ? Number(teamLeaderIdParam) : NaN;
      if (!teamLeaderId) {
        return NextResponse.json(
          { ok: false, error: "teamLeaderId wajib diisi untuk manager" },
          { status: 400 }
        );
      }

      // cek TL benar2 di bawah manager ini
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
          OR: [{ id: tl.id }, { teamLeaderId: tl.id, role: { code: "SALES" } }],
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

    if (salesFilterIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          statuses: [],
          sales: [],
          matrix: {},
          totalsPerSales: {},
        },
      });
    }

    // ambil master status
    const statuses = await prisma.leadStatus.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, code: true },
    });

    // ambil data sales (nama kolom)
    const salesUsers = await prisma.user.findMany({
      where: { id: { in: salesFilterIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // groupBy history per statusId x salesId
    const rows = await prisma.leadStatusHistory.groupBy({
      by: ["statusId", "salesId"],
      _count: { _all: true },
      where: {
        salesId: { in: salesFilterIds },
        createdAt: { gte: start, lt: end },
      },
    });

    // bentuk matrix: matrix[statusId][salesId] = count
    const matrix: Record<string, Record<string, number>> = {};
    const totalsPerSales: Record<string, number> = {};

    for (const r of rows) {
      if (!r.salesId) continue;
      const sId = String(r.salesId);
      const stId = String(r.statusId);

      if (!matrix[stId]) matrix[stId] = {};
      matrix[stId][sId] = r._count._all;

      totalsPerSales[sId] = (totalsPerSales[sId] ?? 0) + r._count._all;
    }

    return NextResponse.json({
      ok: true,
      data: {
        statuses,
        sales: salesUsers,
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
