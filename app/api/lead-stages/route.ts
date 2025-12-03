// app/api/lead-stages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/lead-stages?page=&pageSize=&q=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = Number(searchParams.get("page") || "1");
    const pageSizeParam = Number(searchParams.get("pageSize") || "10");
    const q = searchParams.get("q")?.trim() || "";

    const page = !Number.isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSize =
      !Number.isNaN(pageSizeParam) && pageSizeParam > 0
        ? Math.min(pageSizeParam, 50)
        : 10;

    const where: any = {
      isActive: true,
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.leadStage.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leadStage.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      ok: true,
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error("GET /lead-stages error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil data tahap" },
      { status: 500 }
    );
  }
}

// POST /api/lead-stages
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const name = String(json?.name ?? "").trim();
    const code = String(json?.code ?? "")
      .trim()
      .toUpperCase();
    const order = Number(json?.order ?? 0);
    const isActive = json?.isActive ?? true;

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Nama tahap wajib diisi" },
        { status: 400 }
      );
    }
    if (!code) {
      return NextResponse.json(
        { ok: false, message: "Kode tahap wajib diisi" },
        { status: 400 }
      );
    }

    const stage = await prisma.leadStage.create({
      data: {
        name,
        code,
        order: Number.isNaN(order) ? 0 : order,
        isActive,
      },
    });

    return NextResponse.json({ ok: true, data: stage });
  } catch (err: any) {
    console.error("POST /lead-stages error:", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal membuat tahap" },
      { status: 500 }
    );
  }
}
