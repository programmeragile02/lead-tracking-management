import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function getWeekOfMonth(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");

    const now = new Date();
    const [y, m] = monthParam
      ? monthParam.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 1);

    // ambil TL + sales
    const tl = await prisma.user.findFirst({
      where: {
        id: user.id,
        role: { code: "TEAM_LEADER" },
      },
      include: {
        sales: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!tl) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const salesIds = tl.sales.map((s) => s.id);

    // ===== LEAD BARU =====
    const leads = await prisma.lead.findMany({
      where: {
        salesId: { in: salesIds },
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      select: { createdAt: true },
    });

    // ===== CLOSING =====
    const closings = await prisma.lead.findMany({
      where: {
        salesId: { in: salesIds },
        status: { code: "CLOSE_WON" },
        updatedAt: { gte: monthStart, lt: monthEnd },
      },
      select: {
        updatedAt: true,
        priceClosing: true,
      },
    });

    const leadByWeek: Record<number, number> = {};
    const revenueByWeek: Record<number, number> = {};

    leads.forEach((l) => {
      const w = getWeekOfMonth(l.createdAt);
      leadByWeek[w] = (leadByWeek[w] ?? 0) + 1;
    });

    closings.forEach((c) => {
      const w = getWeekOfMonth(c.updatedAt);
      revenueByWeek[w] = (revenueByWeek[w] ?? 0) + Number(c.priceClosing ?? 0);
    });

    const maxWeek = Math.max(
      ...Object.keys({ ...leadByWeek, ...revenueByWeek }).map(Number),
      4
    );

    const trend = Array.from({ length: maxWeek }, (_, i) => {
      const week = i + 1;
      return {
        week: `Minggu ${week}`,
        leads: leadByWeek[week] ?? 0,
        revenue: revenueByWeek[week] ?? 0,
      };
    });

    return NextResponse.json({
      ok: true,
      data: trend,
    });
  } catch (e) {
    console.error("[TL_TREND]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
