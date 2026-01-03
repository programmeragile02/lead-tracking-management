import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

function serializeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    photo: user.photo,
    roleName: user.role?.name ?? null,
    roleCode: user.role?.code ?? null,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

// GET /api/profile → data user + stats lead
export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { role: true },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    );
  }

  // ----- STATISTIK LEAD UNTUK USER INI -----
  const totalLeads = await prisma.lead.count({
    where: { salesId: user.id, isExcluded: false },
  });

  // closing = lead yang punya priceClosing (asumsi close won)
  const closingAgg = await prisma.lead.aggregate({
    _count: { _all: true },
    _sum: { priceClosing: true },
    where: {
      salesId: user.id,
      priceClosing: { not: null },
    },
  });

  const totalClosing = closingAgg._count._all;
  const totalClosingAmount = Number(closingAgg._sum.priceClosing ?? 0);

  const conversionRate = totalLeads > 0 ? (totalClosing / totalLeads) * 100 : 0;

  return NextResponse.json({
    ok: true,
    data: {
      user: serializeUser(user),
      stats: {
        totalLeads,
        totalClosing,
        conversionRate,
        totalClosingAmount,
      },
    },
  });
}

// PUT /api/profile → update profil (tetap hanya USER, tanpa stats)
export async function PUT(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const { name, email, phone, address } = body as {
    name?: string;
    email?: string;
    phone?: string | null;
    address?: string | null;
  };

  const dataToUpdate: any = {};
  if (typeof name === "string" && name.trim()) dataToUpdate.name = name.trim();
  if (typeof email === "string" && email.trim())
    dataToUpdate.email = email.trim();
  if (phone !== undefined) dataToUpdate.phone = phone || null;
  if (address !== undefined) dataToUpdate.address = address || null;

  if (Object.keys(dataToUpdate).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Tidak ada data yang diubah" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: dataToUpdate,
      include: { role: true },
    });

    return NextResponse.json({
      ok: true,
      data: serializeUser(updated),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Gagal mengupdate profil" },
      { status: 500 }
    );
  }
}
