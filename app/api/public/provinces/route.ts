import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.province.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  return NextResponse.json({
    ok: true,
    data,
  });
}
