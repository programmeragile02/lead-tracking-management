import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  const where: any = {
    deletedAt: null,
  };

  if (q) {
    const qTrim = q.trim();

    where.OR = [
      { name: { contains: qTrim } },
      { email: { contains: qTrim } },
      { phone: { contains: qTrim } },
      {
        role: {
          code: { contains: qTrim.toUpperCase() },
        },
      },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      role: true,
      manager: true,
      teamLeader: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    photo: u.photo,
    address: u.address,
    roleCode: u.role?.code || null,
    status:
      !u.deletedAt && u.isActive ? ("AKTIF" as const) : ("NONAKTIF" as const),
    managerName: u.manager ? u.manager.name : null,
    teamLeaderName: u.teamLeader ? u.teamLeader.name : null,
    managerId: u.managerId,
    teamLeaderId: u.teamLeaderId,
  }));

  return NextResponse.json({ ok: true, data });
}

type CreateBody = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  photo?: string;
  address?: string;
  roleCode: "MANAGER" | "TEAM_LEADER" | "SALES";
  managerId?: number | null;
  teamLeaderId?: number | null;
};

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as CreateBody;

    if (!json.name || !json.email || !json.password || !json.roleCode) {
      return NextResponse.json(
        {
          ok: false,
          message: "name, email, password, dan roleCode wajib diisi",
        },
        { status: 400 }
      );
    }

    // cari role
    const role = await prisma.role.findUnique({
      where: { code: json.roleCode },
    });

    if (!role) {
      return NextResponse.json(
        { ok: false, message: `Role ${json.roleCode} tidak ditemukan` },
        { status: 400 }
      );
    }

    // validasi hierarki sederhana
    let managerId: number | null = null;
    let teamLeaderId: number | null = null;

    if (json.roleCode === "TEAM_LEADER") {
      if (!json.managerId) {
        return NextResponse.json(
          { ok: false, message: "managerId wajib diisi untuk Team Leader" },
          { status: 400 }
        );
      }
      managerId = Number(json.managerId);
    }

    if (json.roleCode === "SALES") {
      if (!json.teamLeaderId) {
        return NextResponse.json(
          { ok: false, message: "teamLeaderId wajib diisi untuk Sales" },
          { status: 400 }
        );
      }
      teamLeaderId = Number(json.teamLeaderId);
    }

    const hashedPassword = await bcrypt.hash(json.password, 10);

    const created = await prisma.user.create({
      data: {
        name: json.name,
        email: json.email,
        password: hashedPassword,
        phone: json.phone || null,
        photo: json.photo || null,
        address: json.address || null,
        isActive: true,
        role: { connect: { id: role.id } },
        ...(managerId && {
          manager: {
            connect: { id: managerId },
          },
        }),
        ...(teamLeaderId && {
          teamLeader: {
            connect: { id: teamLeaderId },
          },
        }),
      },
      include: {
        role: true,
        manager: true,
        teamLeader: true,
      },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/employees error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal membuat pegawai", error: err?.message },
      { status: 500 }
    );
  }
}
