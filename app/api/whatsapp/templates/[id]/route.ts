import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function canManageGlobal(roleCode?: string | null) {
  return roleCode === "MANAGER";
}

export async function PATCH(
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

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "picker";

    const { id } = await ctx.params;
    const tid = Number(id);
    if (!tid || Number.isNaN(tid)) {
      return NextResponse.json(
        { ok: false, error: "ID tidak valid" },
        { status: 400 }
      );
    }

    const tpl = await prisma.whatsAppMessageTemplate.findUnique({
      where: { id: tid },
    });
    if (!tpl || tpl.deletedAt) {
      return NextResponse.json(
        { ok: false, error: "Template tidak ditemukan" },
        { status: 404 }
      );
    }

    const payload = await req.json();

    // ========= GLOBAL ADMIN =========
    if (mode === "global_admin") {
      if (!canManageGlobal(user.roleCode)) {
        return NextResponse.json(
          { ok: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      if (tpl.scope !== "GLOBAL") {
        return NextResponse.json(
          { ok: false, error: "Bukan template global" },
          { status: 400 }
        );
      }

      const updated = await prisma.whatsAppMessageTemplate.update({
        where: { id: tid },
        data: {
          title: payload?.title ? String(payload.title).trim() : tpl.title,
          body: payload?.body ? String(payload.body).trim() : tpl.body,
          mediaUrl: payload?.mediaUrl ?? tpl.mediaUrl,
          category: payload?.category ?? tpl.category,
          tags: payload?.tags ?? tpl.tags,
          isActive:
            typeof payload?.isActive === "boolean"
              ? payload.isActive
              : tpl.isActive,
        },
      });

      return NextResponse.json({ ok: true, data: updated });
    }

    // ========= SALES: only scope USER miliknya =========
    if (tpl.scope !== "USER" || tpl.ownerId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const updated = await prisma.whatsAppMessageTemplate.update({
      where: { id: tid },
      data: {
        title: payload?.title ? String(payload.title).trim() : tpl.title,
        body: payload?.body ? String(payload.body).trim() : tpl.body,
        mediaUrl: payload?.mediaUrl ?? tpl.mediaUrl,
        category: payload?.category ?? tpl.category,
        tags: payload?.tags ?? tpl.tags,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "picker";

    const { id } = await ctx.params;
    const tid = Number(id);
    if (!tid || Number.isNaN(tid)) {
      return NextResponse.json(
        { ok: false, error: "ID tidak valid" },
        { status: 400 }
      );
    }

    const tpl = await prisma.whatsAppMessageTemplate.findUnique({
      where: { id: tid },
    });
    if (!tpl || tpl.deletedAt) {
      return NextResponse.json(
        { ok: false, error: "Template tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus GLOBAL hanya via global_admin + manager
    if (mode === "global_admin") {
      if (!canManageGlobal(user.roleCode)) {
        return NextResponse.json(
          { ok: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      if (tpl.scope !== "GLOBAL") {
        return NextResponse.json(
          { ok: false, error: "Bukan template global" },
          { status: 400 }
        );
      }

      await prisma.whatsAppMessageTemplate.update({
        where: { id: tid },
        data: { deletedAt: new Date(), isActive: false },
      });

      return NextResponse.json({ ok: true });
    }

    // Sales delete: hanya USER miliknya (opsional)
    if (tpl.scope !== "USER" || tpl.ownerId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.whatsAppMessageTemplate.update({
      where: { id: tid },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
