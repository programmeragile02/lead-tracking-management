import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/lead-custom-fields/reorder
// body: { ids: number[] } → urutan baru
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (!ids.length) {
      return NextResponse.json(
        { ok: false, message: "Daftar ID tidak boleh kosong" },
        { status: 400 }
      );
    }

    // update sortOrder berdasarkan urutan array
    await Promise.all(
      ids.map((id: any, idx: number) =>
        prisma.leadCustomFieldDef.update({
          where: { id: Number(id) },
          data: { sortOrder: idx },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PATCH /lead-custom-fields/reorder error", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal mengurutkan field lead" },
      { status: 500 }
    );
  }
}
