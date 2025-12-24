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
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const teamLeaderIdParam = searchParams.get("teamLeaderId");
  const teamLeaderId = teamLeaderIdParam ? Number(teamLeaderIdParam) : null;

  const whereLead: any = {};

  if (user.roleSlug === "team-leader") {
    whereLead.sales = { teamLeaderId: user.id };
  }

  if (user.roleSlug === "manager" && teamLeaderId) {
    whereLead.sales = { teamLeaderId };
  }

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

  const result: Record<number, number> = {};
  let total = 0;

  for (const r of rows) {
    if (!r.salesId) continue;
    result[r.salesId] = r._count._all;
    total += r._count._all;
  }

  return NextResponse.json({
    ok: true,
    data: result, // { salesId: count }
    total,
  });
}
