import { prisma } from "@/lib/prisma";
import { sendWaMessage } from "@/lib/whatsapp-service";
import { emitRealtime } from "../realtime";
import { renderTemplate } from "../utils/render-template";

const SLEEP = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function startBlastWorker() {
  console.log("[BLAST] Worker started");

  while (true) {
    try {
      await processOneJob();
    } catch (err) {
      console.error("[BLAST] fatal error", err);
    }

    await SLEEP(2000);
  }
}

async function processOneJob() {
  // 1️ ambil job dan lock
  const job = await prisma.$transaction(async (tx) => {
    const job = await tx.leadBlastJob.findFirst({
      where: { status: { in: ["PENDING", "RUNNING"] } },
      orderBy: { createdAt: "asc" },
    });

    if (!job) return null;

    if (job.status !== "RUNNING") {
      await tx.leadBlastJob.update({
        where: { id: job.id },
        data: { status: "RUNNING", startedAt: new Date() },
      });
    }

    return job;
  });

  if (!job) return;

  // 2️ ambil satu item
  const item = await prisma.leadBlastItem.findFirst({
    where: {
      jobId: job.id,
      status: "PENDING",
    },
    include: {
      lead: {
        include: {
          sales: true,
          product: true,
        },
      },
    },
  });

  if (!item) {
    await prisma.leadBlastJob.update({
      where: { id: job.id },
      data: { status: "DONE", finishedAt: new Date() },
    });
    return;
  }

  const companySetting = await prisma.generalSetting.findFirst();

  const messageText = renderTemplate(job.message, {
    nama_lead: item.lead.name,
    produk: item.lead.product?.name ?? "",
    sales: item.lead.sales?.name ?? "",
    perusahaan: companySetting?.companyName ?? "",
  });

  // 3️ buat message record
  const message = await prisma.leadMessage.create({
    data: {
      leadId: item.leadId,
      salesId: item.lead.salesId,
      sentById: job.createdById,
      channel: "WHATSAPP",
      direction: "OUTBOUND",
      content: messageText,
      waStatus: "PENDING",
    },
  });

  // update lastmessage
  await prisma.lead.update({
    where: { id: item.leadId },
    data: {
      lastMessageAt: new Date(),
      lastOutboundAt: new Date(),
    },
  });

  // realtime optimistic update
  await emitRealtime({
    room: `lead:${item.leadId}`,
    event: "wa_outbound_created",
    payload: {
      leadId: item.leadId,
      message: message,
    },
  });

  try {
    // 4️ kirim WA
    const result = await sendWaMessage({
      userId: item.lead.salesId!,
      to: item.lead.phone!,
      body: messageText,
    });

    // 5️ update sukses
    await prisma.$transaction([
      prisma.leadMessage.update({
        where: { id: message.id },
        data: {
          waMessageId: result.waMessageId,
          waStatus: "SENT",
        },
      }),
      prisma.leadBlastItem.update({
        where: { id: item.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          leadMessageId: message.id,
        },
      }),
      prisma.leadBlastJob.update({
        where: { id: job.id },
        data: { success: { increment: 1 } },
      }),
    ]);
  } catch (err) {
    await prisma.$transaction([
      prisma.leadMessage.update({
        where: { id: message.id },
        data: { waStatus: "FAILED" },
      }),
      prisma.leadBlastItem.update({
        where: { id: item.id },
        data: { status: "FAILED", error: String(err) },
      }),
      prisma.leadBlastJob.update({
        where: { id: job.id },
        data: { failed: { increment: 1 } },
      }),
    ]);
  }
}

// ===== RUN WORKER =====
console.log("[BLAST] Worker booting...");
startBlastWorker();
