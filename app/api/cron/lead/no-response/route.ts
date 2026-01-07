import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // ====== AUTH CRON ======
    const cronKey = req.headers.get("x-cron-key");
    if (!cronKey || cronKey !== process.env.NURTURING_CRON_KEY) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized cron" },
        { status: 401 }
      );
    }

    // ====== LOAD SETTING ======
    const setting = await prisma.generalSetting.findUnique({
      where: { id: 1 },
    });

    const noResponseAfterHours =
      setting?.noResponseAfterHours && setting.noResponseAfterHours > 0
        ? setting.noResponseAfterHours
        : 24;

    const threshold = new Date(
      Date.now() - noResponseAfterHours * 60 * 60 * 1000
    );

    // ====== LOAD SUB STATUS ======
    const noResponseSubStatus = await prisma.leadSubStatus.findFirst({
      where: {
        code: "NO_RESPON",
        isActive: true,
      },
    });

    if (!noResponseSubStatus) {
      return NextResponse.json({
        ok: false,
        message: "Sub status NO_RESPON tidak ditemukan atau tidak aktif",
      });
    }

    console.log("NOW UTC:", new Date().toISOString());
    console.log("THRESHOLD:", threshold.toISOString());

    // ====== FIND LEADS ======
    const leads = await prisma.lead.findMany({
      where: {
        isExcluded: false,

        // sales pernah kirim pesan
        lastOutboundAt: { lte: threshold },

        // tidak ada balasan setelah outbound terakhir
        OR: [
          { lastInboundAt: null },
          {
            lastInboundAt: {
              lt: prisma.lead.fields.lastOutboundAt,
            },
          },
        ],

        // belum NO_RESPON
        subStatusId: {
          not: noResponseSubStatus.id,
        },
      },
      select: {
        id: true,
        salesId: true,
        subStatusId: true,
      },
    });

    let updated = 0;

    // ====== UPDATE + HISTORY ======
    for (const lead of leads) {
      await prisma.$transaction([
        prisma.lead.update({
          where: { id: lead.id },
          data: {
            subStatusId: noResponseSubStatus.id,
          },
        }),
        prisma.leadSubStatusHistory.create({
          data: {
            leadId: lead.id,
            subStatusId: noResponseSubStatus.id,
            salesId: lead.salesId,
            note: `Auto NO_RESPON setelah ${noResponseAfterHours} jam tanpa balasan`,
          },
        }),
      ]);

      updated++;
    }

    return NextResponse.json({
      ok: true,
      checked: leads.length,
      updated,
      noResponseAfterHours,
      threshold,
    });
  } catch (err) {
    console.error("CRON no-response error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menjalankan cron no response" },
      { status: 500 }
    );
  }
}
