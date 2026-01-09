import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const salesId = searchParams.get("salesId");
  const teamLeaderId = searchParams.get("teamLeaderId");

  /** ===============================
   *  BUILD BASE WHERE
   * =============================== */
  const where: any = {
    isExcluded: false,
  };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  /** ===============================
   *  ROLE BASED ACCESS
   * =============================== */
  if (user.roleCode === "SALES") {
    // SALES hanya boleh lihat lead sendiri
    where.salesId = user.id;
  }

  if (user.roleCode === "TEAM_LEADER") {
    // TL bisa lihat semua sales di bawahnya
    const salesUnderTL = await prisma.user.findMany({
      where: {
        teamLeaderId: user.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    const salesIds = salesUnderTL.map((s) => s.id);

    where.salesId = {
      in: salesIds,
    };

    // kalau TL filter sales tertentu
    if (salesId && salesId !== "ALL") {
      if (!salesIds.includes(Number(salesId))) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      where.salesId = Number(salesId);
    }
  }

  if (user.roleCode === "MANAGER") {
    // 1️ Jika sales dipilih → PALING SPESIFIK
    if (salesId && salesId !== "ALL") {
      where.salesId = Number(salesId);
    }

    // 2️ Jika hanya TL dipilih (sales = ALL)
    else if (teamLeaderId && teamLeaderId !== "ALL") {
      const salesUnderTL = await prisma.user.findMany({
        where: {
          teamLeaderId: Number(teamLeaderId),
          deletedAt: null,
        },
        select: { id: true },
      });

      where.salesId = {
        in: salesUnderTL.map((s) => s.id),
      };
    }
  }

  /** ===============================
   *  QUERY AGGREGATION
   * =============================== */
  const totalLeads = await prisma.lead.count({ where });

  const grouped = await prisma.lead.groupBy({
    by: ["sourceId"],
    where,
    _count: { _all: true },
  });

  const sources = await prisma.leadSource.findMany({
    where: {
      isActive: true,
    },
    orderBy: { order: "asc" },
  });

  const result = sources.map((src) => {
    const row = grouped.find((g) => g.sourceId === src.id);
    const count = row?._count._all ?? 0;

    return {
      sourceId: src.id,
      sourceName: src.name,
      count,
      percentage: totalLeads
        ? Number(((count / totalLeads) * 100).toFixed(1))
        : 0,
    };
  });

  return NextResponse.json({
    ok: true,
    totalLeads,
    data: result,
  });
}
