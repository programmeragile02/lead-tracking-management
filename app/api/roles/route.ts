import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") === "true";

    const roles = await prisma.role.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { id: "asc" },
      include: {
        _count: onlyActive
          ? undefined
          : {
              select: { users: true },
            },
      },
    });

    const data = roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isActive: r.isActive,
      totalUsers: onlyActive ? undefined : r._count?.users ?? 0,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/roles error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat data role" },
      { status: 500 }
    );
  }
}
