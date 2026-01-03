import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = Number(id);
  const { note } = await req.json();

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { phone: true, salesId: true, name: true, isExcluded: true },
  });

  if (!lead || !lead.phone || lead.isExcluded)
    return NextResponse.json({ error: "Lead tidak valid" }, { status: 404 });

  // hanya sales / TL / manager
  if (!["sales", "team-leader", "manager"].includes(user.roleSlug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.salesExcludedContact.upsert({
      where: {
        salesId_phone: {
          salesId: lead.salesId!,
          phone: lead.phone,
        },
      },
      update: {
        note,
        isActive: true,
      },
      create: {
        salesId: lead.salesId!,
        phone: lead.phone,
        name: lead.name,
        isActive: true,
        note,
      },
    }),

    prisma.lead.update({
      where: { id: leadId },
      data: { isExcluded: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
