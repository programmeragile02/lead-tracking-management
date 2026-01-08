import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cityId = Number(id);

  if (Number.isNaN(cityId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid city id" },
      { status: 400 }
    );
  }

  const city = await prisma.city.findFirst({
    where: {
      id: cityId,
      isActive: true,
    },
    include: {
      province: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!city) {
    return NextResponse.json(
      { ok: false, error: "City not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: city.id,
      name: city.name,
      type: city.type,
      fullName: `${city.type === "KABUPATEN" ? "Kab." : ""} ${city.name}`,
      province: city.province,
    },
  });
}
