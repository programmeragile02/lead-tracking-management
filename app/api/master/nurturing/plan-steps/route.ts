import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingTemplateSlot } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));
  const planId = Number(body?.planId);
  const topicId = Number(body?.topicId);
  const delayHours = Number.isFinite(Number(body?.delayHours))
    ? Number(body.delayHours)
    : 24;
  const slot = String(body?.slot ?? "A").toUpperCase();

  if (!planId)
    return NextResponse.json(
      { ok: false, error: "planId wajib" },
      { status: 400 }
    );
  if (!topicId)
    return NextResponse.json(
      { ok: false, error: "topicId wajib" },
      { status: 400 }
    );
  if (slot !== "A" && slot !== "B")
    return NextResponse.json(
      { ok: false, error: "slot harus A/B" },
      { status: 400 }
    );

  // order terakhir + 1
  const last = await prisma.nurturingPlanStep.findFirst({
    where: { planId },
    orderBy: [{ order: "desc" }, { id: "desc" }],
    select: { order: true },
  });
  const nextOrder = (last?.order ?? 0) + 1;

  const created = await prisma.nurturingPlanStep.create({
    data: {
      planId,
      topicId,
      order: nextOrder,
      delayHours,
      slot: slot as NurturingTemplateSlot,
      isActive: true,
    },
    include: { topic: { include: { category: true } } },
  });

  return NextResponse.json({ ok: true, data: created });
}
