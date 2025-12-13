// // app/api/followups/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth-server";
// import { NurturingStatus } from "@prisma/client";

// export const dynamic = "force-dynamic";

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const user = await getCurrentUser(req);
//   if (!user || user.roleSlug !== "sales") {
//     return NextResponse.json(
//       { ok: false, error: "Unauthorized" },
//       { status: 401 }
//     );
//   }

//   const { id } = await params;
//   const followUpId = Number(id);
//   if (!followUpId || Number.isNaN(followUpId)) {
//     return NextResponse.json(
//       { ok: false, error: "Invalid followup id" },
//       { status: 400 }
//     );
//   }

//   const body = (await req.json().catch(() => null)) as {
//     nextActionAt?: string;
//     note?: string;
//     markDone?: boolean;
//   } | null;

//   const nextActionAt = body?.nextActionAt;
//   const note = body?.note;
//   const markDone = body?.markDone === true;

//   // kalau bukan markDone dan tidak ada nextActionAt → error
//   if (!markDone && !nextActionAt) {
//     return NextResponse.json(
//       { ok: false, error: "nextActionAt is required" },
//       { status: 400 }
//     );
//   }

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       const existing = await tx.leadFollowUp.findFirst({
//         where: {
//           id: followUpId,
//           salesId: user.id, // pastikan ini follow up milik sales ini
//         },
//         include: {
//           type: true,
//         },
//       });

//       if (!existing) {
//         throw new Error("NOT_FOUND");
//       }

//       const now = new Date();

//       // ========================
//       // MODE 1: TANDAI SELESAI
//       // ========================
//       if (markDone) {
//         const updated = await tx.leadFollowUp.update({
//           where: { id: followUpId },
//           data: {
//             doneAt: now,
//             ...(note && note.trim()
//               ? {
//                   note:
//                     (existing.note ? existing.note + "\n\n" : "") +
//                     `[DONE ${now.toISOString()}] ${note}`,
//                 }
//               : {}),
//           },
//         });

//         // Catat aktivitas "Follow up selesai"
//         let description = `Follow up "${
//           existing.type?.name || existing.type?.code || "Tindak lanjut"
//         }" ditandai selesai pada ${now.toLocaleString("id-ID", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//         })}.`;

//         if (note && note.trim()) {
//           description += `\n\nCatatan: ${note}`;
//         }

//         await tx.leadActivity.create({
//           data: {
//             leadId: existing.leadId,
//             title: "Follow up selesai",
//             description,
//             happenedAt: now,
//             createdById: user.id,
//           },
//         });

//         // Jaga-jaga: nurturing tetap PAUSED setelah aktivitas manual
//         await tx.lead.update({
//           where: { id: existing.leadId },
//           data: {
//             nurturingStatus: NurturingStatus.PAUSED,
//             nurturingPausedAt: now,
//           },
//         });

//         return updated;
//       }

//       // ========================
//       // MODE 2: RESCHEDULE
//       // ========================
//       const oldNext = existing.nextActionAt;
//       const newNext = new Date(nextActionAt!);

//       const updated = await tx.leadFollowUp.update({
//         where: { id: followUpId },
//         data: {
//           doneAt: null,
//           nextActionAt: newNext,
//           ...(note && note.trim()
//             ? {
//                 note:
//                   (existing.note ? existing.note + "\n\n" : "") +
//                   `[RESCHEDULE ${now.toISOString()}] ${note}`,
//               }
//             : {}),
//         },
//       });

//       const oldStr = oldNext
//         ? oldNext.toLocaleString("id-ID", {
//             day: "2-digit",
//             month: "short",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//           })
//         : "-";

//       const newStr = newNext.toLocaleString("id-ID", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       });

//       let description = `Reschedule follow up dari ${oldStr} ke ${newStr}.`;
//       if (note && note.trim()) {
//         description += `\n\nAlasan: ${note}`;
//       }

//       await tx.leadActivity.create({
//         data: {
//           leadId: existing.leadId,
//           title: "Reschedule follow up",
//           description,
//           happenedAt: now,
//           createdById: user.id,
//         },
//       });

//       // Pastikan nurturing tetap PAUSED saat reschedule
//       await tx.lead.update({
//         where: { id: existing.leadId },
//         data: {
//           nurturingStatus: NurturingStatus.PAUSED,
//           nurturingPausedAt: now,
//         },
//       });

//       return updated;
//     });

//     return NextResponse.json({ ok: true, data: result });
//   } catch (err: any) {
//     if (err instanceof Error && err.message === "NOT_FOUND") {
//       return NextResponse.json(
//         { ok: false, error: "Follow up not found" },
//         { status: 404 }
//       );
//     }

//     console.error("PATCH /api/followups/[id] error", err);
//     return NextResponse.json(
//       { ok: false, error: "Failed to update follow up" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingPauseReason, NurturingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user || user.roleSlug !== "sales") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const followUpId = Number(id);
  if (!followUpId || Number.isNaN(followUpId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid followup id" },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    nextActionAt?: string;
    note?: string;
    markDone?: boolean;
  } | null;

  const nextActionAt = body?.nextActionAt;
  const note = body?.note;
  const markDone = body?.markDone === true;

  if (!markDone && !nextActionAt) {
    return NextResponse.json(
      { ok: false, error: "nextActionAt is required" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.leadFollowUp.findFirst({
        where: { id: followUpId, salesId: user.id },
        include: { type: true },
      });

      if (!existing) throw new Error("NOT_FOUND");

      const now = new Date();

      // helper: pause nurturing state karena ada aktivitas manual followup
      async function pauseNurturingForLead(leadId: number) {
        await tx.leadNurturingState.upsert({
          where: { leadId },
          create: {
            leadId,
            status: NurturingStatus.PAUSED,
            manualPaused: false, // penting: bukan permanent pause
            pauseReason: NurturingPauseReason.SALES_FOLLOWUP,
            pausedAt: now,
            nextSendAt: null, // stop dulu, nanti cron auto-resume yang nyalain
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
      }

      // ========================
      // MODE 1: MARK DONE
      // ========================
      if (markDone) {
        const updated = await tx.leadFollowUp.update({
          where: { id: followUpId },
          data: {
            doneAt: now,
            ...(note && note.trim()
              ? {
                  note:
                    (existing.note ? existing.note + "\n\n" : "") +
                    `[DONE ${now.toISOString()}] ${note}`,
                }
              : {}),
          },
        });

        // activity log
        let description = `Follow up "${
          existing.type?.name || existing.type?.code || "Tindak lanjut"
        }" ditandai selesai pada ${now.toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}.`;
        if (note && note.trim()) description += `\n\nCatatan: ${note}`;

        await tx.leadActivity.create({
          data: {
            leadId: existing.leadId,
            title: "Follow up selesai",
            description,
            happenedAt: now,
            createdById: user.id,
          },
        });

        // PAUSE nurturing state
        await pauseNurturingForLead(existing.leadId);

        return updated;
      }

      // ========================
      // MODE 2: RESCHEDULE
      // ========================
      const oldNext = existing.nextActionAt;
      const newNext = new Date(nextActionAt!);

      const updated = await tx.leadFollowUp.update({
        where: { id: followUpId },
        data: {
          doneAt: null,
          nextActionAt: newNext,
          ...(note && note.trim()
            ? {
                note:
                  (existing.note ? existing.note + "\n\n" : "") +
                  `[RESCHEDULE ${now.toISOString()}] ${note}`,
              }
            : {}),
        },
      });

      const oldStr = oldNext
        ? oldNext.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";

      const newStr = newNext.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      let description = `Reschedule follow up dari ${oldStr} ke ${newStr}.`;
      if (note && note.trim()) description += `\n\nAlasan: ${note}`;

      await tx.leadActivity.create({
        data: {
          leadId: existing.leadId,
          title: "Reschedule follow up",
          description,
          happenedAt: now,
          createdById: user.id,
        },
      });

      // PAUSE nurturing state
      await pauseNurturingForLead(existing.leadId);

      return updated;
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Follow up not found" },
        { status: 404 }
      );
    }

    console.error("PATCH /api/followups/[id] error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update follow up" },
      { status: 500 }
    );
  }
}
