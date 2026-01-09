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
  const cityId = Number(id);
  if (Number.isNaN(cityId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const data: any = {};

  // CODE = STRING (WAJIB)
  if (body.code !== undefined) {
    data.code = String(body.code).trim();
  }

  if (body.name !== undefined) {
    data.name = String(body.name).trim();
  }

  if (body.type !== undefined) {
    data.type = body.type;
  }

  if (body.provinceId !== undefined) {
    data.provinceId = Number(body.provinceId);
  }

  const city = await prisma.city.update({
    where: { id: cityId },
    data,
  });

  return NextResponse.json({ ok: true, data: city });
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
  const cityId = Number(id);
  if (Number.isNaN(cityId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 }
    );
  }

  // masih dipakai lead?
  const leadCount = await prisma.lead.count({
    where: { cityId },
  });
  if (leadCount > 0) {
    return NextResponse.json(
      { ok: false, error: "City masih dipakai lead" },
      { status: 409 }
    );
  }

  await prisma.city.delete({
    where: { id: cityId },
  });

  return NextResponse.json({ ok: true });
}
