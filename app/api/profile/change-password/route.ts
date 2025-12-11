import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { ok: false, error: "Password saat ini dan password baru wajib diisi." },
      { status: 400 }
    );
  }

  // Validasi sederhana password baru (bisa kamu adjust)
  if (newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password baru minimal 8 karakter." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cek password saat ini
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: "Password saat ini tidak sesuai." },
        { status: 400 }
      );
    }

    // Jangan biarkan password baru sama dengan lama
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return NextResponse.json(
        {
          ok: false,
          error: "Password baru tidak boleh sama dengan password sebelumnya.",
        },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({
      ok: true,
      message: "Password berhasil diubah.",
    });
  } catch (err) {
    console.error("Error change password:", err);
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan saat mengubah password." },
      { status: 500 }
    );
  }
}
