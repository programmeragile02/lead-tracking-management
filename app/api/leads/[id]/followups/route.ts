import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import {
  FollowUpChannel,
  NurturingPauseReason,
  NurturingStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
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
        { ok: false, error: "Lead ID tidak valid" },
        { status: 400 }
      );
    }

    // optional: proteksi (sales hanya lead miliknya)
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, salesId: true, isExcluded: true },
    });
    if (!lead || lead.isExcluded) {
      return NextResponse.json(
        { ok: false, error: "Lead tidak ditemukan" },
        { status: 404 }
      );
    }
    if (user.roleSlug === "sales" && lead.salesId && lead.salesId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const followUps = await prisma.leadFollowUp.findMany({
      where: { leadId },
      include: {
        type: true,
        sales: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = followUps.map((f) => ({
      id: f.id,
      typeId: f.typeId,
      typeCode: f.type?.code || null,
      typeName: f.type?.name || null,
      channel: f.channel,
      note: f.note,
      doneAt: f.doneAt,
      nextActionAt: f.nextActionAt,
      createdAt: f.createdAt,
      sales: f.sales ? { id: f.sales.id, name: f.sales.name } : null,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET followups error:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat histori tindak lanjut" },
      { status: 500 }
    );
  }
}

type PostBody = {
  typeCode: string; // "FU1" / "FU2" / "KIRIM_PROPOSAL" dsb
  date: string; // "2025-12-06"
  time: string; // "14:30"
  channel: "wa" | "call" | "zoom" | "visit";
  note?: string;
};

function mapChannelUiToDb(ch: PostBody["channel"]): FollowUpChannel {
  switch (ch) {
    case "call":
      return "CALL";
    case "zoom":
      return "ZOOM";
    case "visit":
      return "VISIT";
    case "wa":
    default:
      return "WHATSAPP";
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
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
        { ok: false, error: "Lead ID tidak valid" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as PostBody | null;
    const typeCode = body?.typeCode?.trim();
    const date = body?.date?.trim();
    const time = body?.time?.trim();
    const channel = body?.channel;
    const note = body?.note;

    if (!typeCode || !date || !channel) {
      return NextResponse.json(
        { ok: false, error: "Data tindak lanjut belum lengkap" },
        { status: 400 }
      );
    }

    // parse jadwal
    // Simpan sebagai tanggal saja (jam 00:00 lokal)
    const nextActionAt = new Date(date);
    nextActionAt.setHours(0, 0, 0, 0);
    if (Number.isNaN(nextActionAt.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    const now = new Date();
    const channelDb = mapChannelUiToDb(channel);

    const result = await prisma.$transaction(async (tx) => {
      // 1) cek lead + guard hak akses
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: { id: true, salesId: true, statusId: true },
      });
      if (!lead) throw new Error("LEAD_NOT_FOUND");

      if (
        user.roleSlug === "sales" &&
        lead.salesId &&
        lead.salesId !== user.id
      ) {
        throw new Error("FORBIDDEN_LEAD");
      }

      // 2) cari tipe follow up
      const fuType = await tx.leadFollowUpType.findUnique({
        where: { code: typeCode },
        select: { id: true, code: true, name: true, isActive: true },
      });
      if (!fuType || !fuType.isActive) throw new Error("FU_TYPE_NOT_FOUND");

      // 3) GUARD anti dobel: cek follow up yang sama dalam window 10 detik terakhir
      const tenSecondsAgo = new Date(now.getTime() - 10_000);

      const existingSame = await tx.leadFollowUp.findFirst({
        where: {
          leadId,
          salesId: user.id,
          typeId: fuType.id,
          channel: channelDb,
          nextActionAt,
          createdAt: { gte: tenSecondsAgo },
        },
        include: {
          type: true,
          sales: { select: { id: true, name: true } },
        },
      });

      if (existingSame) {
        return { created: existingSame, deduped: true };
      }

      // 4) create follow up
      const created = await tx.leadFollowUp.create({
        data: {
          leadId,
          salesId: user.id,
          typeId: fuType.id,
          note: note?.trim() ? note.trim() : null,
          channel: channelDb,
          nextActionAt,
        },
        include: {
          type: true,
          sales: { select: { id: true, name: true } },
        },
      });

      // 5) update lead:
      // - status jadi WARM (kalau ada)
      // - nurturing PAUSED (di LeadNurturingState)
      const warm = await tx.leadStatus.findFirst({
        where: {
          isActive: true,
          OR: [{ code: "WARM" }, { name: { equals: "Warm" } }],
        },
        orderBy: { order: "asc" },
      });

      // ====== (A) Update status lead → WARM (guarded) ======
      if (warm?.id && lead.statusId !== warm.id) {
        await tx.lead.update({
          where: { id: leadId },
          data: { statusId: warm.id },
        });

        await tx.leadStatusHistory.create({
          data: {
            leadId,
            statusId: warm.id,
            changedById: user.id,
            salesId: lead.salesId ?? user.id,
            note: `Auto set status WARM karena membuat tindak lanjut (${fuType.code}).`,
          },
        });
      }

      // ====== (B) CHANGED: Pause nurturing state ======
      await tx.leadNurturingState.upsert({
        where: { leadId },
        create: {
          leadId,
          status: NurturingStatus.PAUSED,
          manualPaused: false,
          pauseReason: NurturingPauseReason.SALES_FOLLOWUP,
          pausedAt: now,
          nextSendAt: null, // stop dulu sampai auto-resume jalan
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

      // (opsional) activity log
      await tx.leadActivity.create({
        data: {
          leadId,
          title: "Tindak lanjut dibuat",
          description: `Tipe: ${
            fuType.name || fuType.code
          }\nChannel: ${channelDb}\nJadwal: ${nextActionAt.toISOString()}${
            note?.trim() ? `\n\nCatatan: ${note.trim()}` : ""
          }`,
          happenedAt: now,
          createdById: user.id,
        },
      });

      return { created, deduped: false };
    });

    const f = result.created;

    return NextResponse.json({
      ok: true,
      deduped: result.deduped,
      data: {
        id: f.id,
        typeId: f.typeId,
        typeCode: f.type?.code || null,
        typeName: f.type?.name || null,
        channel: f.channel,
        note: f.note,
        doneAt: f.doneAt,
        nextActionAt: f.nextActionAt,
        createdAt: f.createdAt,
        sales: f.sales ? { id: f.sales.id, name: f.sales.name } : null,
      },
    });
  } catch (err: any) {
    if (err instanceof Error) {
      if (err.message === "LEAD_NOT_FOUND") {
        return NextResponse.json(
          { ok: false, error: "Lead tidak ditemukan" },
          { status: 404 }
        );
      }
      if (err.message === "FORBIDDEN_LEAD") {
        return NextResponse.json(
          { ok: false, error: "Tidak boleh mengubah lead ini" },
          { status: 403 }
        );
      }
      if (err.message === "FU_TYPE_NOT_FOUND") {
        return NextResponse.json(
          { ok: false, error: "Tipe follow up tidak ditemukan" },
          { status: 400 }
        );
      }
    }

    console.error("POST followups error:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan tindak lanjut" },
      { status: 500 }
    );
  }
}
