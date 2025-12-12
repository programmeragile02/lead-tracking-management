import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "Belum login" },
        { status: 401 }
      );
    }

    // hanya manager yang boleh
    if (currentUser.roleCode !== "MANAGER") {
      return NextResponse.json(
        { ok: false, error: "Tidak diizinkan" },
        { status: 403 }
      );
    }

    const tls = await prisma.user.findMany({
      where: {
        role: { code: "TEAM_LEADER" },
        managerId: currentUser.id,
        isActive: true,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, data: tls });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat team leader" },
      { status: 500 }
    );
  }
}
