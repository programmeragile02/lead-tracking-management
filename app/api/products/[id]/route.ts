import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = {
  params: Promise<{ id: string }>;
};

// PUT /api/products/:id  → update produk
export async function PUT(req: Request, context: ParamsPromise) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { ok: false, message: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const {
      category,
      name,
      description,
      photo,
      isAvailable,
      demoLinks,
      testimonialLinks,
      educationLinks,
    } = body;

    if (!category || !name) {
      return NextResponse.json(
        { ok: false, message: "Kategori dan nama produk wajib diisi" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        category,
        name,
        description: description || null,
        photo: photo || null,
        isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
        demoLinks:
          Array.isArray(demoLinks) && demoLinks.length > 0 ? demoLinks : null,
        testimonialLinks:
          Array.isArray(testimonialLinks) && testimonialLinks.length > 0
            ? testimonialLinks
            : null,
        educationLinks:
          Array.isArray(educationLinks) && educationLinks.length > 0
            ? educationLinks
            : null,
      },
    });

    return NextResponse.json({ ok: true, data: product });
  } catch (err) {
    console.error("PUT /api/products/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal memperbarui produk" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id → soft delete
export async function DELETE(_req: Request, context: ParamsPromise) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { ok: false, message: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/products/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
