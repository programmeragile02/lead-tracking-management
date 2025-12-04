import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = { params: Promise<{ id: string }> };

async function getIdFromParams(paramsPromise: Promise<{ id: string }>) {
  const { id } = await paramsPromise;
  const num = Number(id);
  if (!id || Number.isNaN(num)) {
    throw new Error("ID tidak valid");
  }
  return num;
}

// UPDATE tindak lanjut
export async function PUT(req: NextRequest, ctx: ParamsPromise) {
  try {
    const id = await getIdFromParams(ctx.params);
    const body = await req.json();

    const name = String(body.name || "").trim();
    const rawCode = String(body.code || "").trim();
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Nama tindak lanjut wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.leadFollowUpType.update({
      where: { id },
      data: {
        name,
        code:
          rawCode
            .toUpperCase()
            .replace(/[^A-Z0-9_]+/g, "_")
            .slice(0, 50) || undefined,
        description: body.description || null,
        isActive,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/lead-followup-types/[id] error:", error);
    const msg =
      error?.message === "ID tidak valid"
        ? "ID tidak valid"
        : "Gagal mengubah tindak lanjut";
    const status = error?.message === "ID tidak valid" ? 400 : 500;
    return NextResponse.json({ ok: false, message: msg }, { status });
  }
}

// SOFT DELETE tindak lanjut
export async function DELETE(_req: NextRequest, ctx: ParamsPromise) {
  try {
    const id = await getIdFromParams(ctx.params);

    await prisma.leadFollowUpType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/lead-followup-types/[id] error:", error);
    const msg =
      error?.message === "ID tidak valid"
        ? "ID tidak valid"
        : "Gagal menghapus tindak lanjut";
    const status = error?.message === "ID tidak valid" ? 400 : 500;
    return NextResponse.json({ ok: false, message: msg }, { status });
  }
}
