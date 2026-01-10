import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NurturingStatus } from "@prisma/client";
import { ensureWaClient, sendWaMessage } from "@/lib/whatsapp-service";
import { emitRealtime } from "@/lib/realtime";
import {
  pickPlanForLead,
  getFirstStepDelayHours,
} from "@/lib/nurturing-assign";
import { createAutoFollowUps } from "@/lib/auto-followup";

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

const OPT_OUT_KEYWORDS = [
  "nonaktif",
  "stop",
  "unsubscribe",
  "jangan kirim",
  "tidak mau",
  "hapus saya",
];

function isOptOutMessage(text: string) {
  const t = text.toLowerCase().trim();
  return OPT_OUT_KEYWORDS.some((k) => t.includes(k));
}

export async function POST(req: NextRequest) {
  // Security
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

  // validasi field
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

  // dedup di awal
  if (waMessageId) {
    const exists = await prisma.leadMessage.findUnique({
      where: { waMessageId },
      select: { id: true },
    });

    if (exists) {
      console.log("[inbound] duplicate waMessageId → safe skip", waMessageId);
      return NextResponse.json({ ok: true, duplicated: true });
    }
  }

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

    // default tahapan dan status
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
          isExcluded: false,
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
          isExcluded: false,
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

    /*
     * Read plan dan delay hours nurturing diluar transaction biar tidak timeout
     */
    let plan: Awaited<ReturnType<typeof pickPlanForLead>> | null = null;
    let delayHours: number | null = null;

    // 4) kalau belum ada, buat lead baru dari WA
    if (!lead) {
      const waSource = await prisma.leadSource.findFirst({
        where: { code: "WHATSAPP" },
      });

      plan = await pickPlanForLead({
        productId: null,
        sourceId: waSource?.id ?? null,
        statusCode: defaultStatus?.code ?? null,
      });

      if (plan) {
        delayHours = await getFirstStepDelayHours(plan.id);
      }

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

        // create auto follow up
        const autoFUCreated = await createAutoFollowUps({
          tx,
          leadId: newLead.id,
          salesId: sales.id,
          startAt: newLead.createdAt,
        });

        if (autoFUCreated) {
          await tx.leadActivity.create({
            data: {
              leadId: newLead.id,
              title: "Auto Follow Up dibuat",
              description:
                "FU1 (+1 hari), FU2 (+3 hari dari FU1), FU3 (+6 hari dari FU2)",
              happenedAt: new Date(),
              createdById: sales.id,
            },
          });
        }

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
        if (plan && delayHours != null) {
          await tx.leadNurturingState.update({
            where: { leadId: newLead.id },
            data: {
              planId: plan.id,
              nextSendAt: new Date(now.getTime() + delayHours * 60 * 60 * 1000),
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
      console.log("================================");
      console.log("[inbound] lead created from WA");
      console.log("[inbound] lead id:", lead.id);
      console.log("[inbound] no whatsapp:", fromPhone);
      console.log("[inbound] sales id:", sales.id);
      console.log("================================");
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

    let inboundMsg = null;
    let didSendOptOutConfirm = false;

    try {
      inboundMsg = await prisma.leadMessage.create({
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
    } catch (e: any) {
      if (e.code !== "P2002") throw e;
    }

    // ===============================
    // CEK OPT-OUT NURTURING (BERBASIS FLAG)
    // ===============================
    if (isOptOutMessage(body)) {
      // cari pesan nurturing terakhir
      const lastNurturingMsg = await prisma.leadMessage.findFirst({
        where: {
          leadId: lead.id,
          direction: "OUTBOUND",
          channel: "WHATSAPP",
          isNurturingMessage: true, // KUNCI UTAMA
        },
        orderBy: { createdAt: "desc" },
      });

      const nurturingState = await prisma.leadNurturingState.findUnique({
        where: { leadId: lead.id },
      });

      const OPT_OUT_WINDOW_HOURS = 24;

      const withinWindow =
        inboundMsg &&
        lastNurturingMsg &&
        inboundMsg.createdAt > lastNurturingMsg.createdAt &&
        inboundMsg.createdAt.getTime() - lastNurturingMsg.createdAt.getTime() <=
          OPT_OUT_WINDOW_HOURS * 60 * 60 * 1000;

      if (
        nurturingState?.status === NurturingStatus.ACTIVE &&
        lastNurturingMsg &&
        withinWindow
      ) {
        const now = new Date();

        // 1️ STOP nurturing permanen
        await prisma.leadNurturingState.update({
          where: { leadId: lead.id },
          data: {
            status: NurturingStatus.STOPPED,
            manualPaused: true,
            pauseReason: "MANUAL_TOGGLE",
            pausedAt: now,
            nextSendAt: null,
          },
        });

        // 2️ SIMPAN HISTORY (TABEL KHUSUS)
        await prisma.leadNurturingOptOut.create({
          data: {
            leadId: lead.id,
            salesId: sales.id,
            phone: fromPhone,
            message: body,
            channel: "WHATSAPP",
          },
        });

        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            title: "Nurturing dinonaktifkan oleh lead",
            description: [
              "Lead membalas pesan nurturing dengan permintaan berhenti.",
              "",
              `Pesan lead:`,
              `"${body}"`,
              "",
              `Channel: WhatsApp`,
              `Sales: ${sales.name}`,
            ].join("\n"),
            happenedAt: new Date(),
            createdById: sales.id,
          },
        });

        // ===============================
        // KIRIM PESAN KONFIRMASI OPT-OUT
        // ===============================
        let confirmMsg = null;

        try {
          await ensureWaClient(sales.id);

          const text =
            "Baik kak, kami tidak akan mengirimkan pesan lanjutan. Terima kasih 🙏";

          const sendRes = await sendWaMessage({
            userId: sales.id,
            to: fromWaChatId,
            body: text,
            meta: {
              kind: "NURTURING_OPT_OUT_CONFIRM",
              leadId: lead.id,
            },
          });

          // SIMPAN KE LEAD MESSAGE
          confirmMsg = await prisma.leadMessage.create({
            data: {
              leadId: lead.id,
              salesId: sales.id,
              channel: "WHATSAPP",
              direction: "OUTBOUND",
              content: text,
              waMessageId: sendRes?.waMessageId ?? null,
              waChatId: fromWaChatId,
              fromNumber: sales.whatsappSession?.phoneNumber ?? null,
              toNumber: fromPhone,
              sentAt: new Date(),
              waStatus: "SENT",
              isNurturingMessage: false,
              type: "TEXT",
            },
          });
        } catch (e) {
          console.warn("Gagal kirim konfirmasi opt-out:", e);
        }

        if (confirmMsg) {
          didSendOptOutConfirm = true;

          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              lastOutboundAt: confirmMsg.sentAt ?? new Date(),
              lastMessageAt: confirmMsg.sentAt ?? new Date(),
            },
          });
        }
      }
    }

    if (!didSendOptOutConfirm) {
      // normal inbound
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          lastMessageAt: inboundMsg?.createdAt ?? now,
          lastInboundAt: inboundMsg?.createdAt ?? now,
        },
      });
    } else {
      // opt-out case → jangan timpa lastMessageAt
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          lastInboundAt: inboundMsg?.createdAt ?? now,
        },
      });
    }

    if (!lead.phone && fromPhone) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { phone: fromPhone },
      });
    }

    const eventAt =
      inboundMsg?.sentAt ?? inboundMsg?.createdAt ?? sentAt ?? new Date();

    await emitRealtime({
      room: `lead:${lead.id}`,
      event: "wa_inbound",
      payload: {
        leadId: lead.id,
        messageId: inboundMsg?.id,
        waMessageId: inboundMsg?.waMessageId,
        at: eventAt.toISOString(),
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
    const nurturingState = await prisma.leadNurturingState.findUnique({
      where: { leadId: lead.id },
    });

    if (nurturingState?.status !== NurturingStatus.STOPPED) {
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
    }

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
