import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id, noteId } = await params;
  const leadId = Number(id);
  const noteIdNum = Number(noteId);

  const body = await req.json();
  const { content, isPrivate } = body;

  if (!content || !content.trim()) {
    return NextResponse.json(
      { ok: false, error: "Catatan tidak boleh kosong" },
      { status: 400 }
    );
  }

  // Ambil note dulu untuk validasi kepemilikan
  const note = await prisma.leadNote.findUnique({
    where: { id: noteIdNum },
  });

  if (!note || note.leadId !== leadId) {
    return NextResponse.json(
      { ok: false, error: "Catatan tidak ditemukan" },
      { status: 404 }
    );
  }

  // Hanya author atau role tertentu (opsional)
  if (note.authorId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Tidak punya izin mengubah catatan ini" },
      { status: 403 }
    );
  }

  const updated = await prisma.leadNote.update({
    where: { id: noteIdNum },
    data: {
      content: content.trim(),
      isPrivate: Boolean(isPrivate),
    },
  });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id, noteId } = await params;
  const leadId = Number(id);
  const noteIdNum = Number(noteId);

  const note = await prisma.leadNote.findUnique({
    where: { id: noteIdNum },
  });

  if (!note || note.leadId !== leadId) {
    return NextResponse.json(
      { ok: false, error: "Catatan tidak ditemukan" },
      { status: 404 }
    );
  }

  // hanya pembuat atau manager boleh hapus
  if (note.authorId !== user.id && user.roleCode !== "MANAGER") {
    return NextResponse.json(
      { ok: false, error: "Tidak punya izin menghapus catatan ini" },
      { status: 403 }
    );
  }

  await prisma.leadNote.delete({
    where: { id: noteIdNum },
  });

  return NextResponse.json({ ok: true });
}
