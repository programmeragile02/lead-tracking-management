import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { ok: false, message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const fileObj = file as File;

    // cek tipe file
    if (!fileObj.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, message: "File harus berupa gambar (JPG, PNG, dll)" },
        { status: 400 }
      );
    }

    // batas ukuran 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (fileObj.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Ukuran foto maksimal 2MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "employees"
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    const originalName = fileObj.name || "photo.jpg";
    const ext = path.extname(originalName) || ".jpg";
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicPath = `/uploads/employees/${fileName}`;

    return NextResponse.json({ ok: true, path: publicPath });
  } catch (err: any) {
    console.error("Upload employee photo error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengupload foto", error: err?.message },
      { status: 500 }
    );
  }
}
