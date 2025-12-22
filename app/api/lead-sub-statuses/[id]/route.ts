import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Params) {
  try {
    const { id } = await ctx.params;
    const subStatusId = Number(id);
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const code = String(body?.code ?? "")
      .trim()
      .toUpperCase();
    const isActive = body?.isActive;

    if (!name || !code) {
      return NextResponse.json(
        { ok: false, message: "Nama dan kode wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.leadSubStatus.update({
      where: { id: subStatusId },
      data: {
        name,
        code,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("PUT /lead-sub-statuses/[id] error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal memperbarui sub status" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, ctx: Params) {
  try {
    const { id } = await ctx.params;
    const subStatusId = Number(id);

    const updated = await prisma.leadSubStatus.update({
      where: { id: subStatusId },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("DELETE /lead-sub-statuses/[id] error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menonaktifkan sub status" },
      { status: 500 }
    );
  }
}
