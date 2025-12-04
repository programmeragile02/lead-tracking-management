import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: list sumber lead (dengan pagination + search)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || "1") || 1;
    const pageSize = Number(searchParams.get("pageSize") || "10") || 10;
    const q = (searchParams.get("q") || "").trim();

    const where = {
      deletedAt: null as Date | null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { code: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.leadSource.findMany({
        where,
        orderBy: { order: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leadSource.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      ok: true,
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/lead-sources error:", error);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil data sumber lead" },
      { status: 500 }
    );
  }
}

// POST: buat sumber lead baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawCode = String(body.code || "").trim();

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Nama sumber lead wajib diisi" },
        { status: 400 }
      );
    }

    const code =
      rawCode
        .toUpperCase()
        .replace(/[^A-Z0-9_]+/g, "_")
        .slice(0, 50) || `SRC_${Date.now()}`;

    const lastOrder = await prisma.leadSource.findFirst({
      where: { deletedAt: null },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const created = await prisma.leadSource.create({
      data: {
        name,
        code,
        description: body.description || null,
        order: (lastOrder?.order ?? 0) + 1,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    console.error("POST /api/lead-sources error:", error);
    return NextResponse.json(
      { ok: false, message: "Gagal menambah sumber lead" },
      { status: 500 }
    );
  }
}
