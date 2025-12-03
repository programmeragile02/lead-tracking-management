import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/lead-statuses
export async function GET() {
  try {
    const statuses = await prisma.leadStatus.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ ok: true, data: statuses });
  } catch (err) {
    console.error("GET /lead-statuses error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil data status lead" },
      { status: 500 }
    );
  }
}

// POST /api/lead-statuses
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const name = String(json?.name ?? "").trim();
    const code = String(json?.code ?? "")
      .trim()
      .toUpperCase();
    const order = Number(json?.order ?? 0);

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Nama status wajib diisi" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { ok: false, message: "Kode status wajib diisi" },
        { status: 400 }
      );
    }

    const status = await prisma.leadStatus.create({
      data: {
        name,
        code,
        order: Number.isNaN(order) ? 0 : order,
        isActive: json?.isActive ?? true,
      },
    });

    return NextResponse.json({ ok: true, data: status });
  } catch (err: any) {
    console.error("POST /lead-statuses error:", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal membuat status lead" },
      { status: 500 }
    );
  }
}
