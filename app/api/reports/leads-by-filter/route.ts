import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function parsePeriod(period?: string | null) {
  if (!period) return null;
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return null;

  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const role = (user as any).roleCode;
    if (role !== "MANAGER" && role !== "TEAM_LEADER") {
      return NextResponse.json(
        { ok: false, error: "Role tidak diizinkan" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get("itemType"); // status | sub_status | stage | follow_up
    const itemId = Number(searchParams.get("itemId"));
    const salesId = Number(searchParams.get("salesId"));
    const period = searchParams.get("period");

    if (!itemType || !itemId) {
      return NextResponse.json(
        { ok: false, error: "itemType & itemId wajib" },
        { status: 400 }
      );
    }

    const range = parsePeriod(period);

    /* ================= SALES SCOPE ================= */
    let salesIds: number[] = [];

    if (role === "TEAM_LEADER") {
      const sales = await prisma.user.findMany({
        where: {
          teamLeaderId: user.id,
          role: { code: "SALES" },
          isActive: true,
        },
        select: { id: true },
      });
      salesIds = sales.map((s) => s.id);
    }

    if (role === "MANAGER") {
      const tls = await prisma.user.findMany({
        where: {
          managerId: user.id,
          role: { code: "TEAM_LEADER" },
        },
        select: { id: true },
      });

      const sales = await prisma.user.findMany({
        where: {
          teamLeaderId: { in: tls.map((t) => t.id) },
          role: { code: "SALES" },
          isActive: true,
        },
        select: { id: true },
      });

      salesIds = sales.map((s) => s.id);
    }

    if (salesId && !salesIds.includes(salesId)) {
      return NextResponse.json(
        { ok: false, error: "Sales tidak diizinkan" },
        { status: 403 }
      );
    }

    const effectiveSalesIds = salesId ? [salesId] : salesIds;

    /* ================= FILTER BY ITEM TYPE ================= */
    const whereLead: any = {
      salesId: { in: effectiveSalesIds },
      isExcluded: false,
    };

    if (range) {
      whereLead.updatedAt = {
        gte: range.start,
        lt: range.end,
      };
    }

    if (itemType === "status") {
      whereLead.statusId = itemId;
    }

    if (itemType === "sub_status") {
      whereLead.subStatusId = itemId;
    }

    if (itemType === "stage") {
      whereLead.stageId = itemId;
    }

    if (itemType === "follow_up") {
      whereLead.followUps = {
        some: {
          typeId: itemId,
          doneAt: range ? { gte: range.start, lt: range.end } : { not: null },
        },
      };
    }

    /* ================= QUERY LEADS ================= */
    const leads = await prisma.lead.findMany({
      where: whereLead,
      orderBy: { updatedAt: "desc" },
      take: 200, // safety limit
      select: {
        id: true,
        name: true,
        phone: true,
        updatedAt: true,
        sales: { select: { name: true } },
        status: { select: { name: true } },
        subStatus: { select: { name: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      data: leads.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        salesName: l.sales?.name,
        status: l.status?.name,
        subStatus: l.subStatus?.name,
        updatedAt: l.updatedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat lead" },
      { status: 500 }
    );
  }
}
