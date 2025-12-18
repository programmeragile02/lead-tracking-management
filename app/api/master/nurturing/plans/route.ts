import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const where: any = {};
  if (productId) where.productId = Number(productId);

  const items = await prisma.nurturingPlan.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
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
  const code = String(body?.code ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const description = body?.description ? String(body.description) : null;
  const isActive = body?.isActive === false ? false : true;

  const productId = body?.productId ? Number(body.productId) : null;
  const sourceId = body?.sourceId ? Number(body.sourceId) : null;
  const targetStatusCode = body?.targetStatusCode
    ? String(body.targetStatusCode).trim()
    : null;

  if (!code)
    return NextResponse.json(
      { ok: false, error: "Code urutan wajib" },
      { status: 400 }
    );
  if (!name)
    return NextResponse.json(
      { ok: false, error: "Nama urutan wajib" },
      { status: 400 }
    );

  const created = await prisma.nurturingPlan.create({
    data: {
      code,
      name,
      description,
      isActive,
      productId,
      sourceId,
      targetStatusCode,
    },
  });

  return NextResponse.json({ ok: true, data: created });
}
