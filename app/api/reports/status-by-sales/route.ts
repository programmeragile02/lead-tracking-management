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

function getWeekOfMonth(date: Date) {
  const day = date.getUTCDate();
  return Math.ceil(day / 7); // 1 - 5
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

    const roleCode = (currentUser as any).roleCode ?? currentUser.roleCode;
    const isManager = roleCode === "MANAGER";
    const isTeamLeader = roleCode === "TEAM_LEADER";

    // ========= Tentukan daftar sales yg boleh dilihat =========
    let salesFilterIds: number[] = [];

    if (isTeamLeader) {
      // TL: lihat dirinya + semua sales yg dibawahi
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

    // ambil history (raw) agar bisa hitung minggu
    const histories = await prisma.leadStatusHistory.findMany({
      where: {
        salesId: { in: salesFilterIds },
        createdAt: { gte: start, lt: end },
      },
      select: {
        statusId: true,
        salesId: true,
        createdAt: true,
      },
    });

    // matrix[statusId][salesId][week] = count
    const matrix: Record<string, Record<string, Record<number, number>>> = {};

    const totalsPerSales: Record<string, number> = {};

    for (const h of histories) {
      if (!h.salesId) continue;

      const statusId = String(h.statusId);
      const salesId = String(h.salesId);
      const week = getWeekOfMonth(h.createdAt); // 1-5

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
        weeks: [1, 2, 3, 4, 5],
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
