import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { ensureWaClient } from "@/lib/whatsapp-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid lead id" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, salesId: true },
  });

  if (!lead || !lead.salesId) {
    return NextResponse.json(
      { ok: false, error: "Lead has no sales assigned" },
      { status: 400 }
    );
  }

  // 🔐 AUTHZ
  if (user.roleSlug === "sales" && user.id !== lead.salesId) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    // ⭐ START WA CLIENT MILIK SALES
    await ensureWaClient(lead.salesId);

    return NextResponse.json({
      ok: true,
      salesId: lead.salesId,
      message: "WhatsApp client starting for sales",
    });
  } catch (err: any) {
    console.error("[WA START ERROR]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to start WhatsApp client",
      },
      { status: 500 }
    );
  }
}
