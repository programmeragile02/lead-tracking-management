import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const jobId = Number(req.nextUrl.searchParams.get("jobId"));

  const job = await prisma.leadSyncJob.findUnique({
    where: { id: jobId },
    include: {
      items: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    total: job.totalLeads,
    processed: job.processed,
    success: job.success,
    failed: job.failed,
  });
}
