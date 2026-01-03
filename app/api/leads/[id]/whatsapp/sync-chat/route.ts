import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { ensureWaClient, fetchWaHistory } from "@/lib/whatsapp-service";
import {
  LeadMessageChannel,
  MessageDirection,
  LeadMessageType,
} from "@prisma/client";

function normalize62(phone: string) {
  const d = String(phone || "").replace(/[^\d]/g, "");
  if (!d) return "";
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("62")) return d;
  return d;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser(req);
    if (!me)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    const { id } = await ctx.params;
    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "Lead ID tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const limit = Number(body?.limit ?? 200);

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, phone: true, salesId: true, isExcluded: true },
    });
    if (!lead || lead.isExcluded)
      return NextResponse.json(
        { ok: false, error: "Lead tidak ditemukan" },
        { status: 404 }
      );
    if (!lead.phone)
      return NextResponse.json(
        { ok: false, error: "Lead belum punya nomor HP" },
        { status: 400 }
      );

    const peer = normalize62(lead.phone);
    if (!peer)
      return NextResponse.json(
        { ok: false, error: "Nomor HP tidak valid" },
        { status: 400 }
      );

    // pilih WA client pemilik percakapan:
    // ideal: lead.salesId (owner lead), fallback: user yang klik tombol
    const waUserId = lead.salesId ?? me.id;

    // pastikan client jalan
    await ensureWaClient(waUserId);

    const hist = await fetchWaHistory({ userId: waUserId, peer, limit });
    const messages = hist.data.messages || [];

    let inserted = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const m of messages) {
        const session = await prisma.whatsAppSession.findUnique({
          where: { userId: waUserId },
          select: { phoneNumber: true },
        });

        const myNumber = session?.phoneNumber;
        const fromDigits = (m.from || "").replace(/[^\d]/g, "");

        if (!myNumber) {
          console.warn("[WA] myNumber kosong, skip message", m.waMessageId);
          continue;
        }

        const direction = m.fromMe
          ? MessageDirection.OUTBOUND
          : MessageDirection.INBOUND;

        // fromNumber / toNumber: simpan angka saja biar konsisten
        let fromNumber: string | null = null;
        let toNumber: string | null = null;

        if (m.fromMe) {
          // pesan dikirim oleh SALES
          fromNumber = myNumber;
          toNumber = (m.to || "").replace(/[^\d]/g, "");
        } else {
          // pesan dari LEAD
          fromNumber = (m.from || "").replace(/[^\d]/g, "");
          toNumber = myNumber;
        }

        try {
          await tx.leadMessage.create({
            data: {
              leadId,
              salesId: waUserId,
              channel: LeadMessageChannel.WHATSAPP,
              direction,
              waMessageId: m.waMessageId,
              waChatId: m.waChatId,
              fromNumber,
              toNumber,
              content: m.body || "",
              type: LeadMessageType.TEXT,
              createdAt: new Date(m.timestamp * 1000),
            },
          });
          inserted++;
        } catch {
          // duplicate waMessageId -> skip
          skipped++;
        }
      }
    });

    return NextResponse.json({
      ok: true,
      data: {
        inserted,
        skipped,
        fetched: messages.length,
        note: hist.data.note || null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
