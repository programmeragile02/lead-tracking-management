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
  const templateId = toId(id);
  if (!templateId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body?.waTemplateTitle !== undefined)
    data.waTemplateTitle = body.waTemplateTitle
      ? String(body.waTemplateTitle)
      : null;
  if (body?.waTemplateBody !== undefined)
    data.waTemplateBody = body.waTemplateBody
      ? String(body.waTemplateBody)
      : null;
  if (body?.waTemplateMedia !== undefined)
    data.waTemplateMedia = body.waTemplateMedia
      ? String(body.waTemplateMedia)
      : null;
  if (body?.isActive !== undefined) data.isActive = !!body.isActive;

  const updated = await prisma.nurturingTemplate.update({
    where: { id: templateId },
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
  const templateId = toId(id);
  if (!templateId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  await prisma.nurturingTemplate.delete({ where: { id: templateId } });
  return NextResponse.json({ ok: true });
}
