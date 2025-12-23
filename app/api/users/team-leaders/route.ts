import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || user.roleSlug !== "manager") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const data = await prisma.user.findMany({
    where: {
      role: { code: "TEAM_LEADER" },
      isActive: true,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ok: true, data });
}
