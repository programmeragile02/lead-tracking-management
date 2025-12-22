import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { normalizeWaNumber } from "@/lib/normalize-wa";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const item = await prisma.salesExcludedContact.findFirst({
    where: {
      id: Number(id),
      salesId: user.id,
    },
  });

  if (!item) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: item });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const phone = body.phone ? normalizeWaNumber(body.phone) : undefined;

  try {
    const updated = await prisma.salesExcludedContact.updateMany({
      where: {
        id: Number(id),
        salesId: user.id,
      },
      data: {
        ...(phone ? { phone } : {}),
        ...(body.name !== undefined ? { name: body.name?.trim() || null } : {}),
        ...(body.note !== undefined ? { note: body.note?.trim() || null } : {}),
        ...(body.isActive !== undefined ? { isActive: !!body.isActive } : {}),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "phone_already_exists" },
        { status: 409 }
      );
    }

    console.error("[excluded-contact:update]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const deleted = await prisma.salesExcludedContact.updateMany({
    where: {
      id: Number(id),
      salesId: user.id,
    },
    data: {
      isActive: false,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
