import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const leadId = Number(id);

  const notes = await prisma.leadNote.findMany({
    where: {
      leadId,
      OR: [
        { isPrivate: false },
        { authorId: user.id }, // boleh lihat catatan sendiri
      ],
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, data: notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { content, isPrivate } = body;

  if (!content || !content.trim()) {
    return NextResponse.json(
      { ok: false, error: "Catatan tidak boleh kosong" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const note = await prisma.leadNote.create({
    data: {
      leadId: Number(id),
      authorId: user.id,
      content: content.trim(),
      isPrivate: Boolean(isPrivate),
    },
  });

  return NextResponse.json({ ok: true, data: note });
}
