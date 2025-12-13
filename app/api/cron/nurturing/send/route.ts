import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  LeadMessageChannel,
  LeadMessageType,
  MessageDirection,
  NurturingStatus,
  WaMessageStatus,
  WhatsappStatus,
} from "@prisma/client";
import {
  ensureWaClient,
  sendWaMessage,
  sendWaDocument,
} from "@/lib/whatsapp-service";
import { buildGoUrl, createTrackedLink } from "@/lib/tracked-links";

const CRON_KEY = process.env.NURTURING_CRON_KEY || "";
const INBOUND_RECENT_HOURS = Number(
  process.env.NURTURING_INBOUND_RECENT_HOURS || 2
);
const BATCH = Number(process.env.NURTURING_CRON_BATCH || 50);

function renderTemplate(
  template: string | null | undefined,
  vars: Record<string, any>
): string {
  if (!template) return "";
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const v = vars[key.trim()];
    return (v ?? "").toString();
  });
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function isPdfUrl(url: string) {
  const u = url.toLowerCase();
  return u.includes(".pdf") || u.includes("application/pdf");
}

function pickFileNameFromUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "file.pdf";
    return last.endsWith(".pdf") ? last : `${last}.pdf`;
  } catch {
    return "file.pdf";
  }
}

// ==== helper multi-link product ====
type ProductLinkItem = {
  label?: string | null;
  url?: string | null;
};

function buildLinkBlock(raw: any): string {
  if (!raw) return "";

  let arr: ProductLinkItem[] = [];
  try {
    if (Array.isArray(raw)) arr = raw as ProductLinkItem[];
  } catch {
    return "";
  }

  const clean = arr
    .map((i) => ({
      label: (i.label ?? "").toString().trim() || "Link",
      url: (i.url ?? "").toString().trim(),
    }))
    .filter((i) => i.url);

  if (!clean.length) return "";
  return clean.map((item) => `• ${item.label}\n${item.url}`).join("\n\n");
}

