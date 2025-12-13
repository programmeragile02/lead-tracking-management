import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const planId = toId(id);
  if (!planId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  const plan = await prisma.nurturingPlan.findUnique({
    where: { id: planId },
    include: {
      steps: {
        where: { isActive: true },
        include: { topic: { include: { category: true } } },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!plan)
    return NextResponse.json(
      { ok: false, error: "Plan tidak ditemukan" },
      { status: 404 }
    );
  return NextResponse.json({ ok: true, data: plan });
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
  const planId = toId(id);
  if (!planId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (body?.code !== undefined) data.code = String(body.code).trim();
  if (body?.name !== undefined) data.name = String(body.name).trim();
  if (body?.description !== undefined)
    data.description = body.description ? String(body.description) : null;
  if (body?.isActive !== undefined) data.isActive = !!body.isActive;
  if (body?.productId !== undefined)
    data.productId = body.productId ? Number(body.productId) : null;
  if (body?.sourceId !== undefined)
    data.sourceId = body.sourceId ? Number(body.sourceId) : null;
  if (body?.targetStatusCode !== undefined)
    data.targetStatusCode = body.targetStatusCode
      ? String(body.targetStatusCode).trim()
      : null;

  const updated = await prisma.nurturingPlan.update({
    where: { id: planId },
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
  const planId = toId(id);
  if (!planId)
    return NextResponse.json(
      { ok: false, error: "ID invalid" },
      { status: 400 }
    );

  await prisma.nurturingPlanStep.deleteMany({ where: { planId } });
  await prisma.nurturingPlan.delete({ where: { id: planId } });

  return NextResponse.json({ ok: true });
}
