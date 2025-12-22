import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusCode = searchParams.get("statusCode");

  const where: any = { isActive: true };

  if (statusCode) {
    where.status = { code: statusCode };
  }

  const data = await prisma.leadSubStatus.findMany({
    where,
    orderBy: [{ status: { order: "asc" } }, { order: "asc" }],
    include: {
      status: { select: { code: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, data });
}

// POST create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const code = String(body?.code ?? "")
      .trim()
      .toUpperCase();
    const statusId = Number(body?.statusId);

    if (!name || !code || !statusId) {
      return NextResponse.json(
        { ok: false, message: "Nama, kode, dan status utama wajib diisi" },
        { status: 400 }
      );
    }

    const last = await prisma.leadSubStatus.findFirst({
      where: { statusId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = (last?.order ?? 0) + 1;

    const created = await prisma.leadSubStatus.create({
      data: {
        name,
        code,
        statusId,
        order,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (err: any) {
    console.error("POST /lead-sub-statuses error:", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal membuat sub status" },
      { status: 500 }
    );
  }
}
