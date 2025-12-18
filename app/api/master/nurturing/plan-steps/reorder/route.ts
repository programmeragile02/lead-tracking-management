import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));
  const planId = Number(body?.planId);
  const stepIds: number[] = Array.isArray(body?.stepIds)
    ? body.stepIds
        .map((x: any) => Number(x))
        .filter((n: any) => Number.isFinite(n))
    : [];

  if (!planId)
    return NextResponse.json(
      { ok: false, error: "planId wajib" },
      { status: 400 }
    );
  if (stepIds.length === 0)
    return NextResponse.json(
      { ok: false, error: "stepIds wajib" },
      { status: 400 }
    );

  await prisma.$transaction(async (tx) => {
    // Geser semua order ke range aman (1000+)
    await tx.nurturingPlanStep.updateMany({
      where: { planId },
      data: { order: { increment: 1000 } },
    });

    // Set order final sesuai urutan baru
    for (let i = 0; i < stepIds.length; i++) {
      await tx.nurturingPlanStep.update({
        where: { id: stepIds[i] },
        data: { order: i + 1 },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
