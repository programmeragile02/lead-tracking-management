import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { sendWaDocument } from "@/lib/whatsapp-service";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { emitRealtime } from "@/lib/realtime";
import { NurturingPauseReason, NurturingStatus } from "@prisma/client";
import { getWaTargetFromLead } from "@/lib/wa-utils";

export const runtime = "nodejs";

function normalizePhone(raw: string) {
  return raw.replace(/[^0-9]/g, "");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid lead id" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string | null) || "";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { ok: false, error: "File harus PDF" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Maksimal 5MB" },
        { status: 400 }
      );
    }

    // ambil lead (butuh phone + current stage/status untuk guard)
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        phone: true,
        salesId: true,
        stageId: true,
        statusId: true,
        name: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "Lead tidak ada" },
        { status: 400 }
      );
    }

    const lastMsg = await prisma.leadMessage.findFirst({
      where: {
        leadId,
        channel: "WHATSAPP",
      },
      orderBy: { createdAt: "desc" },
      select: { waChatId: true },
    });

    const waTarget = getWaTargetFromLead(lead, lastMsg?.waChatId);

    if (!waTarget) {
      return NextResponse.json(
        { ok: false, error: "no_whatsapp_target" },
        { status: 400 }
      );
    }

    // guard ownership: kalau role sales, harus pemilik lead
    if (user.roleSlug === "sales" && lead.salesId && lead.salesId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // const toNumber = normalizePhone(lead.phone);

    // simpan file ke disk (public/uploads/proposals)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = ".pdf";
    const fileName = `proposal-${leadId}-${randomUUID()}${ext}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "proposals"
    );

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/proposals/${fileName}`;
    const baseUrl = process.env.APP_PUBLIC_BASE_URL || "http://localhost:3015";
    const absoluteUrl = new URL(publicUrl, baseUrl).toString();

    // === 1) CREATE LEAD MESSAGE (PENDING) ===
    const leadMessage = await prisma.leadMessage.create({
      data: {
        leadId,
        salesId: user.id,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        waChatId: lastMsg?.waChatId ?? null,
        toNumber: lead.phone ?? null,
        content: caption,
        type: "MEDIA",
        mediaUrl: publicUrl,
        mediaName: fileName,
        mediaMime: "application/pdf",
        waStatus: "PENDING",
        sentAt: null,
      } as any,
    });

    // === 2) SEND TO WHATSAPP ===
    try {
      const waResult = await sendWaDocument({
        userId: user.id,
        to: waTarget,
        fileUrl: absoluteUrl,
        fileName,
        mimetype: "application/pdf",
        caption,
      });

      // === 3) UPDATE MESSAGE ID ===
      await prisma.leadMessage.update({
        where: { id: leadMessage.id },
        data: { waMessageId: waResult.waMessageId },
      });

      // === 4) AUTO: set status WARM + stage PENAWARAN (GUARDED) + histories ===
      const now = new Date();

      const [warmStatus, penawaranStage] = await Promise.all([
        prisma.leadStatus.findFirst({
          where: {
            isActive: true,
            OR: [{ code: "WARM" }, { name: { equals: "Warm" } }],
          },
          orderBy: { order: "asc" },
          select: { id: true, code: true, name: true },
        }),
        prisma.leadStage.findFirst({
          where: {
            isActive: true,
            OR: [{ code: "PENAWARAN" }, { name: { equals: "Penawaran" } }],
          },
          orderBy: { order: "asc" },
          select: { id: true, code: true, name: true, order: true },
        }),
      ]);

      const nextStatusId =
        warmStatus?.id && lead.statusId !== warmStatus.id
          ? warmStatus.id
          : null;

      const nextStageId =
        penawaranStage?.id && lead.stageId !== penawaranStage.id
          ? penawaranStage.id
          : null;

      // hanya transaksi kalau ada perubahan stage/status ATAU untuk pause nurturing
      await prisma.$transaction(async (tx) => {
        // update lead (hanya field yang berubah)
        if (nextStatusId || nextStageId) {
          await tx.lead.update({
            where: { id: leadId },
            data: {
              ...(nextStatusId ? { statusId: nextStatusId } : {}),
              ...(nextStageId ? { stageId: nextStageId } : {}),
            },
          });
        }

        // history status (guarded)
        if (nextStatusId) {
          await tx.leadStatusHistory.create({
            data: {
              leadId,
              statusId: nextStatusId,
              changedById: user.id,
              salesId: lead.salesId ?? user.id,
              note: "Auto: kirim proposal via WhatsApp → set WARM",
            },
          });
        }

        // history stage + auto skip (guarded)
        if (nextStageId) {
          if (penawaranStage?.id === nextStageId) {
            const allStages = await tx.leadStage.findMany({
              where: { isActive: true },
              orderBy: { order: "asc" },
              select: { id: true, order: true },
            });

            const target = allStages.find((s) => s.id === penawaranStage.id);
            if (target) {
              const existing = await tx.leadStageHistory.findMany({
                where: { leadId },
                select: { stageId: true },
              });
              const existingSet = new Set(existing.map((x) => x.stageId));

              const toSkip = allStages.filter(
                (s) => s.order < target.order && !existingSet.has(s.id)
              );

              if (toSkip.length) {
                await tx.leadStageHistory.createMany({
                  data: toSkip.map((s) => ({
                    leadId,
                    stageId: s.id,
                    changedById: user.id,
                    salesId: lead.salesId ?? user.id,
                    note: "Auto SKIPPED (langsung kirim penawaran)",
                    mode: "SKIPPED",
                    doneAt: now,
                    createdAt: now,
                  })),
                });
              }
            }
          }

          await tx.leadStageHistory.create({
            data: {
              leadId,
              stageId: nextStageId,
              changedById: user.id,
              salesId: lead.salesId ?? user.id,
              note: "Auto: kirim proposal via WhatsApp → pindah ke Penawaran",
              mode: "NORMAL",
              doneAt: null,
            },
          });
        }

        // ====== CHANGED: pause nurturing via LeadNurturingState ======
        await tx.leadNurturingState.upsert({
          where: { leadId },
          create: {
            leadId,
            status: NurturingStatus.PAUSED,
            manualPaused: false,
            pauseReason: NurturingPauseReason.SALES_FOLLOWUP,
            pausedAt: now,
            nextSendAt: null,
            currentStep: 0,
          } as any,
          update: {
            status: NurturingStatus.PAUSED,
            manualPaused: false,
            pauseReason: NurturingPauseReason.SALES_FOLLOWUP,
            pausedAt: now,
            nextSendAt: null,
          } as any,
        });
      });

      // === 5) ACTIVITY LOG ===
      await prisma.leadActivity.create({
        data: {
          leadId,
          title: "Kirim proposal via WhatsApp",
          description: caption
            ? `Proposal: ${fileName}\nCatatan: ${caption}`
            : `Proposal: ${fileName}`,
          happenedAt: now,
          createdById: user.id,
        },
      });

      // === 6) REALTIME ===
      await emitRealtime({
        room: `lead:${lead.id}`,
        event: "wa_outbound_created",
        payload: {
          leadId: lead.id,
          message: leadMessage,
        },
      });

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[WA-PROPOSAL] send failed:", err);

      await prisma.leadMessage.update({
        where: { id: leadMessage.id },
        data: { waStatus: "FAILED" },
      });

      return NextResponse.json(
        { ok: false, error: "send_failed" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("POST /api/leads/[id]/whatsapp/proposal error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
