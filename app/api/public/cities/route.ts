import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || 1);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
  const provinceId = searchParams.get("provinceId");

  const where: any = {
    isActive: true,
    ...(provinceId ? { provinceId: Number(provinceId) } : {}),
    ...(q
      ? {
          OR: [
            {
              name: {
                contains: q,
              },
            },
            {
              province: {
                name: {
                  contains: q,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.city.count({ where }),
    prisma.city.findMany({
      where,
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: data.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type, // KOTA / KABUPATEN
      fullName: `${c.type === "KABUPATEN" ? "Kab." : ""} ${c.name}`,
      province: c.province,
    })),
  });
}
