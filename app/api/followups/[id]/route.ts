import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingStatus } from "@prisma/client";

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

  const body = await req.json().catch(() => null);
  const { nextActionAt, note } = body || {};

  if (!nextActionAt) {
    return NextResponse.json(
      { ok: false, error: "nextActionAt is required" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.leadFollowUp.findFirst({
        where: {
          id: followUpId,
          salesId: user.id, // pastikan ini follow up milik sales ini
        },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const oldNext = existing.nextActionAt;
      const newNext = new Date(nextActionAt);

      const updated = await tx.leadFollowUp.update({
        where: { id: followUpId },
        data: {
          nextActionAt: newNext,
          ...(note
            ? {
                note:
                  (existing.note ? existing.note + "\n\n" : "") +
                  `[RESCHEDULE ${new Date().toISOString()}] ${note}`,
              }
            : {}),
        },
      });

      // Catat sebagai LeadActivity
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
      if (note) {
        description += `\n\nAlasan: ${note}`;
      }

      await tx.leadActivity.create({
        data: {
          leadId: existing.leadId,
          title: "Reschedule follow up",
          description,
          happenedAt: new Date(),
          createdById: user.id,
        },
      });

      // Pastikan nurturing tetap PAUSED saat ada reschedule
      await tx.lead.update({
        where: { id: existing.leadId },
        data: {
          nurturingStatus: NurturingStatus.PAUSED,
          nurturingPausedAt: new Date(),
        },
      });

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

    console.error("Reschedule error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to reschedule follow up" },
      { status: 500 }
    );
  }
}
