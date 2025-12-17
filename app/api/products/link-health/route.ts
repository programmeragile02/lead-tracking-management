import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type LinkItem = { label?: string | null; url?: string | null };

function countValidLinks(raw: any): number {
  if (!Array.isArray(raw)) return 0;
  return (raw as LinkItem[]).filter((x) => String(x?.url ?? "").trim()).length;
}

export async function GET(req: Request) {
  const user = await getCurrentUser(req as any);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      demoLinks: true,
      testimonialLinks: true,
      educationLinks: true,
    },
    orderBy: { name: "asc" },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    demoCount: countValidLinks(p.demoLinks),
    testiCount: countValidLinks(p.testimonialLinks),
    edukasiCount: countValidLinks(p.educationLinks),
  }));

  const missing = {
    demo: rows
      .filter((x) => x.demoCount === 0)
      .map((x) => ({ id: x.id, name: x.name })),
    testi: rows
      .filter((x) => x.testiCount === 0)
      .map((x) => ({ id: x.id, name: x.name })),
    edukasi: rows
      .filter((x) => x.edukasiCount === 0)
      .map((x) => ({ id: x.id, name: x.name })),
  };

  return NextResponse.json({
    ok: true,
    data: {
      total: rows.length,
      missing,
    },
  });
}
