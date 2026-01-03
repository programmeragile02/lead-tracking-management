import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const jobId = Number(id);

  if (!jobId) {
    return NextResponse.json(
      { ok: false, error: "Invalid job id" },
      { status: 400 }
    );
  }

  const job = await prisma.leadBlastJob.findUnique({
    where: { id: jobId },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json(
      { ok: false, error: "Job not found" },
      { status: 404 }
    );
  }

  const sent = await prisma.leadBlastItem.count({
    where: { jobId, status: "SENT" },
  });

  const failed = await prisma.leadBlastItem.count({
    where: { jobId, status: "FAILED" },
  });

  return NextResponse.json({
    ok: true,
    job: {
      id: job.id,
      status: job.status,
      total: job.total,
      sent,
      failed,
      progress: job.total ? Math.round(((sent + failed) / job.total) * 100) : 0,
    },
  });
}
