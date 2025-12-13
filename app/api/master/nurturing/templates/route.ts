import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingTemplateSlot } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));

  const topicId = Number(body?.topicId);
  const slot = String(body?.slot ?? "").toUpperCase();
  const waTemplateTitle = body?.waTemplateTitle
    ? String(body.waTemplateTitle)
    : null;
  const waTemplateBody = body?.waTemplateBody
    ? String(body.waTemplateBody)
    : null; // nullable
  const waTemplateMedia = body?.waTemplateMedia
    ? String(body.waTemplateMedia)
    : null;
  const isActive = body?.isActive === false ? false : true;

  if (!topicId)
    return NextResponse.json(
      { ok: false, error: "topicId wajib" },
      { status: 400 }
    );
  if (slot !== "A" && slot !== "B")
    return NextResponse.json(
      { ok: false, error: "slot harus A/B" },
      { status: 400 }
    );

  // upsert biar gampang edit (topic+slot unique)
  const saved = await prisma.nurturingTemplate.upsert({
    where: { topicId_slot: { topicId, slot: slot as NurturingTemplateSlot } },
    create: {
      topicId,
      slot: slot as NurturingTemplateSlot,
      waTemplateTitle,
      waTemplateBody,
      waTemplateMedia,
      isActive,
    },
    update: { waTemplateTitle, waTemplateBody, waTemplateMedia, isActive },
  });

  return NextResponse.json({ ok: true, data: saved });
}
