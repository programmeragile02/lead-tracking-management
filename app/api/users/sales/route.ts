import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teamLeaderId = searchParams.get("teamLeaderId");

  const where: any = {
    role: { code: "SALES" },
    isActive: true,
  };

  if (user.roleSlug === "team-leader") {
    where.teamLeaderId = user.id;
  }

  if (user.roleSlug === "manager" && teamLeaderId) {
    where.teamLeaderId = Number(teamLeaderId);
  }

  const data = await prisma.user.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ok: true, data });
}
