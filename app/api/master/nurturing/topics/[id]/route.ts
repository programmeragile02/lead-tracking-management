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
  const topicId = toId(id);
  if (!topicId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (body?.categoryId !== undefined) data.categoryId = Number(body.categoryId);
  if (body?.title !== undefined) data.title = String(body.title).trim();
  if (body?.description !== undefined)
    data.description = body.description ? String(body.description) : null;
  if (body?.order !== undefined) data.order = Number(body.order) || 0;
  if (body?.isActive !== undefined) data.isActive = !!body.isActive;

  const updated = await prisma.nurturingTopic.update({
    where: { id: topicId },
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
  const topicId = toId(id);
  if (!topicId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  // hapus template dulu biar rapi
  await prisma.nurturingTemplate.deleteMany({ where: { topicId } });
  await prisma.nurturingTopic.delete({ where: { id: topicId } });

  return NextResponse.json({ ok: true });
}
