import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = {
  params: Promise<{ id: string }>;
};

// PUT /api/lead-statuses/:id → update status
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
        { ok: false, message: "Nama dan kode status wajib diisi" },
        { status: 400 }
      );
    }

    const status = await prisma.leadStatus.update({
      where: { id },
      data: {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        order: Number(order) || 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json({ ok: true, data: status });
  } catch (err) {
    console.error("PUT /api/lead-statuses/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal memperbarui status lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/lead-statuses/:id → soft delete (isActive = false)
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

    const status = await prisma.leadStatus.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, data: status });
  } catch (err) {
    console.error("DELETE /api/lead-statuses/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menonaktifkan status lead" },
      { status: 500 }
    );
  }
}
