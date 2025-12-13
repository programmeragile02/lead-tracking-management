import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isPreviewUserAgent(ua: string) {
  const s = (ua || "").toLowerCase();
  return (
    s.includes("facebookexternalhit") ||
    s.includes("telegrambot") ||
    s.includes("twitterbot") ||
    s.includes("discordbot") ||
    s.includes("slackbot") ||
    s.includes("preview") ||
    s.includes("bot")
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ key: string }> }
) {
  const { key } = await ctx.params;

  // "<slug>-<code>" => code = bagian terakhir
  const parts = String(key || "").split("-");
  const code = parts[parts.length - 1];
  if (!code) {
    return NextResponse.json(
      { ok: false, error: "invalid_link" },
      { status: 400 }
    );
  }

  const link = await prisma.leadTrackedLink.findUnique({
    where: { code },
    select: {
      id: true,
      targetUrl: true,
      leadId: true,
      salesId: true,
    },
  });

  if (!link) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  }

  const ua = req.headers.get("user-agent") || "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const isPreview = req.method === "HEAD" || isPreviewUserAgent(ua);

  // Anti dobel klik:
  // unique(linkId, leadId) => kalau sudah pernah klik, tidak bikin row baru
  await prisma.leadTrackedLinkClick.upsert({
    where: {
      linkId_leadId: { linkId: link.id, leadId: link.leadId },
    },
    create: {
      linkId: link.id,
      leadId: link.leadId,
      salesId: link.salesId,
      clickedAt: new Date(),
      ip: ip ? String(ip).slice(0, 64) : null,
      userAgent: ua ? String(ua).slice(0, 300) : null,
      isPreview,
    } as any,
    update: {
      // mau “klik pertama saja” => update kosong (biar clickedAt tetap pertama)
      // kalau kamu mau set isPreview=false saat klik real terjadi:
      // ...(isPreview ? {} : { isPreview: false }),
    } as any,
  });

  return NextResponse.redirect(link.targetUrl, 302);
}
