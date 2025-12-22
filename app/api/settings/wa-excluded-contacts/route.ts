import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { normalizeWaNumber } from "@/lib/normalize-wa";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const page = Number(searchParams.get("page") || 1);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
  const skip = (page - 1) * limit;

  const where: any = {
    salesId: user.id,
  };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { note: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.salesExcludedContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.salesExcludedContact.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const phoneRaw = body.phone;
  const phone = normalizeWaNumber(phoneRaw);

  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "phone_required" },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.salesExcludedContact.create({
      data: {
        salesId: user.id,
        phone,
        name: body.name?.trim() || null,
        note: body.note?.trim() || null,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "phone_already_exists" },
        { status: 409 }
      );
    }

    console.error("[excluded-contact:create]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
