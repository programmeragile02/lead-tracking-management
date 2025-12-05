import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_id" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const productId = Number(body?.productId);

  if (!productId || Number.isNaN(productId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_product" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, salesId: true },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found" },
      { status: 404 }
    );
  }

  // sales hanya boleh ubah lead miliknya
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isAvailable: true,
      deletedAt: null,
    },
  });

  if (!product) {
    return NextResponse.json(
      { ok: false, error: "product_not_found" },
      { status: 404 }
    );
  }

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      productId: product.id,
    },
    include: {
      product: true,
    },
  });

  return NextResponse.json({ ok: true, data: updated.product });
}
