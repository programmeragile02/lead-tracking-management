import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || user.roleCode === "SALES") {
    return NextResponse.json(
      { ok: false, message: "Tidak punya akses" },
      { status: 403 }
    );
  }

  // =========================
  // QUERY PARAMS
  // =========================
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const teamLeaderId = searchParams.get("teamLeaderId");
  const salesId = searchParams.get("salesId");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);
  const skip = (page - 1) * pageSize;

  // =========================
  // WHERE BASE
  // =========================
  const where: any = {};

  // =========================
  // ROLE SCOPE
  // =========================
  if (user.roleCode === "TEAM_LEADER") {
    // TL hanya boleh lihat assignment sales timnya
    where.toSales = {
      teamLeaderId: user.id,
    };
  }

  // =========================
  // FILTER SEARCH
  // =========================
  if (q) {
    where.OR = [
      { lead: { name: { contains: q } } },
      { fromSales: { name: { contains: q } } },
      { toSales: { name: { contains: q } } },
      { assignedBy: { name: { contains: q } } },
    ];
  }

  // =========================
  // FILTER MANAGER
  // =========================
  if (teamLeaderId && user.roleCode === "MANAGER") {
    where.toSales = {
      teamLeaderId: Number(teamLeaderId),
    };
  }

  if (salesId) {
    where.toSalesId = Number(salesId);
  }

  // =========================
  // FILTER DATE
  // =========================
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  // =========================
  // QUERY DB
  // =========================
  const [rows, total] = await prisma.$transaction([
    prisma.leadAssignmentHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        lead: { select: { id: true, name: true } },
        fromSales: { select: { id: true, name: true } },
        toSales: { select: { id: true, name: true } },
        assignedBy: {
          select: {
            id: true,
            name: true,
            role: { select: { code: true } },
          },
        },
      },
    }),
    prisma.leadAssignmentHistory.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    data: rows,
    page,
    pageSize,
    total,
    hasNext: skip + rows.length < total,
  });
}
