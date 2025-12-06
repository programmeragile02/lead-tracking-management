import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { FollowUpChannel } from "@prisma/client";

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

    // Cari tipe follow up berdasar code (FU1/FU2/FU3/dsb)
    const fuType = await prisma.leadFollowUpType.findUnique({
      where: { code: typeCode },
    });

    if (!fuType) {
      return NextResponse.json(
        { ok: false, error: "Tipe follow up tidak ditemukan" },
        { status: 400 }
      );
    }

    // Parse jadwal → nextActionAt
    // diasumsikan date+time adalah waktu lokal server
    const nextActionAt = new Date(`${date}T${time}:00`);

    const created = await prisma.leadFollowUp.create({
      data: {
        leadId,
        salesId: user.id,
        typeId: fuType.id,
        note: note || null,
        channel: mapChannelUiToDb(channel),
        // saat ini kita treat sebagai "follow up dijadwalkan sekarang"
        doneAt: new Date(),
        nextActionAt,
      },
      include: {
        type: true,
        sales: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: created.id,
        typeId: created.typeId,
        typeCode: created.type?.code,
        typeName: created.type?.name,
        channel: created.channel,
        note: created.note,
        doneAt: created.doneAt,
        nextActionAt: created.nextActionAt,
        createdAt: created.createdAt,
        sales: created.sales
          ? { id: created.sales.id, name: created.sales.name }
          : null,
      },
    });
  } catch (err) {
    console.error("POST followups error:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan tindak lanjut" },
      { status: 500 }
    );
  }
}
