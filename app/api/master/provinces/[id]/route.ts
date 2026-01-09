import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user || user.roleCode !== "SUPERADMIN") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const provinceId = Number(id);
  if (Number.isNaN(provinceId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const data: any = {};

  if (body.code !== undefined) {
    data.code = String(body.code).trim();
  }
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const province = await prisma.province.update({
    where: { id: provinceId },
    data,
  });

  return NextResponse.json({ ok: true, data: province });
}

// delete
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user || user.roleCode !== "SUPERADMIN") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const provinceId = Number(id);
  if (Number.isNaN(provinceId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 }
    );
  }

  // 1️ masih punya city?
  const cityCount = await prisma.city.count({
    where: { provinceId },
  });
  if (cityCount > 0) {
    return NextResponse.json(
      { ok: false, error: "Province masih memiliki city" },
      { status: 409 }
    );
  }

  // 2️ masih dipakai lead?
  const leadCount = await prisma.lead.count({
    where: { provinceId },
  });
  if (leadCount > 0) {
    return NextResponse.json(
      { ok: false, error: "Province masih dipakai lead" },
      { status: 409 }
    );
  }

  await prisma.province.delete({
    where: { id: provinceId },
  });

  return NextResponse.json({ ok: true });
}
