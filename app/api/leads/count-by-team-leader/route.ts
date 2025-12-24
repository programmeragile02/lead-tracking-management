import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function getMonthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return null;

  return {
    start: new Date(y, m - 1, 1, 0, 0, 0),
    end: new Date(y, m, 1, 0, 0, 0),
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");

  if (!user || user.roleSlug !== "manager") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const whereLead: any = {};

  if (monthParam) {
    const range = getMonthRange(monthParam);
    if (range) {
      whereLead.createdAt = {
        gte: range.start,
        lt: range.end,
      };
    }
  }

  const rows = await prisma.lead.groupBy({
    where: whereLead,
    by: ["salesId"],
    _count: { _all: true },
  });

  const salesIds = rows
    .map((r) => r.salesId)
    .filter((id): id is number => id !== null);

  const sales = await prisma.user.findMany({
    where: { id: { in: salesIds } },
    select: {
      id: true,
      teamLeaderId: true,
    },
  });

  const mapSalesToTL = new Map<number, number>();
  for (const s of sales) {
    if (s.teamLeaderId) {
      mapSalesToTL.set(s.id, s.teamLeaderId);
    }
  }

  const result: Record<number, number> = {};
  let total = 0;

  for (const r of rows) {
    const count = r._count._all;
    total += count;

    const tlId = mapSalesToTL.get(r.salesId!);
    if (!tlId) continue;

    result[tlId] = (result[tlId] || 0) + count;
  }

  return NextResponse.json({
    ok: true,
    data: result, // { teamLeaderId: count }
    total,
  });
}
