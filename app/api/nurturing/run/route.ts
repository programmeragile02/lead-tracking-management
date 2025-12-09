import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  LeadMessageChannel,
  LeadMessageType,
  MessageDirection,
  FollowUpChannel,
  NurturingStatus,
} from "@prisma/client";
import { ensureWaClient, sendWaMessage } from "@/lib/whatsapp-service";

// security key untuk cron
const NURTURING_CRON_KEY = process.env.NURTURING_CRON_KEY || "";

// Render template: {{nama_lead}}, {{nama_sales}}, {{produk}}, {{brand}}, dst.
function renderTemplate(
  template: string | null | undefined,
  vars: Record<string, string | null | undefined>
): string {
  if (!template) return "";
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const v = vars[key.trim()];
    return (v ?? "").toString();
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // pakai key supaya hanya cron yang boleh panggil
    if (NURTURING_CRON_KEY) {
      const key =
        req.headers.get("x-nurturing-key") ||
        new URL(req.url).searchParams.get("key");
      if (key !== NURTURING_CRON_KEY) {
        return NextResponse.json(
          { ok: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const now = new Date();

    // -------------------------------------------------------------
    // 0. Baca GeneralSetting (aktif/tidak & jam idle)
    // -------------------------------------------------------------
    const general = await prisma.generalSetting.findFirst({ where: { id: 1 } });
    const autoNurturingEnabled = general?.autoNurturingEnabled ?? true;
    const perusahaanName = general?.companyName ?? "Perusahaan Kami";
    const maxIdleHours =
      general?.maxIdleHoursBeforeResume != null
        ? general.maxIdleHoursBeforeResume
        : 48;

    if (!autoNurturingEnabled) {
      return NextResponse.json({
        ok: true,
        message: "Auto nurturing sedang dinonaktifkan di pengaturan.",
      });
    }

    // -------------------------------------------------------------
    // A. RESUME nurturing untuk lead yg PAUSED
    //    Logika: kalau sales sudah DIAM >= maxIdleHours
    //    (diukur dari follow up manual, WA OUTBOUND, atau waktu dipause)
    // -------------------------------------------------------------
    const pausedLeads = await prisma.lead.findMany({
      where: {
        nurturingStatus: NurturingStatus.PAUSED,
      },
      include: {
        followUps: {
          where: {
            isAutoNurturing: false, // follow up manual
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        messages: {
          where: {
            direction: MessageDirection.OUTBOUND, // pesan WA keluar dari sales
          },
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
      take: 200,
    });

    for (const lead of pausedLeads) {
      const lastManualFU = lead.followUps[0]?.createdAt ?? null;
      const lastManualMsg = lead.messages[0]?.sentAt ?? null;
      const pauseTime = lead.nurturingPausedAt ?? null;

      // Ambil aktivitas TERAKHIR (FU manual / WA OUTBOUND)
      const lastSalesActivity =
        lastManualFU && lastManualMsg
          ? new Date(Math.max(lastManualFU.getTime(), lastManualMsg.getTime()))
          : lastManualFU || lastManualMsg;

      // baseline idle:
      //  - kalau ada aktivitas sales → pakai itu
      //  - kalau tidak ada aktivitas sales → pakai waktu dipause
      const baseline = lastSalesActivity || pauseTime;

      if (!baseline) {
        // ga ada baseline yang jelas → skip aja (mungkin data lama)
        continue;
      }

      const diffHours = (now.getTime() - baseline.getTime()) / (1000 * 60 * 60);

      if (diffHours >= maxIdleHours) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            nurturingStatus: NurturingStatus.ACTIVE,
            nurturingPausedAt: null,
          },
        });
      }
    }

    // -------------------------------------------------------------
    // B. Ambil semua jenis follow up nurturing (FO1, FO2, FO3, FO4, dsb)
    // -------------------------------------------------------------
    const nurturingTypes = await prisma.leadFollowUpType.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isNurturingStep: true,
      },
    });

    // Map utk lookup by order: 1 → FO1, 2 → FO2, dst.
    const typeByOrder = new Map<number, (typeof nurturingTypes)[number]>();
    for (const t of nurturingTypes) {
      if (t.nurturingOrder != null) {
        typeByOrder.set(t.nurturingOrder, t);
      }
    }

    if (typeByOrder.size === 0) {
      return NextResponse.json({
        ok: true,
        message: "Tidak ada konfigurasi nurturing di master tindak lanjut",
      });
    }

    // -------------------------------------------------------------
    // C. Ambil lead yang nurturing-nya ACTIVE & sudah pernah dikirimi step sebelumnya
    //    (nurturingCurrentStep != null, misal 1 = FO1 sudah jalan)
    // -------------------------------------------------------------
    const leads = await prisma.lead.findMany({
      where: {
        nurturingStatus: NurturingStatus.ACTIVE,
        nurturingCurrentStep: {
          not: null,
        },
        nurturingLastSentAt: {
          not: null,
        },
        // skip yg sudah closing (jaga-jaga, walau status change sudah STOP nurturing)
        NOT: {
          status: {
            code: { in: ["HOT", "CLOSE_WON", "CLOSE_LOST"] },
          },
        },
      },
      include: {
        sales: {
          include: {
            whatsappSession: true,
          },
        },
        product: true,
        status: true,
      },
      // batasi dulu misal 50 per run supaya ringan
      take: 50,
    });

    let processed = 0;
    let sentCount = 0;
    const errors: any[] = [];

    // -------------------------------------------------------------
    // D. Loop tiap lead ACTIVE utk kirim step berikutnya (FO2/FO3/FO4)
    // -------------------------------------------------------------
    for (const lead of leads) {
      processed++;

      const currentStep = lead.nurturingCurrentStep ?? 0;
      const lastSentAt = lead.nurturingLastSentAt;
      if (!lastSentAt) continue;

      const nextStepOrder = currentStep + 1;
      const stepType = typeByOrder.get(nextStepOrder);
      if (!stepType) {
        // tidak ada step berikutnya → boleh diabaikan / nanti di-STOP di update
        continue;
      }

      const delayHours = stepType.autoDelayHours ?? 0;
      const diffMs = now.getTime() - lastSentAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // 1) Cek apakah sudah lewat delay yang ditentukan
      if (diffHours < delayHours) {
        // belum waktunya FO2/FO3/FO4
        continue;
      }

      // 2) Cek apakah ada engagement setelah FO terakhir:
      //    - chat WA INBOUND
      //    - follow up manual (isAutoNurturing = false)
      const [inboundCount, manualFollowUpCount] = await Promise.all([
        prisma.leadMessage.count({
          where: {
            leadId: lead.id,
            direction: MessageDirection.INBOUND,
            sentAt: {
              gt: lastSentAt,
            },
          },
        }),
        prisma.leadFollowUp.count({
          where: {
            leadId: lead.id,
            isAutoNurturing: false,
            createdAt: {
              gt: lastSentAt,
            },
          },
        }),
      ]);

      const hasEngagement = inboundCount > 0 || manualFollowUpCount > 0;

      if (hasEngagement) {
        // Ada aktivitas → sesuai rule: nurturing PAUSED
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            nurturingStatus: NurturingStatus.PAUSED,
            nurturingPausedAt: now,
          },
        });
        continue;
      }

      // 3) Kirim pesan nurturing step berikutnya (FO2 / FO3 / FO4 ...)
      if (!lead.phone) {
        errors.push({
          leadId: lead.id,
          reason: "Lead tidak punya nomor telepon",
        });
        continue;
      }

      if (!lead.salesId) {
        errors.push({
          leadId: lead.id,
          reason: "Lead tidak punya salesId",
        });
        continue;
      }

      const waUserId = lead.salesId;

      const messageContent = renderTemplate(stepType.waTemplateBody, {
        nama_lead: lead.name,
        nama_sales: lead.sales?.name,
        produk: lead.product?.name,
        perusahaan: perusahaanName,
        video_demo_link: lead.product?.videoDemoUrl ?? "",
        testimoni_links: lead.product?.testimonialUrl ?? "",
        edukasi_link:
          lead.product?.educationLinkUrl ?? lead.product?.educationPdfUrl ?? "",
      });

      if (!messageContent) {
        errors.push({
          leadId: lead.id,
          reason: `Template kosong untuk step nurturing order=${nextStepOrder}`,
        });
        continue;
      }

      let waMessageId: string | null = null;
      let waChatId: string | null = null;
      let fromNumber: string | null = null;

      try {
        // pastikan WA client aktif
        await ensureWaClient(waUserId);

        const result = await sendWaMessage({
          userId: waUserId,
          to: lead.phone,
          body: messageContent,
          meta: {
            leadId: lead.id,
            followUpTypeCode: stepType.code,
            kind: "NURTURING_STEP",
            stepOrder: nextStepOrder,
          },
        });

        waMessageId = result.waMessageId ?? null;
        // @ts-ignore – tergantung response WA service kamu
        waChatId = result.meta?.chatId ?? null;
        fromNumber = lead.sales?.whatsappSession?.phoneNumber ?? null;
        sentCount++;
      } catch (e) {
        console.error(
          `[NURTURING] gagal kirim WA step ${nextStepOrder} untuk lead ${lead.id}:`,
          e
        );
        errors.push({
          leadId: lead.id,
          reason: "Gagal kirim WA",
        });
      }

      const nowStep = new Date();

      // 4) Catat ke LeadFollowUp (auto nurturing)
      await prisma.leadFollowUp.create({
        data: {
          leadId: lead.id,
          salesId: lead.salesId,
          typeId: stepType.id,
          note: "Pesan Otomatis",
          channel: FollowUpChannel.WHATSAPP,
          doneAt: nowStep,
          isAutoNurturing: true,
        },
      });

      // 5) Catat ke LeadMessage (OUTBOUND)
      await prisma.leadMessage.create({
        data: {
          leadId: lead.id,
          salesId: lead.salesId,
          channel: LeadMessageChannel.WHATSAPP,
          direction: MessageDirection.OUTBOUND,
          content: messageContent,
          type: LeadMessageType.TEXT,
          sentAt: nowStep,
          fromNumber,
          toNumber: lead.phone,
          waMessageId,
          waChatId,
        },
      });

      // 6) Update state nurturing lead
      const hasNext = typeByOrder.has(nextStepOrder + 1);

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          nurturingCurrentStep: nextStepOrder,
          nurturingLastSentAt: nowStep,
          nurturingStatus: hasNext
            ? NurturingStatus.ACTIVE
            : NurturingStatus.STOPPED,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      processed,
      sentCount,
      errors,
    });
  } catch (err) {
    console.error("[NURTURING RUN] error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menjalankan nurturing" },
      { status: 500 }
    );
  }
}
