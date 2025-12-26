import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const statusCode = searchParams.get("statusCode");
    const subStatusCode = searchParams.get("subStatusCode");

    if (!statusCode) {
      return NextResponse.json(
        { ok: false, message: "statusCode wajib diisi" },
        { status: 400 }
      );
    }

    //  Ambil semua lead sesuai filter
    const leads = await prisma.lead.findMany({
      where: {
        status: { code: statusCode },
        ...(subStatusCode ? { subStatus: { code: subStatusCode } } : {}),
      },
      select: {
        stageId: true,
      },
    });

    const stageIds = [...new Set(leads.map((l) => l.stageId).filter(Boolean))];

    if (stageIds.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    //  Ambil detail stage-nya
    const stages = await prisma.leadStage.findMany({
      where: {
        id: { in: stageIds },
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: stages,
    });
  } catch (err) {
    console.error("GET /api/lead-filters/stages", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil data tahap" },
      { status: 500 }
    );
  }
}
