import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = {};
  if (categoryId) where.categoryId = Number(categoryId);
  if (q) where.title = { contains: q };

  const items = await prisma.nurturingTopic.findMany({
    where,
    include: { category: true, templates: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, data: items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));

  const categoryId = Number(body?.categoryId);
  const title = String(body?.title ?? "").trim();
  const description = body?.description ? String(body.description) : null;
  const order = Number.isFinite(Number(body?.order)) ? Number(body.order) : 0;
  const isActive = body?.isActive === false ? false : true;

  if (!categoryId)
    return NextResponse.json(
      { ok: false, error: "categoryId wajib" },
      { status: 400 }
    );
  if (!title)
    return NextResponse.json(
      { ok: false, error: "Judul wajib" },
      { status: 400 }
    );

  const created = await prisma.nurturingTopic.create({
    data: { categoryId, title, description, order, isActive },
  });

  return NextResponse.json({ ok: true, data: created });
}
