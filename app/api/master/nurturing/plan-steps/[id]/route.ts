import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingTemplateSlot } from "@prisma/client";

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
  const stepId = toId(id);
  if (!stepId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (body?.delayHours !== undefined)
    data.delayHours = Number(body.delayHours) || 24;
  if (body?.slot !== undefined) {
    const slot = String(body.slot).toUpperCase();
    if (slot !== "A" && slot !== "B")
      return NextResponse.json(
        { ok: false, error: "slot harus A/B" },
        { status: 400 }
      );
    data.slot = slot as NurturingTemplateSlot;
  }
  if (body?.isActive !== undefined) data.isActive = !!body.isActive;

  const updated = await prisma.nurturingPlanStep.update({
    where: { id: stepId },
    data,
    include: { topic: { include: { category: true } } },
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
  const stepId = toId(id);
  if (!stepId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  await prisma.nurturingPlanStep.delete({ where: { id: stepId } });
  return NextResponse.json({ ok: true });
}
