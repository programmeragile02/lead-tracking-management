import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import {
  MessageDirection,
  NurturingStatus,
  WhatsappStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

function hoursDiff(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10; // 1 desimal
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const leadIdRaw = searchParams.get("leadId");
    const includeMessages = searchParams.get("includeMessages") === "1";

    const leadId = Number(leadIdRaw);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "leadId is required" },
        { status: 400 }
      );
    }

    // ambil lead + state + sales WA
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        product: true,
        source: true,
        stage: true,
        status: true,
        sales: {
          include: { whatsappSession: true },
        },
        nurturingState: {
          include: {
            plan: {
              include: {
                steps: {
                  where: { isActive: true },
                  include: {
                    topic: {
                      include: {
                        category: true,
                        templates: true,
                      },
                    },
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!lead || lead.isExcluded) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // guard ownership (sales hanya boleh lead miliknya)
    if (user.roleSlug === "sales" && lead.salesId && lead.salesId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const now = new Date();

    // ====== ambil data pendukung (ringan tapi informatif) ======
    const [setting, pendingFU, lastInbound, lastOutbound, last10Messages] =
      await Promise.all([
        prisma.generalSetting.findUnique({ where: { id: 1 } }),
        prisma.leadFollowUp.count({
          where: { leadId, doneAt: null },
        }),
        prisma.leadMessage.findFirst({
          where: { leadId, direction: MessageDirection.INBOUND },
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, sentAt: true, content: true },
        }),
        prisma.leadMessage.findFirst({
          where: { leadId, direction: MessageDirection.OUTBOUND },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            sentAt: true,
            waStatus: true,
            waMessageId: true,
            content: true,
          },
        }),
        includeMessages
          ? prisma.leadMessage.findMany({
              where: { leadId },
              orderBy: { createdAt: "desc" },
              take: 10,
              select: {
                id: true,
                direction: true,
                waStatus: true,
                waMessageId: true,
                createdAt: true,
                sentAt: true,
                content: true,
              },
            })
          : Promise.resolve([]),
      ]);

    const state = lead.nurturingState;

    // ====== evaluasi "kenapa gak jalan" versi diagnosa ======
    const issues: string[] = [];
    const hints: string[] = [];

    // A) state exist?
    if (!state) {
      issues.push("STATE_MISSING: Lead belum punya LeadNurturingState.");
      hints.push(
        "Buat state via create lead / inbound / atau script backfill untuk lead lama."
      );
    } else {
      // B) status check
      if (state.status !== NurturingStatus.ACTIVE) {
        issues.push(`STATE_NOT_ACTIVE: status=${state.status}`);
        if (state.manualPaused) {
          hints.push(
            "State manualPaused=true → auto-resume hanya berjalan bila pausedAt sudah lewat maxIdleHours dan tidak ada pending FU + tidak ada inbound recent."
          );
        } else {
          hints.push(
            "State bukan ACTIVE → pastikan toggle/cron/logic followup memang mengaktifkan kembali sesuai rule."
          );
        }
      }

      // C) plan check
      if (!state.planId) {
        issues.push("PLAN_MISSING: planId null, belum ter-assign plan.");
        hints.push(
          "Jalankan assign plan (pickPlanForLead) dan set nextSendAt untuk lead ini."
        );
      }

      // D) nextSendAt check
      if (!state.nextSendAt) {
        issues.push("NEXT_SEND_AT_NULL: nextSendAt belum diset.");
        hints.push(
          "Set nextSendAt saat assign plan atau saat enable/toggle ACTIVE."
        );
      } else if (state.nextSendAt > now) {
        issues.push(
          `NOT_DUE_YET: nextSendAt masih di masa depan (${state.nextSendAt.toISOString()})`
        );
      }

      // E) pending followup check
      if (pendingFU > 0) {
        issues.push(
          `PENDING_FOLLOWUP: masih ada ${pendingFU} follow up doneAt=null`
        );
        hints.push("Cron send akan PAUSE state jika ada pending follow up.");
      }

      // F) inbound recent check (informational)
      const inboundRecentHours = Number(
        process.env.NURTURING_INBOUND_RECENT_HOURS || 2
      );
      if (lastInbound?.createdAt) {
        const h = hoursDiff(lastInbound.createdAt, now);
        if (h <= inboundRecentHours) {
          issues.push(
            `INBOUND_RECENT: inbound ${h} jam lalu (<= ${inboundRecentHours} jam)`
          );
          hints.push(
            "Cron send akan skip bila ada inbound dalam window recent."
          );
        }
      }

      // G) WA status check
      const wa = lead.sales?.whatsappSession;
      if (!lead.salesId) {
        issues.push(
          "NO_SALES: lead.salesId null (lead belum punya owner sales)."
        );
      } else if (!wa) {
        issues.push("WA_SESSION_MISSING: sales belum punya WhatsAppSession.");
      } else if (wa.status !== WhatsappStatus.CONNECTED) {
        issues.push(`WA_NOT_CONNECTED: whatsappSession.status=${wa.status}`);
        hints.push("Pastikan QR sudah discan dan status CONNECTED.");
      }

      // H) lead phone
      if (!lead.phone) {
        issues.push(
          "LEAD_PHONE_MISSING: lead.phone null, tidak bisa kirim WA."
        );
      }

      // I) step existence check
      if (state.plan?.steps?.length) {
        const nextOrder = (state.currentStep ?? 0) + 1;
        const step = state.plan.steps.find((s) => s.order === nextOrder);
        if (!step) {
          issues.push(
            `STEP_NOT_FOUND: next step order=${nextOrder} tidak ada di plan (aktif).`
          );
          hints.push("Cek NurturingPlanStep order berurutan mulai 1.");
        } else {
          const tpl = step.topic.templates.find((t) => t.slot === step.slot);
          if (!tpl) {
            issues.push(
              `TEMPLATE_MISSING: topic "${step.topic.title}" slot=${step.slot} tidak ada template.`
            );
            hints.push("Buat template slot A/B untuk topic tersebut.");
          } else if (tpl.isActive === false) {
            issues.push(
              `TEMPLATE_INACTIVE: template topic "${step.topic.title}" slot=${step.slot} isActive=false`
            );
            hints.push(
              "Kalau template inactive, cron send akan advance tanpa kirim (kalau logic kamu seperti itu)."
            );
          } else if (!tpl.waTemplateBody) {
            issues.push(
              `TEMPLATE_EMPTY: waTemplateBody kosong untuk topic "${step.topic.title}" slot=${step.slot}`
            );
            hints.push("Isi waTemplateBody agar ada konten yang dikirim.");
          }
        }
      }
    }

    // ====== response ringkas tapi lengkap ======
    return NextResponse.json({
      ok: true,
      data: {
        lead: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          salesId: lead.salesId,
          product: lead.product
            ? { id: lead.product.id, name: lead.product.name }
            : null,
          source: lead.source
            ? {
                id: lead.source.id,
                code: lead.source.code,
                name: lead.source.name,
              }
            : null,
          stage: lead.stage
            ? {
                id: lead.stage.id,
                code: lead.stage.code,
                name: lead.stage.name,
              }
            : null,
          status: lead.status
            ? {
                id: lead.status.id,
                code: lead.status.code,
                name: lead.status.name,
              }
            : null,
        },
        wa: lead.sales?.whatsappSession
          ? {
              status: lead.sales.whatsappSession.status,
              phoneNumber: lead.sales.whatsappSession.phoneNumber,
              lastConnectedAt: lead.sales.whatsappSession.lastConnectedAt,
              lastSeenAt: lead.sales.whatsappSession.lastSeenAt,
            }
          : null,
        setting: {
          autoNurturingEnabled: setting?.autoNurturingEnabled ?? true,
          maxIdleHoursBeforeResume: setting?.maxIdleHoursBeforeResume ?? 48,
          companyName: setting?.companyName ?? null,
        },
        state: state
          ? {
              status: state.status,
              manualPaused: state.manualPaused,
              pauseReason: state.pauseReason,
              currentStep: state.currentStep,
              planId: state.planId,
              startedAt: state.startedAt,
              lastSentAt: state.lastSentAt,
              nextSendAt: state.nextSendAt,
              pausedAt: state.pausedAt,
              lastMessageKey: state.lastMessageKey,
              plan: state.plan
                ? {
                    id: state.plan.id,
                    code: state.plan.code,
                    name: state.plan.name,
                    stepsActiveCount: state.plan.steps?.length ?? 0,
                  }
                : null,
            }
          : null,
        signals: {
          pendingFollowUps: pendingFU,
          lastInboundAt: lastInbound?.createdAt ?? null,
          lastOutboundAt: lastOutbound?.createdAt ?? null,
          lastOutboundWaStatus: lastOutbound?.waStatus ?? null,
          inboundAgeHours: lastInbound?.createdAt
            ? hoursDiff(lastInbound.createdAt, now)
            : null,
        },
        issues,
        hints,
        recentMessages: includeMessages ? last10Messages : undefined,
      },
    });
  } catch (err: any) {
    console.error("GET /api/nurturing/debug error", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
