import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  const items = await prisma.nurturingCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const code = String(body?.code ?? "").trim();
  const order = Number.isFinite(Number(body?.order)) ? Number(body.order) : 0;
  const isActive = body?.isActive === false ? false : true;

  if (!name)
    return NextResponse.json(
      { ok: false, error: "Nama kategori wajib" },
      { status: 400 }
    );
  if (!code)
    return NextResponse.json(
      { ok: false, error: "Code kategori wajib" },
      { status: 400 }
    );

  const created = await prisma.nurturingCategory.create({
    data: { name, code, order, isActive },
  });

  return NextResponse.json({ ok: true, data: created });
}
