import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/**
 * RESPONSE TYPE
 */
type CityStat = {
  cityId: number | null; // null hanya untuk OTHERS
  cityName: string;
  cityType?: "KOTA" | "KABUPATEN";
  provinceName?: string;
  count: number;
  percent: number;
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 10);

  /**
   * STEP 1:
   * Tentukan SALES ID yang boleh diakses user ini
   */
  let allowedSalesIds: number[] = [];

  if (user.roleCode === "SALES") {
    allowedSalesIds = [user.id];
  }

  if (user.roleCode === "TEAM_LEADER") {
    const sales = await prisma.user.findMany({
      where: {
        teamLeaderId: user.id,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    allowedSalesIds = sales.map((s) => s.id);
  }

  if (user.roleCode === "MANAGER") {
    const sales = await prisma.user.findMany({
      where: {
        role: { code: "SALES" },
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    allowedSalesIds = sales.map((s) => s.id);
  }

  if (allowedSalesIds.length === 0) {
    return NextResponse.json({
      ok: true,
      totalLeads: 0,
      data: [],
    });
  }

  /**
   * STEP 2:
   * GROUP BY cityId (NO STRING CITY!)
   */
  const grouped = await prisma.lead.groupBy({
    by: ["cityId"],
    where: {
      salesId: { in: allowedSalesIds },
      isExcluded: false,
      cityId: { not: null },
    },
    _count: {
      _all: true,
    },
  });

  if (grouped.length === 0) {
    return NextResponse.json({
      ok: true,
      totalLeads: 0,
      data: [],
    });
  }

  /**
   * STEP 3:
   * Ambil master City + Province
   */
  const cityIds = grouped.map((g) => g.cityId!);

  const cities = await prisma.city.findMany({
    where: {
      id: { in: cityIds },
      isActive: true,
    },
    include: {
      province: true,
    },
  });

  const cityMap = new Map<
    number,
    { name: string; type: "KOTA" | "KABUPATEN"; provinceName: string }
  >(
    cities.map((c) => [
      c.id,
      {
        name: c.name,
        type: c.type,
        provinceName: c.province.name,
      },
    ])
  );

  /**
   * STEP 4:
   * Sort desc + Top N + Others
   */
  const sorted = grouped
    .map((g) => ({
      cityId: g.cityId!,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const top = sorted.slice(0, limit);
  const others = sorted.slice(limit);

  const totalLeads = sorted.reduce((sum, s) => sum + s.count, 0);

  /**
   * STEP 5:
   * Build response
   */
  const result: CityStat[] = top.map((item) => {
    const city = cityMap.get(item.cityId);

    return {
      cityId: item.cityId,
      cityName: city?.name ?? "UNKNOWN",
      cityType: city?.type,
      provinceName: city?.provinceName,
      count: item.count,
      percent: Number(((item.count / totalLeads) * 100).toFixed(2)),
    };
  });

  if (others.length > 0) {
    const othersCount = others.reduce((sum, c) => sum + c.count, 0);
    result.push({
      cityId: null,
      cityName: "OTHERS",
      count: othersCount,
      percent: Number(((othersCount / totalLeads) * 100).toFixed(2)),
    });
  }

  /**
   * STEP 6:
   * Response
   */
  return NextResponse.json({
    ok: true,
    totalLeads,
    data: result,
  });
}
