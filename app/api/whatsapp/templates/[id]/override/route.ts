import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

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
    const globalId = Number(id);
    if (!globalId || Number.isNaN(globalId)) {
      return NextResponse.json(
        { ok: false, error: "Global ID tidak valid" },
        { status: 400 }
      );
    }

    const global = await prisma.whatsAppMessageTemplate.findFirst({
      where: { id: globalId, scope: "GLOBAL", deletedAt: null },
    });
    if (!global) {
      return NextResponse.json(
        { ok: false, error: "Template global tidak ditemukan" },
        { status: 404 }
      );
    }

    const existing = await prisma.whatsAppMessageTemplate.findFirst({
      where: {
        scope: "USER",
        ownerId: user.id,
        parentId: globalId,
        deletedAt: null,
      },
    });

    if (existing) return NextResponse.json({ ok: true, data: existing });

    const created = await prisma.whatsAppMessageTemplate.create({
      data: {
        scope: "USER",
        ownerId: user.id,
        parentId: globalId,
        title: global.title,
        body: global.body,
        mediaUrl: global.mediaUrl,
        category: global.category,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
