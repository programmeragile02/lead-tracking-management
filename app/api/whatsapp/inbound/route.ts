import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NurturingStatus } from "@prisma/client";
import { ensureWaClient, sendWaMessage } from "@/lib/whatsapp-service";
import { emitRealtime } from "@/lib/realtime";
import {
  pickPlanForLead,
  getFirstStepDelayHours,
} from "@/lib/nurturing-assign";

const WEBHOOK_KEY = process.env.WA_WEBHOOK_KEY || "";

function normalizeWaNumber(raw?: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/@.*/, "");
}

function extractPhoneFromWaChatId(waChatId?: string | null): string | null {
  if (!waChatId) return null;

  const m = waChatId.match(/^(\d{8,15})@c\.us$/);
  return m ? m[1] : null;
}

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
    waPhone,
    waDisplayName,
  } = payload;

  if (!userId || !from || !to || !body) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  const salesId = Number(userId);
  const fromWaChatId = waChatId || from; // JID utama
  const fromPhone = waPhone || extractPhoneFromWaChatId(fromWaChatId);

  const toPhone = typeof to === "string" ? extractPhoneFromWaChatId(to) : null;

  try {
    // 1) skip kalau pengirim ternyata sales lain
    const fromIsSalesSession = await prisma.whatsAppSession.findFirst({
      where: {
        OR: [
          { waUserJid: fromWaChatId },
          ...(fromPhone ? [{ phoneNumber: fromPhone }] : []),
        ],
      },
    });

    const fromIsSalesUser = fromPhone
      ? await prisma.user.findFirst({
          where: { phone: fromPhone },
          select: { id: true },
        })
      : null;

    if (fromIsSalesSession || fromIsSalesUser) {
      console.log(
        "[inbound] message from another sales, skip auto lead",
        fromPhone
      );
      return NextResponse.json({ ok: true, skipped: "from_is_sales" });
    }

    // SKIP JIKA NOMOR MASUK PENGECUALIAN KONTAK SALES
    if (fromPhone) {
      const excluded = await prisma.salesExcludedContact.findFirst({
        where: {
          salesId,
          phone: fromPhone,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (excluded) {
        console.log(
          "[inbound] excluded contact, skip inbound:",
          fromPhone,
          excluded.name
        );

        return NextResponse.json({
          ok: true,
          skipped: "excluded_contact",
        });
      }
    }

    // 2) pastikan sales pemilik client ada
    const sales = await prisma.user.findUnique({
      where: { id: salesId },
      include: { whatsappSession: true },
    });

    if (!sales) {
      console.warn("[inbound] sales not found:", salesId);
      return NextResponse.json(
        { ok: false, error: "sales_not_found" },
        { status: 404 }
      );
    }

    const defaultStage = await prisma.leadStage.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "KONTAK_AWAL" }, { name: { equals: "Kontak Awal" } }],
      },
      orderBy: { order: "asc" },
    });

    const defaultStatus = await prisma.leadStatus.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "NEW" }, { name: { equals: "Baru" } }],
      },
      orderBy: { order: "asc" },
    });

    // 3) CARI LEAD (PRIORITAS PHONE → FALLBACK waChatId)
    let lead = null;

    // 3.1) PRIORITAS: PHONE NUMBER
    if (fromPhone) {
      lead = await prisma.lead.findFirst({
        where: {
          salesId: sales.id,
          phone: fromPhone,
        },
      });
    }

    // 3.2) FALLBACK: waChatId
    if (!lead) {
      lead = await prisma.lead.findFirst({
        where: {
          salesId: sales.id,
          messages: {
            some: {
              waChatId: fromWaChatId,
            },
          },
        },
      });
    }

    // UPGRADE LEAD LAMA (dari @lid → nomor asli)
    if (lead && !lead.phone && fromPhone) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { phone: fromPhone },
      });
    }

    const now = new Date();
    let isNewLead = false;

    // 4) kalau belum ada, buat lead baru dari WA
    if (!lead) {
      const waSource = await prisma.leadSource.findFirst({
        where: { code: "WHATSAPP" },
      });
      const waName = sanitizeLeadName(waDisplayName);

      const created = await prisma.$transaction(async (tx) => {
        const newLead = await tx.lead.create({
          data: {
            name: waName ?? "Lead WhatsApp",
            phone: fromPhone, // bisa null
            salesId: sales.id,
            stageId: defaultStage?.id ?? null,
            statusId: defaultStatus?.id ?? null,
            sourceId: waSource?.id ?? null,
          },
        });

        // state default: PAUSED (karena inbound = engagement)
        await tx.leadNurturingState.create({
          data: {
            leadId: newLead.id,
            status: NurturingStatus.PAUSED,
            manualPaused: false,
            pauseReason: "INBOUND_RECENT",
            pausedAt: now,
            currentStep: 0,
            nextSendAt: null,
            startedAt: now,
            lastSentAt: null,
            lastMessageKey: null,
          } as any,
        });

        // assign plan default (product null) jika ada
        const plan = await pickPlanForLead({
          productId: null,
          sourceId: waSource?.id ?? null,
          statusCode: defaultStatus?.code ?? null,
        });

        if (plan) {
          const delay = await getFirstStepDelayHours(plan.id);
          await tx.leadNurturingState.update({
            where: { leadId: newLead.id },
            data: {
              planId: plan.id,
              nextSendAt: new Date(now.getTime() + delay * 60 * 60 * 1000),
            } as any,
          });
        }

        // stage history (awal)
        if (defaultStage?.id) {
          await tx.leadStageHistory.create({
            data: {
              leadId: newLead.id,
              stageId: defaultStage.id,
              changedById: sales.id,
              salesId: sales.id,
              note: "Auto set stage dari inbound WhatsApp",
              mode: "NORMAL",
              doneAt: null,
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
      console.log("[inbound] lead created from WA:", lead.id, fromPhone);
    }

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "lead_not_found" },
        { status: 500 }
      );
    }

    // 5) simpan inbound message
    const sentAt =
      timestamp != null ? new Date(Number(timestamp) * 1000) : new Date();

    // const inboundMsg = await prisma.leadMessage.create({
    //   data: {
    //     leadId: lead.id,
    //     salesId: sales.id,
    //     channel: "WHATSAPP",
    //     direction: "INBOUND",
    //     waMessageId: waMessageId || null,
    //     waChatId: waChatId || null,
    //     fromNumber,
    //     toNumber,
    //     content: body,
    //     sentAt,
    //   },
    //   select: {
    //     id: true,
    //     leadId: true,
    //     waMessageId: true,
    //     createdAt: true,
    //     sentAt: true,
    //   },
    // });
    const inboundMsg = await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        salesId: sales.id,
        channel: "WHATSAPP",
        direction: "INBOUND",
        waMessageId: waMessageId || null,
        waChatId: fromWaChatId,
        fromNumber: fromPhone,
        toNumber: toPhone,
        content: body,
        sentAt,
      },
    });

    if (!lead.phone && fromPhone) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { phone: fromPhone },
      });
    }

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

    await emitRealtime({
      room: `user:${sales.id}`,
      event: "wa_notify",
      payload: {
        leadId: lead.id,
        leadName: lead.name,
        message: body,
        from: fromPhone,
        at: sentAt.toISOString(),
      },
    });

    await emitRealtime({
      room: `user:${sales.id}`,
      event: "lead_list_changed",
      payload: {
        leadId: lead.id,
        isNew: isNewLead,
        from: fromPhone,
        at: new Date().toISOString(),
      },
    });

    // 6) inbound = engagement → PAUSE nurturing (update state, bukan Lead)
    await prisma.leadNurturingState.upsert({
      where: { leadId: lead.id },
      create: {
        leadId: lead.id,
        status: NurturingStatus.PAUSED,
        manualPaused: false,
        pauseReason: "INBOUND_RECENT",
        pausedAt: now,
        currentStep: 0,
        startedAt: now,
        nextSendAt: null,
      } as any,
      update: {
        status: NurturingStatus.PAUSED,
        manualPaused: false,
        pauseReason: "INBOUND_RECENT",
        pausedAt: now,
      } as any,
    });

    // 7) welcome message jika lead baru
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
            nama_sales: sales.name,
            perusahaan: perusahaanName,
          }).trim();

          if (messageText) {
            await ensureWaClient(sales.id);

            const result = await sendWaMessage({
              userId: sales.id,
              to: fromWaChatId,
              body: messageText,
              meta: { kind: "WELCOME_WHATSAPP", leadId: lead.id },
            });

            await prisma.leadMessage.create({
              data: {
                leadId: lead.id,
                salesId: sales.id,
                channel: "WHATSAPP",
                direction: "OUTBOUND",
                waChatId: fromWaChatId,
                fromNumber: sales.whatsappSession?.phoneNumber ?? null,
                toNumber: fromPhone,
                content: messageText,
                sentAt: new Date(),
                waStatus: "SENT",
              },
            });
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
