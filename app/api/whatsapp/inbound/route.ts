import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NurturingStatus } from "@prisma/client";
import { ensureWaClient, sendWaMessage } from "@/lib/whatsapp-service";
import { emitRealtime } from "@/lib/realtime";

const WEBHOOK_KEY = process.env.WA_WEBHOOK_KEY || "";

function normalizeWaNumber(raw?: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/@.*/, "");
}

// Render template {{nama_lead}}, {{nama_sales}}, {{perusahaan}}, dst.
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

function sanitizeLeadName(name?: string | null) {
  const s = String(name ?? "").trim();
  if (!s) return null;
  // optional: rapihin spasi & batasi panjang
  return s.replace(/\s+/g, " ").slice(0, 60);
}

const DEFAULT_WELCOME_TEMPLATE =
  "Halo kak, terima kasih sudah menghubungi {{perusahaan}}. Saya {{nama_sales}}. Ada yang bisa saya bantu terkait kebutuhan kakak?";

export async function POST(req: NextRequest) {
  if (WEBHOOK_KEY) {
    const headerKey = req.headers.get("x-wa-webhook-key");
    if (headerKey !== WEBHOOK_KEY) {
      return NextResponse.json(
        { ok: false, error: "invalid_webhook_key" },
        { status: 401 }
      );
    }
  }

  const payload = await req.json();
  const {
    userId,
    from,
    to,
    body,
    timestamp,
    waMessageId,
    waChatId,
    waDisplayName,
  } = payload;

  if (!userId || !from || !to || !body) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  const salesId = Number(userId);
  const fromNumber = normalizeWaNumber(from);
  const toNumber = normalizeWaNumber(to);

  if (!fromNumber || !toNumber) {
    return NextResponse.json(
      { ok: false, error: "invalid_numbers" },
      { status: 400 }
    );
  }

  try {
    // 1. cek apakah pengirim adalah sales lain (punya WA session) atau phone user
    const fromIsSalesSession = await prisma.whatsAppSession.findFirst({
      where: { phoneNumber: fromNumber },
    });

    const fromIsSalesUser = await prisma.user.findFirst({
      where: { phone: fromNumber },
      select: { id: true },
    });

    if (fromIsSalesSession || fromIsSalesUser) {
      console.log(
        "[inbound] message from another sales, skip auto lead",
        fromNumber
      );
      return NextResponse.json({ ok: true, skipped: "from_is_sales" });
    }

    // 2. pastikan sales pemilik client ada (include WA session)
    const sales = await prisma.user.findUnique({
      where: { id: salesId },
      include: {
        whatsappSession: true,
      },
    });

    if (!sales) {
      console.warn("[inbound] sales not found:", salesId);
      return NextResponse.json(
        { ok: false, error: "sales_not_found" },
        { status: 404 }
      );
    }

    // default Tahap: Kontak Awal
    const defaultStage = await prisma.leadStage.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "KONTAK_AWAL" }, { name: { equals: "Kontak Awal" } }],
      },
      orderBy: { order: "asc" },
    });

    // default Status: New
    const defaultStatus = await prisma.leadStatus.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "NEW" }, { name: { equals: "Baru" } }],
      },
      orderBy: { order: "asc" },
    });

    // optional: cari status Warm (kalau mau auto naikkan status)
    const warmStatus = await prisma.leadStatus.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "WARM" }, { name: { equals: "Warm" } }],
      },
    });

    // 3. cari lead berdasarkan nomor pengirim + sales
    let lead = await prisma.lead.findFirst({
      where: {
        phone: fromNumber,
        salesId: sales.id,
      },
    });

    const now = new Date();
    let isNewLead = false;

    // 4. kalau belum ada, buat lead baru dari WA (nurturing langsung PAUSED)
    if (!lead) {
      const waSource = await prisma.leadSource.findFirst({
        where: { code: "WHATSAPP" },
      });

      const waName = sanitizeLeadName(waDisplayName);

      const created = await prisma.$transaction(async (tx) => {
        const newLead = await tx.lead.create({
          data: {
            name: waName ?? `Lead WhatsApp ${fromNumber}`,
            phone: fromNumber,
            stageId: defaultStage?.id ?? null,
            statusId: defaultStatus?.id ?? null,
            salesId: sales.id,
            sourceId: waSource?.id ?? null,

            nurturingStatus: NurturingStatus.PAUSED,
            nurturingCurrentStep: null,
            nurturingLastSentAt: null,
            nurturingStartedAt: null,
            nurturingPausedAt: now,
          },
        });

        // stage history (awal)
        if (defaultStage?.id) {
          await tx.leadStageHistory.create({
            data: {
              leadId: newLead.id,
              stageId: defaultStage.id,
              changedById: sales.id, // inbound masuk ke WA sales ini
              salesId: sales.id,
              note: "Auto set stage dari inbound WhatsApp",
              mode: "NORMAL",
              doneAt: null, // belum selesai, baru mulai
            },
          });
        }

        // status history (awal)
        if (defaultStatus?.id) {
          await tx.leadStatusHistory.create({
            data: {
              leadId: newLead.id,
              statusId: defaultStatus.id,
              changedById: sales.id,
              salesId: sales.id,
              note: "Auto set status dari inbound WhatsApp",
            },
          });
        }

        return newLead;
      });

      lead = created;
      isNewLead = true;

      console.log("[inbound] lead created from WA:", lead.id, fromNumber);
    }

    if (!lead) {
      // antisipasi saja, mestinya tidak mungkin masuk sini
      return NextResponse.json(
        { ok: false, error: "lead_not_found" },
        { status: 500 }
      );
    }

    // 5. simpan ke LeadMessage (INBOUND)
    const sentAt =
      timestamp != null ? new Date(Number(timestamp) * 1000) : new Date();

    const inboundMsg = await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        salesId: sales.id,
        channel: "WHATSAPP",
        direction: "INBOUND",
        waMessageId: waMessageId || null,
        waChatId: waChatId || null,
        fromNumber,
        toNumber,
        content: body,
        sentAt,
      },
      select: {
        id: true,
        leadId: true,
        waMessageId: true,
        createdAt: true,
        sentAt: true,
      },
    });

    await emitRealtime({
      room: `lead:${lead.id}`,
      event: "wa_inbound",
      payload: {
        leadId: lead.id,
        messageId: inboundMsg.id,
        waMessageId: inboundMsg.waMessageId,
        at: (inboundMsg.sentAt ?? inboundMsg.createdAt).toISOString(),
      },
    });

    // notif
    await emitRealtime({
      room: `user:${sales.id}`,
      event: "wa_notify",
      payload: {
        leadId: lead.id,
        leadName: lead.name,
        message: body,
        from: fromNumber,
        at: sentAt.toISOString(),
      },
    });

    // 6. Treat inbound as engagement → auto naikkan status & PAUSE nurturing
    try {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          // kalau sebelumnya NEW/COLD dan ada status Warm, naikkan jadi Warm
          // statusId: warmStatus?.id ?? lead.statusId,
          // setiap ada engagement, nurturing di-pause dan baseline idle digeser ke sekarang
          nurturingStatus: NurturingStatus.PAUSED,
          nurturingPausedAt: now,
        },
      });
    } catch (e) {
      console.warn("[inbound] gagal update status/nurturing lead:", e);
    }

    // 7. Jika ini lead baru → kirim pesan sambutan WA (kalau diaktifkan)
    if (isNewLead) {
      try {
        const general = await prisma.generalSetting.findFirst({
          where: { id: 1 },
        });

        const welcomeEnabled = general?.welcomeMessageEnabled ?? true;

        if (welcomeEnabled) {
          const perusahaanName = general?.companyName || "Perusahaan Kami";
          const templateRaw =
            general?.welcomeMessageTemplate || DEFAULT_WELCOME_TEMPLATE;

          const messageText = renderTemplate(templateRaw, {
            // nama_lead: lead.name,
            nama_sales: sales.name,
            perusahaan: perusahaanName,
          });

          if (messageText) {
            // pastikan WA client untuk sales ini aktif
            await ensureWaClient(sales.id);

            const result = await sendWaMessage({
              userId: sales.id,
              to: fromNumber,
              body: messageText,
              meta: {
                kind: "WELCOME_WHATSAPP",
                leadId: lead.id,
              },
            });

            const waOutId = result.waMessageId ?? null;
            // @ts-ignore tergantung return WA service kamu
            const waOutChatId = result.meta?.chatId ?? null;
            const fromNumberSales = sales.whatsappSession?.phoneNumber ?? null;

            const outMsg = await prisma.leadMessage.create({
              data: {
                leadId: lead.id,
                salesId: sales.id,
                channel: "WHATSAPP",
                direction: "OUTBOUND",
                waMessageId: waOutId,
                waChatId: waOutChatId,
                fromNumber: fromNumberSales,
                toNumber: fromNumber,
                content: messageText,
                sentAt: new Date(),
                waStatus: "PENDING", // (kalau di schema default sudah PENDING, ini opsional)
              },
              select: {
                id: true,
                leadId: true,
                waMessageId: true,
                createdAt: true,
              },
            });

            await emitRealtime({
              room: `lead:${lead.id}`,
              event: "wa_outbound_created",
              payload: {
                leadId: lead.id,
                messageId: outMsg.id,
                waMessageId: outMsg.waMessageId,
                at: outMsg.createdAt.toISOString(),
              },
            });

            // notif
            // await emitRealtime({
            //   room: `user:${sales.id}`,
            //   event: "wa_notify",
            //   payload: {
            //     leadId: lead.id,
            //     leadName: lead.name,
            //     message: body,
            //     from: fromNumber,
            //     at: sentAt.toISOString(),
            //   },
            // });
          }
        }
      } catch (e) {
        console.error("[inbound] gagal mengirim pesan sambutan WA:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inbound] error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
