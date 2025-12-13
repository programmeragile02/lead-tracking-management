// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth-server";
// import { NurturingStatus } from "@prisma/client";

// export const dynamic = "force-dynamic";

// type Body = {
//   statusCode?: string;
//   note?: string;
// };

// export async function POST(
//   req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const user = await getCurrentUser(req);
//   if (!user) {
//     return NextResponse.json(
//       { ok: false, error: "Unauthorized" },
//       { status: 401 }
//     );
//   }

//   const { id } = await context.params;
//   const leadId = Number(id);

//   const body = (await req.json()) as Body;
//   if (!body.statusCode) {
//     return NextResponse.json(
//       { ok: false, error: "statusCode is required" },
//       { status: 400 }
//     );
//   }

//   const statusCode = body.statusCode.toUpperCase();

//   const [lead, targetStatus] = await Promise.all([
//     prisma.lead.findUnique({ where: { id: leadId } }),
//     prisma.leadStatus.findUnique({
//       where: { code: statusCode },
//     }),
//   ]);

//   if (!lead) {
//     return NextResponse.json(
//       { ok: false, error: "Lead not found" },
//       { status: 404 }
//     );
//   }

//   if (!targetStatus || !targetStatus.isActive) {
//     return NextResponse.json(
//       { ok: false, error: "Status not found / inactive" },
//       { status: 400 }
//     );
//   }

//   // jika user adalah SALES, pastikan dia pemilik lead
//   if (user.roleSlug === "sales" && lead.salesId !== user.id) {
//     return NextResponse.json(
//       { ok: false, error: "Forbidden" },
//       { status: 403 }
//     );
//   }

//   const ownerSalesId = lead.salesId ?? user.id;

//   // Rule: HOT / CLOSE_WON / CLOSE_LOST → nurturing STOPPED
//   const targetCodeUpper = targetStatus.code.toUpperCase();
//   const shouldStopNurturing = ["HOT", "CLOSE_WON", "CLOSE_LOST"].includes(
//     targetCodeUpper
//   );

//   const [updatedLead] = await prisma.$transaction([
//     prisma.lead.update({
//       where: { id: leadId },
//       data: {
//         statusId: targetStatus.id,
//         ...(shouldStopNurturing
//           ? {
//               nurturingStatus: NurturingStatus.STOPPED,
//               nurturingCurrentStep: null,
//               nurturingLastSentAt: null,
//               nurturingStartedAt: null,
//               nurturingPausedAt: null,
//             }
//           : {}),
//       },
//     }),
//     prisma.leadStatusHistory.create({
//       data: {
//         leadId,
//         statusId: targetStatus.id,
//         changedById: user.id,
//         salesId: ownerSalesId,
//         note: body.note || null,
//       },
//     }),
//   ]);

//   return NextResponse.json({
//     ok: true,
//     data: {
//       lead: updatedLead,
//     },
//   });
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Body = {
  statusCode?: string;
  note?: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.statusCode) {
    return NextResponse.json(
      { ok: false, error: "statusCode is required" },
      { status: 400 }
    );
  }

  const statusCode = body.statusCode.toUpperCase();

  const [lead, targetStatus] = await Promise.all([
    prisma.lead.findUnique({ where: { id: leadId } }),
    prisma.leadStatus.findUnique({ where: { code: statusCode } }),
  ]);

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  if (!targetStatus || !targetStatus.isActive) {
    return NextResponse.json(
      { ok: false, error: "Status not found / inactive" },
      { status: 400 }
    );
  }

  // jika user adalah SALES, pastikan dia pemilik lead
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const ownerSalesId = lead.salesId ?? user.id;

  // Rule: HOT / CLOSE_WON / CLOSE_LOST → nurturing STOPPED
  const targetCodeUpper = targetStatus.code.toUpperCase();
  const shouldStopNurturing = ["HOT", "CLOSE_WON", "CLOSE_LOST"].includes(
    targetCodeUpper
  );

  const now = new Date();

  const [updatedLead] = await prisma.$transaction([
    // 1) Update status di Lead
    prisma.lead.update({
      where: { id: leadId },
      data: {
        statusId: targetStatus.id,
      },
    }),

    // 2) History status
    prisma.leadStatusHistory.create({
      data: {
        leadId,
        statusId: targetStatus.id,
        changedById: user.id,
        salesId: ownerSalesId,
        note: body.note || null,
      },
    }),

    // 3) CHANGED: Stop nurturing di LeadNurturingState
    ...(shouldStopNurturing
      ? [
          prisma.leadNurturingState.upsert({
            where: { leadId },
            create: {
              leadId,
              status: NurturingStatus.STOPPED,
              manualPaused: false,
              pauseReason: null,
              pausedAt: null,
              nextSendAt: null,
              // currentStep biarin default 0; atau kalau mau reset, set 0
              currentStep: 0,
              startedAt: null,
              lastSentAt: null,
              lastMessageKey: null,
            } as any,
            update: {
              status: NurturingStatus.STOPPED,
              manualPaused: false,
              pauseReason: null,
              pausedAt: null,
              nextSendAt: null,
              startedAt: null,
              lastSentAt: null,
              lastMessageKey: null,
              // opsional reset step
              // currentStep: 0,
            } as any,
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      lead: updatedLead,
      stoppedNurturing: shouldStopNurturing,
      at: now.toISOString(),
    },
  });
}
