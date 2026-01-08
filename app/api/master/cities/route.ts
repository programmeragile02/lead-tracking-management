import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (user.roleCode !== "MANAGER") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 20);
  const provinceId = searchParams.get("provinceId");
  const type = searchParams.get("type");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const where: any = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(provinceId ? { provinceId: Number(provinceId) } : {}),
    ...(type ? { type } : {}),
    ...(q
      ? {
          OR: [{ name: { contains: q } }, { code: { contains: q } }],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.city.count({ where }),
    prisma.city.findMany({
      where,
      include: {
        province: true,
      },
      orderBy: [
        { province: { name: "asc" } },
        { type: "asc" },
        { name: "asc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const pageSize = limit;

  return NextResponse.json({
    ok: true,
    meta: {
      page,
      pageSize,
      total,
      totalPage: Math.ceil(total / pageSize),
    },
    data,
  });
}

// post
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || user.roleCode !== "MANAGER") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { code, name, type, provinceId } = body;

  if (!code || !name || !type || !provinceId) {
    return NextResponse.json(
      { ok: false, error: "Data tidak lengkap" },
      { status: 400 }
    );
  }

  const city = await prisma.city.create({
    data: {
      code: String(code).trim(),
      name: String(name).trim(),
      type,
      provinceId: Number(provinceId),
    },
  });

  return NextResponse.json({ ok: true, data: city });
}
