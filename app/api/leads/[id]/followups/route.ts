import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { FollowUpChannel, NurturingStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "Lead ID tidak valid" },
        { status: 400 }
      );
    }

    const followUps = await prisma.leadFollowUp.findMany({
      where: { leadId },
      include: {
        type: true,
        sales: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ nextActionAt: "desc" }, { createdAt: "desc" }],
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
  typeCode: string; // "FU1" / "FU2" / "FU3" dsb
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
    const { id } = await ctx.params;
    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "Lead ID tidak valid" },
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

    const body = (await req.json()) as PostBody;
    const { typeCode, date, time, channel, note } = body;

    if (!typeCode || !date || !time || !channel) {
      return NextResponse.json(
        { ok: false, error: "Data tindak lanjut belum lengkap" },
        { status: 400 }
      );
    }

    // Jalankan dalam transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Pastikan lead ada & (opsional) milik sales ini
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          salesId: true,
          nurturingStatus: true,
        },
      });

      if (!lead) {
        throw new Error("LEAD_NOT_FOUND");
      }

      // opsional: kalau mau pastikan hanya owner yg boleh
      if (
        lead.salesId &&
        lead.salesId !== user.id &&
        user.roleSlug === "sales"
      ) {
        throw new Error("FORBIDDEN_LEAD");
      }

      // 2. Cari tipe follow up berdasar code (FU1/FU2/FU3/dsb)
      const fuType = await tx.leadFollowUpType.findUnique({
        where: { code: typeCode },
      });

      if (!fuType) {
        throw new Error("FU_TYPE_NOT_FOUND");
      }

      // 3. Parse jadwal → nextActionAt
      const nextActionAt = new Date(`${date}T${time}:00`);

      // 4. Buat follow up manual (isAutoNurturing default = false)
      const created = await tx.leadFollowUp.create({
        data: {
          leadId,
          salesId: user.id,
          typeId: fuType.id,
          note: note || null,
          channel: mapChannelUiToDb(channel),
          doneAt: new Date(),
          nextActionAt,
          // isAutoNurturing: false ← default dari schema
        },
        include: {
          type: true,
          sales: { select: { id: true, name: true } },
        },
      });

      // 5. PAUSE nurturing utk lead ini (rule: Sales follow-up manual → pause)
      await tx.lead.update({
        where: { id: leadId },
        data: {
          nurturingStatus: NurturingStatus.PAUSED,
          nurturingPausedAt: new Date(),
        },
      });

      return created;
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: result.id,
        typeId: result.typeId,
        typeCode: result.type?.code,
        typeName: result.type?.name,
        channel: result.channel,
        note: result.note,
        doneAt: result.doneAt,
        nextActionAt: result.nextActionAt,
        createdAt: result.createdAt,
        sales: result.sales
          ? { id: result.sales.id, name: result.sales.name }
          : null,
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
