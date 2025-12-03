// app/api/lead-stages/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = {
  params: Promise<{ id: string }>;
};

// PUT /api/lead-stages/:id → update tahap
export async function PUT(req: Request, context: ParamsPromise) {
  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { ok: false, message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, code, order, isActive } = body;

    if (!name || !code) {
      return NextResponse.json(
        { ok: false, message: "Nama dan kode tahap wajib diisi" },
        { status: 400 }
      );
    }

    const stage = await prisma.leadStage.update({
      where: { id },
      data: {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        order: Number(order) || 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json({ ok: true, data: stage });
  } catch (err) {
    console.error("PUT /api/lead-stages/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal memperbarui tahap" },
      { status: 500 }
    );
  }
}

// DELETE /api/lead-stages/:id → soft delete (isActive = false)
export async function DELETE(_req: Request, context: ParamsPromise) {
  try {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { ok: false, message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const stage = await prisma.leadStage.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, data: stage });
  } catch (err) {
    console.error("DELETE /api/lead-stages/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menonaktifkan tahap" },
      { status: 500 }
    );
  }
}
