import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type UpdateBody = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  photo?: string | null;
  address?: string | null;
  roleCode?: "MANAGER" | "TEAM_LEADER" | "SALES" | "SUPERADMIN";
  managerId?: number | null;
  teamLeaderId?: number | null;
  isActive?: boolean;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = Number(id);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { ok: false, message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const json = (await req.json()) as UpdateBody;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { ok: false, message: "Pegawai tidak ditemukan" },
        { status: 404 }
      );
    }

    const data: any = {};

    if (json.name !== undefined) data.name = json.name;
    if (json.email !== undefined) data.email = json.email;
    if (json.phone !== undefined) data.phone = json.phone;
    if (json.photo !== undefined) data.photo = json.photo;
    if (json.address !== undefined) data.address = json.address;
    if (json.isActive !== undefined) data.isActive = json.isActive;

    if (json.password) {
      data.password = await bcrypt.hash(json.password, 10);
    }

    // role & hierarki
    if (json.roleCode) {
      const role = await prisma.role.findUnique({
        where: { code: json.roleCode },
      });
      if (!role) {
        return NextResponse.json(
          { ok: false, message: `Role ${json.roleCode} tidak ditemukan` },
          { status: 400 }
        );
      }

      data.role = { connect: { id: role.id } };

      if (json.roleCode === "MANAGER") {
        data.manager = { disconnect: true };
        data.teamLeader = { disconnect: true };
      } else if (json.roleCode === "TEAM_LEADER") {
        if (!json.managerId) {
          return NextResponse.json(
            { ok: false, message: "managerId wajib diisi untuk Team Leader" },
            { status: 400 }
          );
        }
        data.manager = { connect: { id: Number(json.managerId) } };
        data.teamLeader = { disconnect: true };
      } else if (json.roleCode === "SALES") {
        if (!json.teamLeaderId) {
          return NextResponse.json(
            { ok: false, message: "teamLeaderId wajib diisi untuk Sales" },
            { status: 400 }
          );
        }
        data.teamLeader = { connect: { id: Number(json.teamLeaderId) } };
        data.manager = { disconnect: true };
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/employees/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengupdate pegawai", error: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = Number(id);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { ok: false, message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.deletedAt) {
      return NextResponse.json(
        { ok: false, message: "Pegawai tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/employees/[id] error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menghapus pegawai", error: err?.message },
      { status: 500 }
    );
  }
}
