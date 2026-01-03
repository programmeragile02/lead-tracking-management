import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { gemini } from "@/lib/gemini";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// JSON Schema sederhana (boleh kamu perluas)
const responseJsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    leadIntent: { type: "string" },
    objections: { type: "array", items: { type: "string" } },
    missingInfo: { type: "array", items: { type: "string" } },
    nextActions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
        },
        required: ["title", "detail", "priority"],
      },
    },
    suggestedReplies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tone: {
            type: "string",
            enum: ["FRIENDLY", "PROFESSIONAL", "CLOSING"],
          },
          text: { type: "string" },
        },
        required: ["tone", "text"],
      },
    },
    statusHint: { type: "string", enum: ["COLD", "WARM", "HOT", "UNKNOWN"] },
  },
  required: [
    "summary",
    "leadIntent",
    "nextActions",
    "suggestedReplies",
    "statusHint",
  ],
};

export async function GET(
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
      { ok: false, error: "Lead ID tidak valid" },
      { status: 400 }
    );
  }

  /**
   * OPTIONAL (RECOMMENDED)
   * Cek hak akses ke lead:
   * - SALES → hanya lead miliknya
   * - selain SALES → bebas
   */
  if (user.roleCode === "SALES") {
    const ownLead = await prisma.lead.findFirst({
      where: { id: leadId, salesId: user.id, isExcluded: false },
      select: { id: true },
    });

    if (!ownLead) {
      return NextResponse.json(
        { ok: false, error: "Tidak punya akses ke lead ini" },
        { status: 403 }
      );
    }
  }

  // Ambil cache terbaru
  const latestInsight = await prisma.leadAIInsight.findFirst({
    where: {
      leadId,
      type: "WHATSAPP_ANALYSIS",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestInsight) {
    return NextResponse.json({
      ok: true,
      data: null,
      cached: false,
      note: "Belum ada analisis AI",
    });
  }

  return NextResponse.json({
    ok: true,
    data: latestInsight.payload,
    cached: true,
    meta: {
      model: latestInsight.model,
      createdAt: latestInsight.createdAt,
      messageCount: latestInsight.messageCount,
    },
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user)
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
  const limit = Math.min(Math.max(Number(body?.limit ?? 60), 10), 120);

  // 1) Ambil N pesan terakhir (urut asc biar natural)
  const lastMessages = await prisma.leadMessage.findMany({
    where: { leadId, channel: "WHATSAPP" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, direction: true, content: true, createdAt: true },
  });

  if (lastMessages.length === 0) {
    return NextResponse.json({
      ok: true,
      data: null,
      note: "Belum ada chat WhatsApp.",
    });
  }

  // reverse jadi asc
  const messages = [...lastMessages].reverse();
  const newestId = messages[messages.length - 1].id;

  // 2) CACHE CHECK: kalau insight terakhir masih untuk newestId yang sama, return cache
  const latestInsight = await prisma.leadAIInsight.findFirst({
    where: { leadId, type: "WHATSAPP_ANALYSIS" },
    orderBy: { createdAt: "desc" },
  });

  if (
    latestInsight?.lastMessageId === newestId &&
    latestInsight?.messageCount === messages.length
  ) {
    return NextResponse.json({
      ok: true,
      data: latestInsight.payload,
      cached: true,
    });
  }

  // 3) Susun transcript
  const transcript = messages
    .map((m) => {
      const who = m.direction === "INBOUND" ? "LEAD" : "SALES";
      return `[${who}] ${m.content}`;
    })
    .join("\n");

  // 4) Prompt
  const prompt = `
Kamu adalah AI Sales Coach untuk aplikasi Lead Tracking.
Tugasmu: analisis percakapan WhatsApp di bawah, lalu keluarkan JSON sesuai schema.

Fokus:
- Ringkas pembahasan
- Deteksi intent lead (mis: tanya harga, minta demo, nego, keberatan)
- Sebutkan objections & info yang masih kurang
- Berikan 3-7 next actions yang konkret (dengan prioritas)
- Buat 3 draft balasan WA (friendly/professional/closing), bahasa Indonesia, singkat, sopan.

Percakapan:
${transcript}
`.trim();

  // 5) Call Gemini (Structured Output)
  const res = await gemini.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema,
    },
  });

  const jsonText = res.text;
  let data: any;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      { ok: false, error: "AI mengembalikan format non-JSON", raw: jsonText },
      { status: 502 }
    );
  }

  // 6) Simpan cache
  await prisma.leadAIInsight.create({
    data: {
      leadId,
      requestedById: user.id,
      type: "WHATSAPP_ANALYSIS",
      lastMessageId: newestId,
      messageCount: messages.length,
      model: MODEL,
      payload: data,
    },
  });

  return NextResponse.json({ ok: true, data, cached: false });
}
