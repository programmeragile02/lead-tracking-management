import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    // biar konsisten: meta hanya untuk SALES juga
    if (user.roleCode !== "SALES") {
      return NextResponse.json(
        { ok: false, error: "Hanya SALES yang boleh akses meta import." },
        { status: 403 }
      );
    }

    const [products, sources, stages, statuses] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.leadSource.findMany({
        where: { deletedAt: null },
        select: { id: true, code: true, name: true },
        orderBy: { order: "asc" },
      }),
      prisma.leadStage.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, order: true },
        orderBy: { order: "asc" },
      }),
      prisma.leadStatus.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, order: true },
        orderBy: { order: "asc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: { products, sources, stages, statuses },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Gagal ambil meta." },
      { status: 500 }
    );
  }
}
