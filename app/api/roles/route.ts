import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    const data = roles.map((r) => ({
      id: r.id,
      code: r.code as "MANAGER" | "TEAM_LEADER" | "SALES" | "SUPERADMIN",
      name: r.name,
      description: r.description,
      isActive: r.isActive,
      totalUsers: r._count.users,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/roles error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat data role", error: err?.message },
      { status: 500 }
    );
  }
}
