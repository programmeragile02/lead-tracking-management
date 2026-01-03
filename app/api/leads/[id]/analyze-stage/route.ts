import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type StageRule = {
  next: string;
  keywords: string[];
};

const STAGE_RULES: Record<string, StageRule> = {
  KONTAK_AWAL: {
    next: "KUNJUNGAN_ATAU_ZOOM",
    keywords: [
      "meeting",
      "zoom",
      "presentasi",
      "tanya",
      "info",
      "berminat",
      "detail",
    ],
  },
  KUNJUNGAN_ATAU_ZOOM: {
    next: "PENAWARAN",
    keywords: ["harga", "penawaran"],
  },
  PENAWARAN: {
    next: "NEGOSIASI",
    keywords: ["diskon", "nego", "negoisasi"],
  },
  NEGOSIASI: {
    next: "KESEPAKATAN",
    keywords: ["deal", "setuju", "oke", "lanjut"],
  },
  KESEPAKATAN: {
    next: "PEMBAYARAN",
    keywords: ["transfer", "invoice", "bayar"],
  },
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!leadId)
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });

  // Ambil lead + stage + pesan terakhir
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      stage: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!lead || !lead.stage || lead.isExcluded) {
    return NextResponse.json({
      error: "Lead or stage not found",
    });
  }

  const currentStageCode = lead.stage.code;
  const rule = STAGE_RULES[currentStageCode];

  if (!rule) {
    return NextResponse.json({
      currentStage: currentStageCode,
      suggestion: null,
      message: "Tidak ada rule untuk tahap ini",
    });
  }

  const combinedText = lead.messages
    .filter((m) => m.direction === "INBOUND")
    .map((m) => {
      if (m.content) return m.content.toLowerCase();
      if ((m as any).text) return (m as any).text.toLowerCase();
      if ((m as any).body) return (m as any).body.toLowerCase();
      return "";
    })
    .join(" ");

  const matchedKeywords = rule.keywords.filter((k) => combinedText.includes(k));

  const confidence = Math.min(1, matchedKeywords.length / rule.keywords.length);

  const result = {
    currentStage: currentStageCode,
    suggestedStage: matchedKeywords.length > 0 ? rule.next : currentStageCode,
    confidence,
    reasons:
      matchedKeywords.length > 0
        ? matchedKeywords.map((k) => `Terdeteksi kata "${k}"`)
        : ["Belum ditemukan sinyal kuat untuk berpindah tahap"],
  };

  console.log("=== ANALYSIS DEBUG ===");
  console.log("Text:", combinedText);
  console.log("Keywords:", rule.keywords);
  console.log("Matched:", matchedKeywords);

  return NextResponse.json(result);
}