async function buildTrackedLinkBlock(params: {
  raw: any;
  leadId: number;
  salesId: number;
  leadMessageId: number;
  kind: "DEMO" | "TESTIMONIAL" | "EDUCATION";
  baseUrl: string;
  productId?: number | null;
  planId?: number | null;
  stepOrder?: number | null;
}) {
  const { raw, leadId, salesId, leadMessageId, kind, baseUrl } = params;
  if (!Array.isArray(raw)) return "";

  const rows: string[] = [];

  for (const item of raw as ProductLinkItem[]) {
    const url = (item?.url ?? "").toString().trim();
    if (!url) continue;

    const label = (item?.label ?? "Link").toString().trim();

    const row = await createTrackedLink({
      leadId,
      salesId,
      leadMessageId,
      kind,
      label,
      targetUrl: url,
      productId: params.productId ?? null,
      planId: params.planId ?? null,
      stepOrder: params.stepOrder ?? null,
    });

    rows.push(`• ${label}\n${buildGoUrl(baseUrl, row.slug, row.code)}`);
  }

  return rows.join("\n\n");
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-cron-key") || "";
  if (!CRON_KEY || key !== CRON_KEY) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const now = new Date();
  const setting = await prisma.generalSetting.findUnique({ where: { id: 1 } });
  if (setting?.autoNurturingEnabled === false) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "autoNurturingEnabled=false",
    });
  }

  const states = await prisma.leadNurturingState.findMany({
    where: {
      status: NurturingStatus.ACTIVE,
      planId: { not: null },
      nextSendAt: { not: null, lte: now },
    },
    orderBy: [{ nextSendAt: "asc" }],
    take: BATCH,
    select: {
      leadId: true,
      planId: true,
      currentStep: true,
      lastMessageKey: true,
    },
  });

  let checked = states.length;
  let sent = 0;
  let skipped = 0;
  let advanced = 0;
  let paused = 0;
  let failed = 0;

  for (const st of states) {
    const leadId = st.leadId;
    const planId = st.planId!;
    const nextOrder = (st.currentStep ?? 0) + 1;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        product: true,
        status: true,
        sales: { include: { whatsappSession: true } },
      },
    });
    if (!lead) {
      skipped++;
      continue;
    }

    // ===== Guard 0: STOP jika lead sudah close =====
    const leadStatusCode = (lead.status?.code ?? "").toUpperCase();
    if (leadStatusCode === "CLOSE_WON" || leadStatusCode === "CLOSE_LOST") {
      await prisma.leadNurturingState.update({
        where: { leadId },
        data: { status: NurturingStatus.STOPPED, nextSendAt: null } as any,
      });
      skipped++;
      continue;
    }

    // ===== Guard 1: follow up pending => pause =====
    const pendingFU = await prisma.leadFollowUp.count({
      where: { leadId, doneAt: null },
    });
    if (pendingFU > 0) {
      await prisma.leadNurturingState.update({
        where: { leadId },
        data: {
          status: NurturingStatus.PAUSED,
          manualPaused: false,
          pausedAt: now,
        } as any,
      });
      paused++;
      continue;
    }

    // ===== Guard 2: inbound recent =====
    const inboundCutoff = hoursAgo(INBOUND_RECENT_HOURS);
    const lastInbound = await prisma.leadMessage.findFirst({
      where: { leadId, direction: MessageDirection.INBOUND },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastInbound?.createdAt && lastInbound.createdAt > inboundCutoff) {
      skipped++;
      continue;
    }

    // ===== Guard 3: WA CONNECTED + lead.phone exist =====
    const wa = lead.sales?.whatsappSession;
    if (
      !lead.salesId ||
      !wa ||
      wa.status !== WhatsappStatus.CONNECTED ||
      !lead.phone
    ) {
      await prisma.leadNurturingState.update({
        where: { leadId },
        data: { nextSendAt: new Date(Date.now() + 6 * 60 * 60 * 1000) } as any,
      });
      skipped++;
      continue;
    }

    // ===== Step berikutnya =====
    const step = await prisma.nurturingPlanStep.findFirst({
      where: { planId, isActive: true, order: nextOrder },
      include: {
        topic: {
          include: {
            category: true,
            templates: true,
          },
        },
      },
      orderBy: [{ id: "asc" }],
    });

    if (!step) {
      await prisma.leadNurturingState.update({
        where: { leadId },
        data: { status: NurturingStatus.STOPPED, nextSendAt: null } as any,
      });
      skipped++;
      continue;
    }

    const template =
      (step.topic.templates ?? []).find((t: any) => t.slot === step.slot) ??
      null;

    const templateBody: string | null = template?.waTemplateBody ?? null;

    // ===== Anti-dobel: claim atomic =====
    const messageKey = `LEAD:${leadId}:STEP:${nextOrder}`;
    const claim = await prisma.leadNurturingState.updateMany({
      where: {
        leadId,
        status: NurturingStatus.ACTIVE,
        planId,
        nextSendAt: { not: null, lte: now },
        OR: [{ lastMessageKey: null }, { lastMessageKey: { not: messageKey } }],
      },
      data: { lastMessageKey: messageKey } as any,
    });

    if (claim.count !== 1) {
      skipped++;
      continue;
    }

    // ===== Template kosong / inactive => advance tanpa kirim =====
    if (!templateBody || template?.isActive === false) {
      const nextSend = new Date(
        Date.now() + (step.delayHours ?? 24) * 60 * 60 * 1000
      );
      await prisma.leadNurturingState.update({
        where: { leadId },
        data: {
          currentStep: nextOrder,
          lastSentAt: now,
          nextSendAt: nextSend,
        } as any,
      });
      advanced++;
      continue;
    }

    const baseUrl = process.env.APP_PUBLIC_BASE_URL || "http://localhost:3015";

    // 1) create message dulu (placeholder content sementara)
    const msg = await prisma.leadMessage.create({
      data: {
        leadId,
        salesId: lead.salesId ?? null,
        channel: LeadMessageChannel.WHATSAPP,
        direction: MessageDirection.OUTBOUND,
        content: "", // nanti diupdate setelah link block jadi
        type: LeadMessageType.TEXT,
        waStatus: WaMessageStatus.PENDING,
        toNumber: lead.phone,
      } as any,
    });

    // 2) buat link block tracked (butuh msg.id)
    const demoBlock = await buildTrackedLinkBlock({
      raw: lead.product?.demoLinks,
      leadId,
      salesId: lead.salesId!,
      leadMessageId: msg.id,
      kind: "DEMO",
      baseUrl,
      productId: lead.productId ?? null,
      planId,
      stepOrder: nextOrder,
    });

    const testiBlock = await buildTrackedLinkBlock({
      raw: lead.product?.testimonialLinks,
      leadId,
      salesId: lead.salesId!,
      leadMessageId: msg.id,
      kind: "TESTIMONIAL",
      baseUrl,
      productId: lead.productId ?? null,
      planId,
      stepOrder: nextOrder,
    });

    const edukasiBlock = await buildTrackedLinkBlock({
      raw: lead.product?.educationLinks,
      leadId,
      salesId: lead.salesId!,
      leadMessageId: msg.id,
      kind: "EDUCATION",
      baseUrl,
      productId: lead.productId ?? null,
      planId,
      stepOrder: nextOrder,
    });

    // 3) baru render template final
    const vars = {
      nama_lead: lead.name,
      nama_sales: lead.sales?.name ?? "",
      produk: lead.product?.name ?? "",
      perusahaan: setting?.companyName ?? "Perusahaan Kami",
      video_demo_links: demoBlock,
      testimoni_links: testiBlock,
      edukasi_links: edukasiBlock,
    };

    const content = renderTemplate(templateBody, vars).trim();

    // 4) update message content di DB biar isi tersimpan rapih
    await prisma.leadMessage.update({
      where: { id: msg.id },
      data: { content },
    });

    // 5) baru kirim WA
    try {
      await ensureWaClient(lead.salesId);

      const mediaUrl = template?.waTemplateMedia ?? null;

      if (mediaUrl && isPdfUrl(mediaUrl)) {
        const fileName = pickFileNameFromUrl(mediaUrl);
        const docRes = await sendWaDocument({
          userId: lead.salesId,
          to: lead.phone,
          fileUrl: mediaUrl,
          fileName,
          mimetype: "application/pdf",
          caption: content || undefined,
        });

        await prisma.leadMessage.update({
          where: { id: msg.id },
          data: {
            waMessageId: docRes.waMessageId,
            waStatus: WaMessageStatus.SENT,
            sentAt: now,
            type: LeadMessageType.MEDIA,
            mediaUrl,
            mediaName: fileName,
            mediaMime: "application/pdf",
          } as any,
        });
      } else {
        const sendRes = await sendWaMessage({
          userId: lead.salesId,
          to: lead.phone,
          body: content,
          meta: {
            leadId,
            planId,
            stepOrder: nextOrder,
            topicId: step.topicId,
            slot: step.slot,
          },
        });

        await prisma.leadMessage.update({
          where: { id: msg.id },
          data: {
            waMessageId: sendRes.waMessageId,
            waStatus: WaMessageStatus.SENT,
            sentAt: now,
          } as any,
        });
      }

      const nextSend = new Date(
        Date.now() + (step.delayHours ?? 24) * 60 * 60 * 1000
      );
      await prisma.leadNurturingState.update({
        where: { leadId },
        data: {
          currentStep: nextOrder,
          lastSentAt: now,
          nextSendAt: nextSend,
        } as any,
      });

      sent++;
    } catch (e: any) {
      await prisma.leadMessage.update({
        where: { id: msg.id },
        data: { waStatus: WaMessageStatus.FAILED } as any,
      });

      await prisma.leadNurturingState.update({
        where: { leadId },
        data: {
          lastMessageKey: null,
          nextSendAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        } as any,
      });

      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    checked,
    sent,
    skipped,
    advanced,
    paused,
    failed,
    batch: BATCH,
    inboundRecentHours: INBOUND_RECENT_HOURS,
  });
}
