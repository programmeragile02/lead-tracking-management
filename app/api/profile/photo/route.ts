import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { ok: false, error: "Form data tidak valid" },
      { status: 400 }
    );
  }

  const file = formData.get("photo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "File foto tidak ditemukan" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: "Ukuran foto maksimal 2MB" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Tipe file harus JPG, PNG, atau WEBP" },
      { status: 400 }
    );
  }

  // Ambil user untuk tahu foto lama
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User tidak ditemukan" },
      { status: 404 }
    );
  }

  // Siapkan folder upload
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "profile");
  await fs.mkdir(uploadsDir, { recursive: true });

  // Tentukan nama file baru
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
      ? "webp"
      : "jpg";
  const filename = `user-${user.id}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, filename);
  const publicPath = `/uploads/profile/${filename}`;

  // Simpan file
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Hapus foto lama kalau ada dan berada di folder uploads/profile
  if (user.photo && user.photo.startsWith("/uploads/profile/")) {
    const oldPath = path.join(process.cwd(), "public", user.photo);
    fs.unlink(oldPath).catch(() => {
      // abaikan error kalau file sudah tidak ada
    });
  }

  // Update DB
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { photo: publicPath },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      photo: updated.photo,
      roleName: null,
      roleCode: null,
      createdAt: updated.createdAt,
      lastLogin: updated.lastLogin,
    },
  });
}
