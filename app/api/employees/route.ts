import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RoleCode = "MANAGER" | "TEAM_LEADER" | "SALES" | "SUPERADMIN";

type CreateBody = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  photo?: string;
  address?: string;
  roleCode: RoleCode;
  managerId?: number | null;
  teamLeaderId?: number | null;
};

// GET /api/employees
// - normal:   ?page=1&pageSize=10&q=...
// - dropdown: ?onlyActive=true  (tanpa pagination)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qRaw = searchParams.get("q");
    const q = qRaw?.trim() || "";
    const onlyActive = searchParams.get("onlyActive") === "true";

    const pageParam = Number(searchParams.get("page") || "1");
    const pageSizeParam = Number(searchParams.get("pageSize") || "10");

    const where: any = {
      deletedAt: null,
    };

    if (onlyActive) {
      where.isActive = true;
    }

    if (q) {
      const qTrim = q.trim();
      const qUpper = qTrim.toUpperCase();

      where.OR = [
        { name: { contains: qTrim } },
        { email: { contains: qTrim } },
        { phone: { contains: qTrim } },
        {
          role: {
            code: { contains: qUpper },
          },
        },
      ];
    }

    // === MODE: hanya onlyActive (dropdown atasan) → tanpa pagination ===
    if (
      onlyActive &&
      !searchParams.get("page") &&
      !searchParams.get("pageSize")
    ) {
      const users = await prisma.user.findMany({
        where,
        include: {
          role: true,
          manager: true,
          teamLeader: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      const data = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        photo: u.photo,
        address: u.address,
        roleCode: (u.role?.code || null) as RoleCode | null,
        status:
          !u.deletedAt && u.isActive
            ? ("AKTIF" as const)
            : ("NONAKTIF" as const),
        managerName: u.manager ? u.manager.name : null,
        teamLeaderName: u.teamLeader ? u.teamLeader.name : null,
        managerId: u.managerId,
        teamLeaderId: u.teamLeaderId,
      }));

      return NextResponse.json({ ok: true, data });
    }

    // === MODE: list utama dengan pagination ===
    const page = pageParam > 0 ? pageParam : 1;
    const pageSize =
      pageSizeParam > 0 && pageSizeParam <= 100 ? pageSizeParam : 10;

    const total = await prisma.user.count({ where });

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
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      photo: u.photo,
      address: u.address,
      roleCode: (u.role?.code || null) as RoleCode | null,
      status:
        !u.deletedAt && u.isActive ? ("AKTIF" as const) : ("NONAKTIF" as const),
      managerName: u.manager ? u.manager.name : null,
      teamLeaderName: u.teamLeader ? u.teamLeader.name : null,
      managerId: u.managerId,
      teamLeaderId: u.teamLeaderId,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      ok: true,
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error("GET /api/employees error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat data pegawai" },
      { status: 500 }
    );
  }
}

// POST /api/employees
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
