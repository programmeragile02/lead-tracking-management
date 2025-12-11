import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || user.roleSlug !== "sales") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  // ============================
  // 1) TUGAS FOLLOW UP TERJADWAL
  // ============================
  const followUps = await prisma.leadFollowUp.findMany({
    where: {
      salesId: user.id,
      nextActionAt: { not: null },
      lead: {
        salesId: user.id,
        status: {
          // sesuaikan dengan status final di sistemmu
          // di sini aku exclude COLD / CLOSE_LOST / WON
          is: {
            code: { notIn: ["COLD", "CLOSE_LOST", "WON"] },
          },
        },
      },
    },
    include: {
      lead: {
        include: {
          product: true,
          stage: true,
          status: true,
        },
      },
      type: true,
    },
    orderBy: {
      nextActionAt: "asc",
    },
  });

  const tasks = followUps
    .filter((fu) => fu.nextActionAt)
    .map((fu) => {
      const next = fu.nextActionAt as Date;

      let status: "overdue" | "today" | "upcoming";

      if (next < now && fu.doneAt === null ) {
        // termasuk yang jam-nya sudah lewat hari ini
        status = "overdue";
      } else if (next >= now && next < startOfTomorrow && fu.doneAt === null) {
        // hari ini tapi jamnya belum lewat
        status = "today";
      } else if (fu.doneAt === null) {
        // besok dan seterusnya
        status = "upcoming";
      }

      return {
        id: fu.id,
        followUpId: fu.id,
        leadId: fu.leadId,
        leadName: fu.lead.name,
        productName: fu.lead.product?.name ?? null,
        followUpTypeCode: fu.type?.code ?? null,
        followUpTypeName: fu.type?.name ?? null,
        nextActionAt: next.toISOString(),
        status,
        stageName: fu.lead.stage?.name ?? null,
        statusName: fu.lead.status?.name ?? null,
        isDone: fu.doneAt ? true : false,
        doneAt: fu.doneAt ? fu.doneAt.toISOString() : null,
      };
    });

  // ==========================================
  // 2) LEAD BARU HARI INI TANPA FOLLOW UP SAMA SEKALI
  // ==========================================
  const untouchedLeadsRaw = await prisma.lead.findMany({
    where: {
      salesId: user.id,
      createdAt: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
      followUps: {
        none: {}, // belum pernah follow up sama sekali
      },
      status: {
        is: {
          code: { notIn: ["COLD", "CLOSE_LOST", "CLOSE_WON"] },
        },
      },
    },
    include: {
      product: true,
      stage: true,
      status: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const untouchedLeads = untouchedLeadsRaw.map((lead) => ({
    leadId: lead.id,
    leadName: lead.name,
    productName: lead.product?.name ?? null,
    createdAt: lead.createdAt.toISOString(),
    stageName: lead.stage?.name ?? null,
    statusName: lead.status?.name ?? null,
  }));

  return NextResponse.json({
    ok: true,
    data: {
      tasks,
      untouchedLeads,
    },
  });
}
