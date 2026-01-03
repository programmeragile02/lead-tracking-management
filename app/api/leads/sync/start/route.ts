import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { emitRealtime } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ambil semua lead milik sales
  const leads = await prisma.lead.findMany({
    where: { salesId: user.id, isExcluded: false },
    select: { id: true },
  });

  if (leads.length === 0) {
    return NextResponse.json({ error: "Tidak ada lead" }, { status: 400 });
  }

  // Buat job
  const job = await prisma.leadSyncJob.create({
    data: {
      salesId: user.id,
      totalLeads: leads.length,
      status: "PENDING",
      items: {
        create: leads.map((l) => ({
          leadId: l.id,
          status: "PENDING",
        })),
      },
    },
  });

  await emitRealtime({
    room: `user:${user.id}`,
    event: "sync:start",
    payload: {
      jobId: job.id,
      total: job.totalLeads,
    },
  });

  return NextResponse.json({
    ok: true,
    jobId: job.id,
    total: leads.length,
  });
}
