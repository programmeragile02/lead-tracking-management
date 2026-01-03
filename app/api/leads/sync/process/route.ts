import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSingleLead } from "@/lib/sync-lead";
import { emitRealtime } from "@/lib/realtime";

const BATCH_SIZE = 5;

export async function POST(req: NextRequest) {
  const { jobId } = await req.json();

  while (true) {
    const job = await prisma.leadSyncJob.findUnique({
      where: { id: jobId },
      include: {
        items: {
          where: { status: "PENDING" },
          take: BATCH_SIZE,
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // ====== SELESAI ======
    if (job.items.length === 0) {
      const finished = await prisma.leadSyncJob.update({
        where: { id: jobId },
        data: {
          status: "DONE",
          finishedAt: new Date(),
        },
      });

      await emitRealtime({
        room: `user:${job.salesId}`,
        event: "sync:done",
        payload: {
          total: finished.totalLeads,
          success: finished.success,
          failed: finished.failed,
        },
      });

      break; // <- PENTING
    }

    // tandai running
    await prisma.leadSyncJob.update({
      where: { id: jobId },
      data: { status: "RUNNING" },
    });

    for (const item of job.items) {
      try {
        await syncSingleLead(item.leadId);

        const updated = await prisma.leadSyncJob.update({
          where: { id: jobId },
          data: {
            processed: { increment: 1 },
            success: { increment: 1 },
          },
        });

        await prisma.leadSyncItem.update({
          where: { id: item.id },
          data: { status: "SUCCESS", finishedAt: new Date() },
        });

        await emitRealtime({
          room: `user:${job.salesId}`,
          event: "sync:progress",
          payload: {
            processed: updated.processed,
            success: updated.success,
            failed: updated.failed,
          },
        });
      } catch (err: any) {
        const updated = await prisma.leadSyncJob.update({
          where: { id: jobId },
          data: {
            processed: { increment: 1 },
            failed: { increment: 1 },
          },
        });

        await prisma.leadSyncItem.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            message: err.message,
            finishedAt: new Date(),
          },
        });

        await emitRealtime({
          room: `user:${job.salesId}`,
          event: "sync:progress",
          payload: {
            processed: updated.processed,
            success: updated.success,
            failed: updated.failed,
          },
        });
      }
    }

    // OPTIONAL: biar server gak kepanasan
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ ok: true });
}
