import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = {
  params: Promise<{ id: string }>;
};

// PUT /api/lead-custom-fields/:id
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

    const rawLabel = String(body?.label ?? "").trim();
    const rawKey = String(body?.key ?? "").trim();
    const type = String(body?.type ?? "")
      .trim()
      .toUpperCase();
    const placeholder = body?.placeholder ? String(body.placeholder) : null;
    const helpText = body?.helpText ? String(body.helpText) : null;
    const isRequired = Boolean(body?.isRequired ?? false);
    const isActive = Boolean(body?.isActive ?? true);
    const options = Array.isArray(body?.options) ? body.options : null;

    if (!rawLabel) {
      return NextResponse.json(
        { ok: false, message: "Label field wajib diisi" },
        { status: 400 }
      );
    }
    if (!type) {
      return NextResponse.json(
        { ok: false, message: "Tipe field wajib dipilih" },
        { status: 400 }
      );
    }

    const key =
      rawKey ||
      rawLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 50);

    // update field dasar dulu
    const updated = await prisma.leadCustomFieldDef.update({
      where: { id },
      data: {
        label: rawLabel,
        key,
        type: type as any,
        placeholder,
        helpText,
        isRequired,
        isActive,
      },
    });

    // kalau ada options dikirim, kita reset semua options lama lalu create ulang
    if (options && (type === "SINGLE_SELECT" || type === "MULTI_SELECT")) {
      await prisma.leadCustomFieldOption.deleteMany({
        where: { fieldId: id },
      });

      if (options.length > 0) {
        await prisma.leadCustomFieldOption.createMany({
          data: options.map((opt: any, idx: number) => ({
            fieldId: id,
            label: String(opt?.label ?? "").trim(),
            value:
              String(opt?.value ?? "").trim() ||
              rawLabel
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 50),
            sortOrder: idx,
          })),
        });
      }
    } else if (options && options.length === 0) {
      // type bukan select / multi, atau options dikosongkan
      await prisma.leadCustomFieldOption.deleteMany({
        where: { fieldId: id },
      });
    }

    const fieldWithOptions = await prisma.leadCustomFieldDef.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ ok: true, data: fieldWithOptions });
  } catch (err: any) {
    console.error("PUT /lead-custom-fields/[id] error", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal mengupdate field lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/lead-custom-fields/:id  → soft delete (isActive = false)
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

    const field = await prisma.leadCustomFieldDef.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, data: field });
  } catch (err: any) {
    console.error("DELETE /lead-custom-fields/[id] error", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal menonaktifkan field lead" },
      { status: 500 }
    );
  }
}
