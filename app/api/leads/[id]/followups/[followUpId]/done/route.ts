// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth-server";

// export async function PUT(
//   req: NextRequest,
//   ctx: { params: Promise<{ id: string; followUpId: string }> }
// ) {
//   try {
//     const { id, followUpId } = await ctx.params;
//     const leadId = Number(id);
//     const fuId = Number(followUpId);

//     if (!leadId || Number.isNaN(leadId) || !fuId || Number.isNaN(fuId)) {
//       return NextResponse.json(
//         { ok: false, error: "Parameter tidak valid" },
//         { status: 400 }
//       );
//     }

//     const user = await getCurrentUser(req);
//     if (!user) {
//       return NextResponse.json(
//         { ok: false, error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // --- Jalankan dalam transaction supaya update + activity konsisten ---
//     const updated = await prisma.$transaction(async (tx) => {
//       // cek follow up + lead
//       const followUp = await tx.leadFollowUp.findUnique({
//         where: { id: fuId },
//         include: {
//           lead: {
//             select: {
//               id: true,
//               salesId: true,
//             },
//           },
//           type: true,
//         },
//       });

//       if (!followUp || followUp.leadId !== leadId) {
//         throw new Error("NOT_FOUND");
//       }

//       // optional: hanya owner kalau role sales
//       if (
//         user.roleSlug === "sales" &&
//         followUp.lead.salesId &&
//         followUp.lead.salesId !== user.id
//       ) {
//         throw new Error("FORBIDDEN");
//       }

//       const now = new Date();

//       const updatedFollowUp = await tx.leadFollowUp.update({
//         where: { id: fuId },
//         data: {
//           doneAt: now,
//         },
//         include: {
//           type: true,
//           sales: { select: { id: true, name: true } },
//         },
//       });

//       // ---- Catat aktivitas "Follow up selesai" ----
//       const doneStr = now.toLocaleString("id-ID", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       });

//       const typeLabel =
//         updatedFollowUp.type?.name || updatedFollowUp.type?.code || "Follow up";

//       const descriptionLines: string[] = [
//         `Follow up "${typeLabel}" ditandai selesai melalui panel WhatsApp.`,
//         `Waktu selesai: ${doneStr}.`,
//       ];

//       await tx.leadActivity.create({
//         data: {
//           leadId: followUp.leadId,
//           title: "Follow up selesai",
//           description: descriptionLines.join("\n"),
//           happenedAt: now,
//           createdById: user.id,
//         },
//       });

//       return updatedFollowUp;
//     });

//     return NextResponse.json({
//       ok: true,
//       data: {
//         id: updated.id,
//         typeId: updated.typeId,
//         typeCode: updated.type?.code,
//         typeName: updated.type?.name,
//         channel: updated.channel,
//         note: updated.note,
//         doneAt: updated.doneAt,
//         nextActionAt: updated.nextActionAt,
//         createdAt: updated.createdAt,
//         sales: updated.sales
//           ? { id: updated.sales.id, name: updated.sales.name }
//           : null,
//       },
//     });
//   } catch (err: any) {
//     if (err instanceof Error) {
//       if (err.message === "NOT_FOUND") {
//         return NextResponse.json(
//           { ok: false, error: "Tindak lanjut tidak ditemukan" },
//           { status: 404 }
//         );
//       }
//       if (err.message === "FORBIDDEN") {
//         return NextResponse.json(
//           { ok: false, error: "Tidak boleh mengubah tindak lanjut ini" },
//           { status: 403 }
//         );
//       }
//     }

//     console.error("PUT followup done error:", err);
//     return NextResponse.json(
//       { ok: false, error: "Gagal menandai tindak lanjut sebagai selesai" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingPauseReason, NurturingStatus } from "@prisma/client";

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

      const now = new Date();

      const updatedFollowUp = await tx.leadFollowUp.update({
        where: { id: fuId },
        data: { doneAt: now },
        include: {
          type: true,
          sales: { select: { id: true, name: true } },
        },
      });

      // ---- Activity log ----
      const doneStr = now.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const typeLabel =
        updatedFollowUp.type?.name || updatedFollowUp.type?.code || "Follow up";

      await tx.leadActivity.create({
        data: {
          leadId: followUp.leadId,
          title: "Follow up selesai",
          description: [
            `Follow up "${typeLabel}" ditandai selesai melalui panel WhatsApp.`,
            `Waktu selesai: ${doneStr}.`,
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
    }

    console.error("PUT followup done error:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menandai tindak lanjut sebagai selesai" },
      { status: 500 }
    );
  }
}
