import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: list jenis tindak lanjut (pagination + search)
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
            OR: [{ name: { contains: q } }, { code: { contains: q } }],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.leadFollowUpType.findMany({
        where,
        orderBy: { order: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leadFollowUpType.count({ where }),
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
    console.error("GET /api/lead-followup-types error:", error);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil data tindak lanjut" },
      { status: 500 }
    );
  }
}

// POST: buat jenis tindak lanjut baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawCode = String(body.code || "").trim();

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Nama tindak lanjut wajib diisi" },
        { status: 400 }
      );
    }

    const code =
      rawCode
        .toUpperCase()
        .replace(/[^A-Z0-9_]+/g, "_")
        .slice(0, 50) || `FU_${Date.now()}`;

    const lastOrder = await prisma.leadFollowUpType.findFirst({
      where: { deletedAt: null },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    // convert numeric
    const nurturingOrder =
      body.nurturingOrder === null || body.nurturingOrder === undefined
        ? null
        : Number(body.nurturingOrder);
    const autoDelayHours =
      body.autoDelayHours === null || body.autoDelayHours === undefined
        ? null
        : Number(body.autoDelayHours);

    const created = await prisma.leadFollowUpType.create({
      data: {
        name,
        code,
        description: body.description || null,
        order: (lastOrder?.order ?? 0) + 1,
        isActive: body.isActive ?? true,

        isNurturingStep: body.isNurturingStep ?? false,
        nurturingOrder: body.isNurturingStep ? nurturingOrder : null,
        autoDelayHours: body.isNurturingStep ? autoDelayHours : null,
        autoOnLeadCreate: body.isNurturingStep
          ? body.autoOnLeadCreate ?? false
          : false,

        waTemplateTitle: body.waTemplateTitle || null,
        waTemplateBody: body.waTemplateBody || null,
        waTemplateMedia: body.waTemplateMedia || null,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    console.error("POST /api/lead-followup-types error:", error);
    return NextResponse.json(
      { ok: false, message: "Gagal menambah tindak lanjut" },
      { status: 500 }
    );
  }
}
