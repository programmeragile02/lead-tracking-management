import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || user.roleSlug !== "manager") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const rows = await prisma.lead.groupBy({
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
