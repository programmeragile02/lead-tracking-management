import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );

  const { id } = await ctx.params;
  const categoryId = toId(id);
  if (!categoryId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body?.name !== undefined) data.name = String(body.name).trim();
  if (body?.code !== undefined) data.code = String(body.code).trim();
  if (body?.order !== undefined) data.order = Number(body.order) || 0;
  if (body?.isActive !== undefined) data.isActive = !!body.isActive;

  const updated = await prisma.nurturingCategory.update({
    where: { id: categoryId },
    data,
  });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );

  const { id } = await ctx.params;
  const categoryId = toId(id);
  if (!categoryId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  // safety: kalau ada topic, jangan hapus dulu
  const count = await prisma.nurturingTopic.count({ where: { categoryId } });
  if (count > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Kategori masih punya topik. Hapus/pindahkan topik dulu.",
      },
      { status: 400 }
    );
  }

  await prisma.nurturingCategory.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true });
}
