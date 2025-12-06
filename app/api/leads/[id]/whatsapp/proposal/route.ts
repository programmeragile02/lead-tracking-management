import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { sendWaDocument } from "@/lib/whatsapp-service";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid lead id" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string | null) || "";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { ok: false, error: "File harus PDF" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Maksimal 5MB" },
        { status: 400 }
      );
    }

    // ambil lead & no WA
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { phone: true, id: true },
    });

    if (!lead || !lead.phone) {
      return NextResponse.json(
        { ok: false, error: "Lead tidak punya nomor WhatsApp" },
        { status: 400 }
      );
    }

    const toNumber = lead.phone.replace(/[^0-9]/g, ""); // normalisasi simpel

    // simpan file ke disk (public/uploads/proposals)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = ".pdf";
    const fileName = `proposal-${leadId}-${randomUUID()}${ext}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "proposals"
    );

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);
    const stat = await fs.stat(filePath);
    console.log("[PROPOSAL] saved:", filePath, "size =", stat.size);

    const publicUrl = `/uploads/proposals/${fileName}`;
    const baseUrl = process.env.APP_PUBLIC_BASE_URL || "http://localhost:3015";
    const absoluteUrl = new URL(publicUrl, baseUrl).toString();

    // kirim ke WA (user.id = pemilik client)
    const waResult = await sendWaDocument({
      userId: user.id,
      to: toNumber,
      fileUrl: absoluteUrl,
      fileName,
      mimetype: "application/pdf",
      caption,
    });

    // catat di lead_messages
    await prisma.leadMessage.create({
      data: {
        leadId,
        salesId: user.id,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        waMessageId: waResult.waMessageId,
        waChatId: null,
        fromNumber: null,
        toNumber: toNumber,
        content: caption,
        type: "MEDIA",
        mediaUrl: publicUrl,
        mediaName: fileName,
        mediaMime: "application/pdf",
      },
    });

    // catat aktivitas
    await prisma.leadActivity.create({
      data: {
        leadId,
        title: "Kirim proposal via WhatsApp",
        description: caption
          ? `Proposal: ${fileName}\nCatatan: ${caption}`
          : `Proposal: ${fileName}`,
        happenedAt: new Date(),
        photoUrl: null,
        createdById: user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/leads/[id]/whatsapp/proposal error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
