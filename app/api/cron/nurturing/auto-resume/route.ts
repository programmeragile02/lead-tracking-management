import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NurturingStatus } from "@prisma/client";

const CRON_KEY = process.env.NURTURING_CRON_KEY || "";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-cron-key") || "";
  if (!CRON_KEY || key !== CRON_KEY) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const now = new Date();

  const setting = await prisma.generalSetting.findUnique({ where: { id: 1 } });
  const maxIdleHours = setting?.maxIdleHoursBeforeResume ?? 48;
  const idleThreshold = hoursAgo(maxIdleHours);

  const pausedStates = await prisma.leadNurturingState.findMany({
    where: {
      status: NurturingStatus.PAUSED,
      manualPaused: false, // supaya toggle OFF kamu bisa auto-resume
      pausedAt: { not: null, lte: idleThreshold },
    },
    take: 200,
    select: { leadId: true, planId: true, nextSendAt: true },
  });

  let resumed = 0;
  let skippedPendingFU = 0;
  let skippedInboundRecent = 0;

  for (const st of pausedStates) {
    // Guard: masih ada follow up pending
    const pending = await prisma.leadFollowUp.count({
      where: { leadId: st.leadId, doneAt: null },
    });
    if (pending > 0) {
      skippedPendingFU++;
      continue;
    }

    // Guard optional: kalau inbound masih dalam window idle (lebih baru dari threshold), jangan resume
    const lastInbound = await prisma.leadMessage.findFirst({
      where: { leadId: st.leadId, direction: "INBOUND" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastInbound?.createdAt && lastInbound.createdAt > idleThreshold) {
      skippedInboundRecent++;
      continue;
    }

    // Jadwal kirim setelah resume:
    // - kalau sudah ada nextSendAt di masa depan, pakai itu
    // - kalau null / sudah lewat, set 5 menit lagi
    const nextSend =
      st.nextSendAt && st.nextSendAt > now
        ? st.nextSendAt
        : new Date(now.getTime() + 5 * 60 * 1000);

    await prisma.leadNurturingState.update({
      where: { leadId: st.leadId },
      data: {
        status: NurturingStatus.ACTIVE,
        manualPaused: false,
        pauseReason: null,
        pausedAt: null,
        // kalau tidak ada planId, biarkan nextSendAt null biar send engine skip
        nextSendAt: st.planId ? nextSend : null,
      } as any,
    });

    resumed++;
  }

  return NextResponse.json({
    ok: true,
    resumed,
    checked: pausedStates.length,
    maxIdleHours,
    skippedPendingFU,
    skippedInboundRecent,
  });
}
