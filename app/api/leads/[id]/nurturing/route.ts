import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingPauseReason, NurturingStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "Lead ID tidak valid" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const enabled = !!body?.enabled;

  const now = new Date();

  // (opsional tapi bagus) guard: sales hanya boleh toggle lead miliknya
  // kalau kamu mau TL/Manager juga bisa, tinggal longgarkan.
  if (user.roleSlug === "sales") {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { salesId: true },
    });
    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "Lead tidak ditemukan" },
        { status: 404 }
      );
    }
    if (lead.salesId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  const state = await prisma.leadNurturingState.upsert({
    where: { leadId },
    create: {
      leadId,
      status: enabled ? NurturingStatus.ACTIVE : NurturingStatus.PAUSED,

      // OFF bukan permanent pause → tetap false (biar cron auto-resume bisa nyalain lagi)
      manualPaused: false,

      pauseReason: enabled ? null : NurturingPauseReason.MANUAL_TOGGLE,
      pausedAt: enabled ? null : now,

      // OFF: stop total
      nextSendAt: enabled ? new Date(now.getTime() + 5 * 60 * 1000) : null,

      startedAt: enabled ? now : null,
      currentStep: 0,
    } as any,
    update: {
      status: enabled ? NurturingStatus.ACTIVE : NurturingStatus.PAUSED,

      // tetap false
      manualPaused: false,

      pauseReason: enabled ? null : NurturingPauseReason.MANUAL_TOGGLE,
      pausedAt: enabled ? null : now,

      // OFF: clear jadwal, ON: kalau sebelumnya null, kasih jadwal cepat
      nextSendAt: enabled ? undefined : null,
    } as any,
  });

  // Kalau enable=true dan nextSendAt masih null, set cepat (tanpa nabrak jadwal lama)
  if (enabled && !state.nextSendAt) {
    await prisma.leadNurturingState.update({
      where: { leadId },
      data: {
        nextSendAt: new Date(now.getTime() + 5 * 60 * 1000),
      } as any,
    });
  }

  return NextResponse.json({ ok: true, data: state });
}
