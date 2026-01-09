import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function canManageGlobal(roleCode?: string | null) {
  return roleCode === "SUPERADMIN";
}

export async function GET(req: NextRequest) {
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

    // =========================
    // MODE: GLOBAL ADMIN (Superadmin)
    // =========================
    if (mode === "global_admin") {
      if (!canManageGlobal(user.roleCode)) {
        return NextResponse.json(
          { ok: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const q = (url.searchParams.get("q") || "").trim().toLowerCase();
      const includeInactive = url.searchParams.get("includeInactive") === "1";

      const list = await prisma.whatsAppMessageTemplate.findMany({
        where: {
          scope: "GLOBAL",
          deletedAt: null,
          ...(includeInactive ? {} : { isActive: true }),
          ...(q
            ? {
                OR: [
                  { title: { contains: q } },
                  { body: { contains: q } },
                  { category: { contains: q } },
                ],
              }
            : {}),
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
      });

      return NextResponse.json({ ok: true, data: list });
    }

    // =========================
    // MODE: PICKER (Sales)
    // =========================
    if (mode !== "picker") {
      return NextResponse.json(
        { ok: false, error: "Mode tidak dikenal" },
        { status: 400 }
      );
    }

    const [globals, mine] = await Promise.all([
      prisma.whatsAppMessageTemplate.findMany({
        where: { scope: "GLOBAL", isActive: true, deletedAt: null },
        orderBy: [{ category: "asc" }, { title: "asc" }],
      }),
      prisma.whatsAppMessageTemplate.findMany({
        where: {
          scope: "USER",
          ownerId: user.id,
          isActive: true,
          deletedAt: null,
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
      }),
    ]);

    // Map override by parentId
    const overrideByParentId = new Map<number, any>();
    for (const t of mine) {
      if (t.parentId) overrideByParentId.set(t.parentId, t);
    }

    // 1) Global asli selalu ditampilkan
    const globalOriginals = globals.map((g) => ({
      id: g.id,
      title: g.title,
      body: g.body,
      mediaUrl: g.mediaUrl,
      category: g.category,
      source: "GLOBAL" as const,
      parentId: null,
      globalId: g.id,
      hasOverride: overrideByParentId.has(g.id),
      overrideId: overrideByParentId.get(g.id)?.id ?? null,
    }));

    // 2) Override user (turunan global) juga ditampilkan (opsional)
    const myOverrides = [...overrideByParentId.entries()].map(
      ([parentId, ov]) => ({
        id: ov.id,
        title: ov.title,
        body: ov.body,
        mediaUrl: ov.mediaUrl,
        category: ov.category,
        source: "MY_TEMPLATE" as const,
        parentId: parentId,
        globalId: parentId,
      })
    );

    // 3) Custom user template (parentId null)
    const customMine = mine
      .filter((t) => !t.parentId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        body: t.body,
        mediaUrl: t.mediaUrl,
        category: t.category,
        source: "MY_TEMPLATE" as const,
        parentId: null,
        globalId: null,
      }));

    return NextResponse.json({
      ok: true,
      data: [
        ...globalOriginals, // Global dulu
        ...myOverrides, // Override (optional)
        ...customMine, // Template user sendiri
      ],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const payload = await req.json();
    const title = String(payload?.title || "").trim();
    const body = String(payload?.body || "").trim();

    if (!title || !body) {
      return NextResponse.json(
        { ok: false, error: "Judul & isi wajib diisi" },
        { status: 400 }
      );
    }

    // CREATE GLOBAL (Superadmin)
    if (mode === "global_admin") {
      if (!canManageGlobal(user.roleCode)) {
        return NextResponse.json(
          { ok: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const created = await prisma.whatsAppMessageTemplate.create({
        data: {
          scope: "GLOBAL",
          ownerId: null,
          parentId: null,
          title,
          body,
          mediaUrl: payload?.mediaUrl ?? null,
          category: payload?.category ?? null,
          tags: payload?.tags ?? null,
          isActive:
            typeof payload?.isActive === "boolean" ? payload.isActive : true,
        },
      });

      return NextResponse.json({ ok: true, data: created });
    }

    // CREATE USER TEMPLATE (Sales)
    const created = await prisma.whatsAppMessageTemplate.create({
      data: {
        scope: "USER",
        ownerId: user.id,
        parentId: null,
        title,
        body,
        mediaUrl: payload?.mediaUrl ?? null,
        category: payload?.category ?? null,
        tags: payload?.tags ?? null,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
