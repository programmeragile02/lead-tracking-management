import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import {
  FollowUpResultType,
  NurturingPauseReason,
  NurturingStatus,
} from "@prisma/client";
import {
  getFirstStepDelayHours,
  pickPlanForLead,
} from "@/lib/nurturing-assign";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const { id, followUpId } = await ctx.params;
    const leadId = Number(id);
    const fuId = Number(followUpId);

    if (!leadId || Number.isNaN(leadId) || !fuId || Number.isNaN(fuId)) {
      return NextResponse.json(
        { ok: false, error: "Parameter tidak valid" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ===== BODY =====
    const body = await req.json().catch(() => null);
    const resultType = body?.resultType as FollowUpResultType | undefined;
    const resultNote = body?.resultNote?.trim();

    if (!resultType || !resultNote || resultNote.length < 5) {
      return NextResponse.json(
        {
          ok: false,
          error: "Hasil follow up dan catatan wajib diisi",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const followUp = await tx.leadFollowUp.findUnique({
        where: { id: fuId },
        include: {
          lead: { select: { id: true, salesId: true } },
          type: true,
        },
      });

      if (!followUp || followUp.leadId !== leadId) {
        throw new Error("NOT_FOUND");
      }

      // optional: hanya owner kalau role sales
      if (
        user.roleSlug === "sales" &&
        followUp.lead.salesId &&
        followUp.lead.salesId !== user.id
      ) {
        throw new Error("FORBIDDEN");
      }

      if (followUp.doneAt) {
        throw new Error("ALREADY_DONE");
      }

      const now = new Date();

      const updatedFollowUp = await tx.leadFollowUp.update({
        where: { id: fuId },
        data: {
          doneAt: now,
          resultType,
          resultNote,
        },
        include: {
          type: true,
          sales: { select: { id: true, name: true } },
        },
      });

      // ===== ACTIVITY LOG =====
      const typeLabel =
        updatedFollowUp.type?.name || updatedFollowUp.type?.code || "Follow Up";

      const resultLabelMap: Record<FollowUpResultType, string> = {
        INTERESTED: "Tertarik",
        NEED_FOLLOW_UP: "Perlu Follow Up Lanjutan",
        NO_RESPONSE: "Tidak Ada Respon",
        NOT_INTERESTED: "Tidak Tertarik",
        CLOSING: "Closing",
      };

      await tx.leadActivity.create({
        data: {
          leadId: followUp.leadId,
          title: "Follow up selesai",
          description: [
            `Follow up "${typeLabel}" telah diselesaikan.`,
            `Hasil: ${resultLabelMap[resultType]},`,
            `Catatan: ${resultNote}`,
          ].join("\n"),
          happenedAt: now,
          createdById: user.id,
        },
      });

      // IMPORTANT: aktivitas manual -> pause nurturing state (idle timer digeser)
      await tx.leadNurturingState.upsert({
        where: { leadId: followUp.leadId },
        create: {
          leadId: followUp.leadId,
          status: NurturingStatus.PAUSED,
          manualPaused: true,
          pauseReason: NurturingPauseReason.SALES_FOLLOWUP,
          pausedAt: now,
          currentStep: 0,
          nextSendAt: null,
        } as any,
        update: {
          status: NurturingStatus.PAUSED,
          manualPaused: true,
          pauseReason: NurturingPauseReason.SALES_FOLLOWUP,
          pausedAt: now,
          // jangan reset currentStep / planId supaya bisa lanjut dari step terakhir
          // nextSendAt biarkan null -> cron auto-resume yang set lagi
          nextSendAt: null,
        } as any,
      });

      // ===============================
      // START NURTURING SETELAH FU KE-3
      // ===============================
      const doneCount = await tx.leadFollowUp.count({
        where: {
          leadId: followUp.leadId,
          doneAt: { not: null },
        },
      });

      if (doneCount === 3) {
        const lead = await tx.lead.findUnique({
          where: { id: followUp.leadId },
          include: {
            status: true,
            nurturingState: true,
          },
        });

        const leadStatusCode = (lead?.status?.code ?? "").toUpperCase();

        // guard
        if (
          lead &&
          !lead.nurturingState && // belum pernah mulai
          !["CLOSE_WON", "CLOSE_LOST"].includes(leadStatusCode)
        ) {
          const plan = await pickPlanForLead({
            productId: lead.productId ?? null,
            sourceId: lead.sourceId ?? null,
            statusCode: lead.status?.code ?? null,
          });

          if (plan) {
            const delayHours = await getFirstStepDelayHours(plan.id);
            const now = new Date();

            await tx.leadNurturingState.create({
              data: {
                leadId: lead.id,
                planId: plan.id,
                status: NurturingStatus.ACTIVE,
                startedAt: now,
                currentStep: 0,
                nextSendAt:
                  delayHours != null
                    ? new Date(now.getTime() + delayHours * 60 * 60 * 1000)
                    : new Date(now.getTime() + 15 * 60 * 1000),
              },
            });

            await tx.leadActivity.create({
              data: {
                leadId: lead.id,
                title: "Nurturing dimulai otomatis",
                description:
                  "Nurturing otomatis dimulai setelah Follow Up ke-3 diselesaikan",
                happenedAt: now,
                createdById: user.id,
              },
            });
          }
        }
      }

      return updatedFollowUp;
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        typeId: updated.typeId,
        typeCode: updated.type?.code,
        typeName: updated.type?.name,
        channel: updated.channel,
        resultType: updated.resultType,
        resultNote: updated.resultNote,
        note: updated.note,
        doneAt: updated.doneAt,
        nextActionAt: updated.nextActionAt,
        createdAt: updated.createdAt,
        sales: updated.sales
          ? { id: updated.sales.id, name: updated.sales.name }
          : null,
      },
    });
  } catch (err: any) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return NextResponse.json(
          { ok: false, error: "Tindak lanjut tidak ditemukan" },
          { status: 404 }
        );
      }
      if (err.message === "FORBIDDEN") {
        return NextResponse.json(
          { ok: false, error: "Tidak boleh mengubah tindak lanjut ini" },
          { status: 403 }
        );
      }
      if (err.message === "ALREADY_DONE") {
        return NextResponse.json(
          { ok: false, error: "Follow up ini sudah diselesaikan" },
          { status: 409 }
        );
      }
    }

    console.error("PUT followup done error:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menandai tindak lanjut sebagai selesai" },
      { status: 500 }
    );
  }
}
