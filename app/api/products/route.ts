import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qRaw = searchParams.get("q");
  const q = qRaw?.trim() || "";

  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "9");

  const where: any = {
    deletedAt: null,
  };

  if (q) {
    const qTrim = q.trim();
    where.OR = [
      { name: { contains: qTrim } },
      { category: { contains: qTrim } },
      { description: { contains: qTrim } },
    ];
  }

  const page = pageParam > 0 ? pageParam : 1;
  const pageSize =
    pageSizeParam > 0 && pageSizeParam <= 100 ? pageSizeParam : 9;

  const total = await prisma.product.count({ where });

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    ok: true,
    data: products,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
}

export async function POST(req: Request) {
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

    const product = await prisma.product.create({
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
    console.error("POST /api/products error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan produk" },
      { status: 500 }
    );
  }
}
