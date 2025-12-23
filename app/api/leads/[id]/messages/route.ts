import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { canAccessLead } from "@/lib/lead-access";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_id" },
      { status: 400 }
    );
  }

  // === ambil lead + sales + TL ===
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      sales: {
        select: {
          id: true,
          teamLeaderId: true,
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found" },
      { status: 404 }
    );
  }

  // === GUARD HIRARKI ===
  if (!canAccessLead(user, lead)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  // === AMBIL PESAN + AUDIT INFO ===
  const messages = await prisma.leadMessage.findMany({
    where: {
      leadId,
      channel: "WHATSAPP",
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      content: true,
      direction: true,
      createdAt: true,
      sentAt: true,
      deliveredAt: true,
      readAt: true,
      waStatus: true,

      type: true,
      mediaUrl: true,
      mediaName: true,
      mediaMime: true,

      // AUDIT
      sentByRole: true,
      sentBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, data: messages });
}
